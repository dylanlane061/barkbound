import { matchPetPolicy, type PolicyClaim } from '@pawsignal';
import type { SignalCategory, SignalValue } from '@pawsignal';

/**
 * LLM-backed pet-policy extractor (PawSignal Sources Plan — Phase A).
 *
 * WHY THIS EXISTS
 * The pure regex matcher (`pawsignal/extract/website.ts`) is fast and free but
 * English-keyword-only: it misses paraphrases, tables, exact numbers, and breed
 * rules. This module asks Claude to read cleaned page text and propose claims —
 * but it does NOT trust the model blindly.
 *
 * THE QUOTE CONTRACT (how this stays Evidence-First & Transparent)
 * Every claim Claude returns MUST carry a `quote` copied verbatim from the input.
 * We then verify, in code, that the quote actually appears in the source text and
 * drop any claim that fails. The model *proposes*; the quote *proves*. The stored
 * evidence is the verbatim quote — identical in shape to the regex matcher's
 * output — so the DB, the evidence display, and `score()` are all unchanged.
 *
 * WHERE IT LIVES
 * In the `src/` IO layer (next to the network code in `website.ts`), never inside
 * PawSignal's pure core — the core stays deterministic and framework-free.
 *
 * COST
 * Haiku over a few KB of text is fractions of a cent, runs on-demand per place,
 * and only when ANTHROPIC_API_KEY is set. With no key, callers fall back to the
 * regex matcher automatically (see `extractPolicyClaims`).
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_INPUT_CHARS = 24_000; // cap tokens/cost; website.ts already trimmed to 60k
const MAX_OUTPUT_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_CONFIDENCE = 0.95; // never let the model claim near-certainty
const REVIEW_MAX_CONFIDENCE = 0.7; // reviews are anecdotal — cap their confidence lower
const DEFAULT_CONFIDENCE = 0.7; // used when the model omits/garbles confidence
const MIN_QUOTE_CHARS = 8; // shorter "quotes" are too vague to be real evidence

// What kind of text we're reading. `website` is an authoritative policy statement;
// `reviews` are anecdotal visitor experience (lower trust, capped confidence). The
// stored evidence and category set are identical — only the prompt and confidence
// ceiling differ.
export type ExtractionMode = 'website' | 'reviews';

const CATEGORIES: readonly SignalCategory[] = [
  'pets_allowed',
  'size_restriction',
  'leash_required',
  'pet_fee',
  'designated_area',
  'water_access',
  'trail_access',
];

const BOOLEAN_CATEGORIES = new Set<SignalCategory>([
  'pets_allowed',
  'leash_required',
  'water_access',
  'trail_access',
]);

/** True when an Anthropic key is configured and LLM extraction can run. */
export function llmExtractionEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function model(): string {
  return process.env.PAWSIGNAL_LLM_MODEL || DEFAULT_MODEL;
}

// --- Pure, network-free helpers (unit-testable) -------------------------------

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

function cleanQuote(sentence: string): string {
  const q = sentence.replace(/\s+/g, ' ').trim();
  return q.length > 180 ? `${q.slice(0, 177)}…` : q;
}

/**
 * Verify a model-supplied quote is actually present in the source text. Tolerant
 * of whitespace and case differences (the model often reflows spacing), but the
 * substance must match — this is the check that keeps the evidence chain honest.
 */
export function quoteIsGrounded(quote: string, sourceText: string): boolean {
  if (typeof quote !== 'string') return false;
  const q = normalizeWs(quote);
  if (q.length < MIN_QUOTE_CHARS) return false;
  return normalizeWs(sourceText).includes(q);
}

interface RawClaim {
  category?: unknown;
  value?: unknown;
  confidence?: unknown;
  quote?: unknown;
}

/**
 * Pull a JSON array of claims out of the model's raw text response. Tolerates
 * markdown code fences and leading/trailing prose by slicing to the outermost
 * brackets. Returns [] on anything unparseable — never throws.
 */
export function parseClaims(responseText: string): RawClaim[] {
  if (!responseText) return [];
  const cleaned = responseText.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed as RawClaim[]) : [];
  } catch {
    return [];
  }
}

function coerceValue(category: SignalCategory, value: unknown): SignalValue {
  if (BOOLEAN_CATEGORIES.has(category)) {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 'yes') return true;
    if (value === 'false' || value === 'no') return false;
    // Unspecified boolean defaults to the affirmative reading; a *negative*
    // pets_allowed only ever comes from an explicit false/no above.
    return true;
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return 'yes';
}

/**
 * Validate + ground raw model claims into stored-evidence-ready PolicyClaims.
 * Drops anything with an unknown category, a missing/ungrounded quote, or a
 * non-positive confidence. Pure — no network, safe to unit-test.
 */
export function groundClaims(
  raw: RawClaim[],
  sourceText: string,
  maxConfidence: number = MAX_CONFIDENCE,
): PolicyClaim[] {
  const out: PolicyClaim[] = [];
  for (const c of raw) {
    const category = c.category as SignalCategory;
    if (!CATEGORIES.includes(category)) continue;
    if (typeof c.quote !== 'string' || !quoteIsGrounded(c.quote, sourceText)) continue;

    let confidence = Number(c.confidence);
    if (!Number.isFinite(confidence)) confidence = DEFAULT_CONFIDENCE;
    confidence = clamp(confidence, 0.1, maxConfidence);

    out.push({
      category,
      value: coerceValue(category, c.value),
      confidence,
      quote: cleanQuote(c.quote),
    });
  }
  return out;
}

// --- Prompt -------------------------------------------------------------------

const CATEGORY_SPEC = `CATEGORIES and their value type:
- "pets_allowed"      value: true (dogs welcome) or false (dogs not allowed / service animals only)
- "leash_required"    value: true (leash required) or false (off-leash allowed)
- "water_access"      value: true (dog water bowls/stations provided)
- "trail_access"      value: true (dogs allowed on trails)
- "designated_area"   value: short string, e.g. "dog park", "fenced run", "patio only"
- "pet_fee"           value: the amount as a string (e.g. "$25/night") or "yes" if a fee exists but no amount
- "size_restriction"  value: short string describing the limit, e.g. "under 40 lbs", "2 dogs max", "small dogs only"`;

const WEBSITE_PROMPT = `You extract a place's DOG/PET policy from its official website text for a dog-travel research tool.

Read the text and return ONLY a JSON array (no prose, no markdown). Each element:
{ "category": <one of the categories below>, "value": <see below>, "confidence": <0..1>, "quote": <verbatim substring of the input> }

${CATEGORY_SPEC}

RULES:
- The "quote" MUST be copied verbatim from the input text — the exact sentence or phrase the claim is based on. Do not paraphrase. If you cannot supply a real verbatim quote, omit the claim.
- Only include a claim if the text actually states it. Do not infer beyond the evidence. If nothing is stated, return [].
- Prefer the most specific evidence (exact numbers/amounts) over vague phrasing.
- "confidence" reflects how clearly the quote states the claim (explicit policy ~0.9; implied ~0.6).
- Negation wins: "dogs are not allowed" → pets_allowed:false, never true.
- Return at most one claim per category — the single best-supported one.`;

const REVIEWS_PROMPT = `You extract DOG-related observations from visitor REVIEWS of a place, for a dog-travel research tool.

Reviews are anecdotal first-hand experience, not official policy — a single reviewer can be wrong or out of date. Read them and return ONLY a JSON array (no prose, no markdown). Each element:
{ "category": <one of the categories below>, "value": <see below>, "confidence": <0..1>, "quote": <verbatim substring of the input> }

${CATEGORY_SPEC}

RULES:
- The "quote" MUST be copied verbatim from a review — the exact phrase the observation is based on. Do not paraphrase. No real quote ⇒ omit the claim.
- Only extract direct dog/pet observations ("we brought our dog", "they had a water bowl out front", "dog-friendly patio", "wouldn't let us in with our dog"). Ignore generic praise unrelated to pets. If nothing dog-related is said, return [].
- Reviews are weaker than policy: keep "confidence" modest (clear repeated experience ~0.6; a single passing mention ~0.4).
- Negation wins: "they turned us away because of our dog" → pets_allowed:false.
- Return at most one claim per category — the best-supported across all the reviews.`;

function systemPromptFor(mode: ExtractionMode): string {
  return mode === 'reviews' ? REVIEWS_PROMPT : WEBSITE_PROMPT;
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
}

/**
 * Ask Claude to extract grounded pet-policy claims from `text`. Returns only
 * claims whose quotes verify against `text`. Throws on network/API failure so
 * the caller can fall back to the regex matcher.
 */
export async function extractClaims(
  text: string,
  mode: ExtractionMode = 'website',
): Promise<PolicyClaim[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');

  const input = text.slice(0, MAX_INPUT_CHARS);

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model(),
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPromptFor(mode),
      messages: [{ role: 'user', content: input }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Anthropic ${res.status} ${res.statusText}` +
        (body ? ` — ${body.replace(/\s+/g, ' ').trim().slice(0, 200)}` : ''),
    );
  }

  const data = (await res.json()) as AnthropicResponse;
  const responseText = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n');

  const maxConfidence = mode === 'reviews' ? REVIEW_MAX_CONFIDENCE : MAX_CONFIDENCE;
  return groundClaims(parseClaims(responseText), input, maxConfidence);
}

/**
 * Extract dog-related claims from visitor reviews. Reviews are joined into one
 * block (quotes still verify against it). Returns [] when the LLM is disabled or
 * errors — reviews are a bonus signal, never required for an assessment.
 */
export async function extractReviewClaims(reviews: string[]): Promise<PolicyClaim[]> {
  const text = reviews.map((r) => r.trim()).filter(Boolean).join('\n\n---\n\n');
  if (!text || !llmExtractionEnabled()) return [];
  try {
    return await extractClaims(text, 'reviews');
  } catch {
    return [];
  }
}

/**
 * The orchestrator the IO layer calls. Uses the LLM extractor when a key is
 * present and falls back to the pure regex matcher otherwise — or whenever the
 * LLM errors or returns nothing. When the LLM succeeds, regex claims fill any
 * categories the model didn't cover (belt and suspenders, more recall, no loss).
 */
export async function extractPolicyClaims(text: string): Promise<PolicyClaim[]> {
  const regexClaims = matchPetPolicy(text);

  if (!llmExtractionEnabled()) return regexClaims;

  let llmClaims: PolicyClaim[];
  try {
    llmClaims = await extractClaims(text);
  } catch {
    return regexClaims; // network/API failure — degrade gracefully, never block assessment
  }

  if (llmClaims.length === 0) return regexClaims;

  // Merge: keep all LLM claims; add regex claims for categories the LLM missed.
  const covered = new Set(llmClaims.map((c) => c.category));
  const gapFill = regexClaims.filter((c) => !covered.has(c.category));
  return [...llmClaims, ...gapFill];
}
