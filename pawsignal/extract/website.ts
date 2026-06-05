import type { RawRecord, Signal, SignalCategory, SignalValue } from '../types';

type SignalPartial = Omit<Signal, 'id' | 'placeId' | 'extractedAt' | 'evidenceIds'>;

// A pet-policy claim found in website text, carrying the verbatim sentence it
// came from. The quote is the evidence — we never emit a claim without one, so
// the assessment stays traceable (Evidence First).
export interface PolicyClaim {
  category: SignalCategory;
  value: SignalValue;
  confidence: number;
  quote: string;
}

// --- Phrase rules -------------------------------------------------------------
// Each rule is a set of regexes over a single lowercased sentence. Order matters
// inside matchPetPolicy: a negative pets-allowed match suppresses a positive one
// in the same sentence so "dogs are not allowed" is never read as "dogs allowed".

const NEG_PETS = [
  /\bno (dogs?|pets?)\b/,
  /(dogs?|pets?)\s+(?:are\s+|is\s+)?not\s+(?:allowed|permitted|welcome|accepted)/,
  /(?:we\s+)?(?:do not|don'?t|cannot|can'?t)\s+(?:allow|accept|permit)\s+(?:dogs?|pets?)/,
  /pets?\s+(?:are\s+)?prohibited/,
  /not\s+pet[-\s]friendly/,
  /service\s+animals?\s+only/,
];

const POS_PETS = [
  /\b(?:dog|pet)[-\s]friendly\b/,
  /(?:dogs?|pets?)\s+(?:are\s+)?(?:welcome|allowed|permitted|accepted)/,
  /(?:we\s+)?(?:welcome|love|allow|accept)\s+(?:well[-\s]behaved\s+)?(?:dogs?|pets?)/,
  /(?:dogs?|pets?)\s+stay\s+free/,
  /bring\s+your\s+(?:dog|pup|pooch|pet)/,
];

const FEE = [
  /pet\s+fee/,
  /dog\s+fee/,
  /\$\s?\d+(?:\.\d+)?\s*(?:per\s+(?:pet|dog|night|stay)|\/\s*(?:night|pet|dog))/,
  /(?:pet|dog)[^.]{0,25}\$\s?\d+/,
  /(?:per\s+(?:pet|dog))[^.]{0,20}(?:night|stay|day)/,
];

const SIZE = [
  /(?:under|up to|less than|maximum of|max(?:imum)?)\s+\d+\s?(?:lb|lbs|pound|pounds)/,
  /\d+\s?(?:lb|lbs|pound|pounds)[^.]{0,15}(?:limit|max|maximum|or\s+(?:less|under|fewer))/,
  /weight\s+(?:limit|restriction|maximum)/,
  /small\s+dogs?\s+only/,
  /(?:one|two|three|1|2|3)\s+(?:dog|pet)s?\s+(?:per|maximum|max)/,
];

const LEASH = [
  /(?:must|should)\s+be\s+(?:kept\s+)?(?:on\s+a\s+)?leash/,
  /(?:on\s+a\s+)?leash\s+at\s+all\s+times/,
  /leashed\s+(?:dogs?|pets?)/,
  /keep\s+(?:dogs?|pets?)\s+(?:on\s+a\s+)?leash/,
];

const DESIG = [/\bdog\s+park\b/, /\bdog\s+run\b/, /off[-\s]leash\s+(?:area|park)/, /dog\s+(?:relief|potty)\s+area/];
const WATER = [/water\s+bowls?/, /(?:dog|pet)\s+water\s+(?:station|bowl)/, /fresh\s+water\s+for\s+(?:dogs?|pets?)/];

const anyMatch = (regexes: RegExp[], s: string): boolean => regexes.some((re) => re.test(s));

function cleanQuote(sentence: string): string {
  const q = sentence.replace(/\s+/g, ' ').trim();
  return q.length > 180 ? `${q.slice(0, 177)}…` : q;
}

/**
 * Pure, deterministic dog-policy matcher over free website text. Splits into
 * sentences and applies keyword rules with explicit negation handling. Returns
 * at most one claim per category (the highest-confidence one), each with the
 * sentence it was found in. No network, no state — safe to unit-test.
 */
export function matchPetPolicy(text: string): PolicyClaim[] {
  if (!text) return [];
  // Split on sentence terminators and newlines; keep original casing for quotes.
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  // Best claim per category, keyed by category.
  const best = new Map<SignalCategory, PolicyClaim>();
  const consider = (claim: PolicyClaim) => {
    const prev = best.get(claim.category);
    if (!prev || claim.confidence > prev.confidence) best.set(claim.category, claim);
  };

  for (const sentence of sentences) {
    const s = sentence.toLowerCase();
    const quote = cleanQuote(sentence);

    // pets_allowed — negatives win within a sentence.
    if (anyMatch(NEG_PETS, s)) {
      consider({ category: 'pets_allowed', value: false, confidence: 0.85, quote });
    } else if (anyMatch(POS_PETS, s)) {
      consider({ category: 'pets_allowed', value: true, confidence: 0.85, quote });
    }

    if (anyMatch(FEE, s)) {
      const amount = s.match(/\$\s?\d+(?:\.\d+)?/)?.[0]?.replace(/\s/g, '') ?? null;
      consider({ category: 'pet_fee', value: amount ?? 'yes', confidence: 0.8, quote });
    }
    if (anyMatch(SIZE, s)) {
      consider({ category: 'size_restriction', value: 'yes', confidence: 0.8, quote });
    }
    if (anyMatch(LEASH, s)) {
      consider({ category: 'leash_required', value: true, confidence: 0.8, quote });
    }
    if (anyMatch(DESIG, s)) {
      consider({ category: 'designated_area', value: 'on-site dog area', confidence: 0.8, quote });
    }
    if (anyMatch(WATER, s)) {
      consider({ category: 'water_access', value: true, confidence: 0.75, quote });
    }
  }

  // A leash rule or an on-site dog area also implies dogs are welcome, if the
  // page never said so (or denied it) outright — but only weakly.
  if (!best.has('pets_allowed')) {
    const implied = best.get('leash_required') ?? best.get('designated_area');
    if (implied) {
      best.set('pets_allowed', {
        category: 'pets_allowed',
        value: true,
        confidence: 0.7,
        quote: implied.quote,
      });
    }
  }

  return [...best.values()];
}

// --- Extractor ----------------------------------------------------------------
// The raw_record for a website stores the matched `claims` (with quotes) under
// `raw.claims`; we map them straight to signals. As a fallback, if only raw text
// was stored, we run the matcher here so the extractor still works.
export function websiteExtractor(record: RawRecord): SignalPartial[] {
  const raw = record.raw as { claims?: PolicyClaim[]; text?: string };
  const claims = raw.claims ?? (raw.text ? matchPetPolicy(raw.text) : []);
  return claims.map((c) => ({
    category: c.category,
    value: c.value,
    confidence: c.confidence,
    source: 'website' as const,
  }));
}
