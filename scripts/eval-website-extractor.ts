/**
 * Eval + sanity check for the Claude website extractor (PawSignal Phase A).
 *
 * Run:  npm run eval:website
 *
 * Two parts:
 *   1. PURE checks (always run, no network) — assert the quote-grounding and
 *      JSON-parsing logic behaves. Exits non-zero on any failure.
 *   2. LIVE comparison (only if ANTHROPIC_API_KEY is set) — runs both the regex
 *      matcher and the Claude extractor over sample pages and prints them side by
 *      side so you can eyeball the recall/precision lift.
 */
import { matchPetPolicy } from '@pawsignal';
import {
  quoteIsGrounded,
  parseClaims,
  groundClaims,
  extractClaims,
  llmExtractionEnabled,
} from '../src/lib/content/extract-llm';

let failures = 0;
function check(name: string, cond: boolean) {
  const ok = cond ? 'PASS' : 'FAIL';
  if (!cond) failures++;
  console.log(`  [${ok}] ${name}`);
}

// --- Part 1: pure logic -------------------------------------------------------
console.log('\nPure checks (no network):');

const SRC =
  'Welcome! Dogs are welcome in our lobby and on the patio. ' +
  'There is a $25 per night pet fee. Dogs under 40 lbs only. ' +
  'Dogs must be kept on a leash at all times.';

// quoteIsGrounded
check('grounded verbatim quote passes', quoteIsGrounded('Dogs are welcome', SRC));
check('whitespace/case tolerant', quoteIsGrounded('dogs   ARE   welcome', SRC));
check('fabricated quote rejected', !quoteIsGrounded('We have a heated dog pool', SRC));
check('too-short quote rejected', !quoteIsGrounded('dogs', SRC));

// parseClaims
check(
  'parses fenced json',
  parseClaims('```json\n[{"category":"pets_allowed","value":true,"confidence":0.9,"quote":"Dogs are welcome"}]\n```')
    .length === 1,
);
check('parses with surrounding prose', parseClaims('Here you go: [] thanks').length === 0);
check('garbage returns empty', parseClaims('not json at all').length === 0);

// groundClaims — drops ungrounded + unknown categories, keeps grounded
const raw = [
  { category: 'pets_allowed', value: true, confidence: 0.9, quote: 'Dogs are welcome' },
  { category: 'pet_fee', value: '$25/night', confidence: 0.85, quote: 'There is a $25 per night pet fee' },
  { category: 'pets_allowed', value: false, confidence: 0.9, quote: 'FABRICATED no dogs allowed ever' },
  { category: 'not_a_category', value: true, confidence: 0.9, quote: 'Dogs are welcome' },
];
const grounded = groundClaims(raw, SRC);
check('keeps the two grounded claims', grounded.length === 2);
check('drops fabricated quote', !grounded.some((c) => c.value === false));
check('drops unknown category', !grounded.some((c) => (c.category as string) === 'not_a_category'));
check('clamps confidence <= 0.95', groundClaims(
  [{ category: 'pets_allowed', value: true, confidence: 5, quote: 'Dogs are welcome' }],
  SRC,
)[0].confidence <= 0.95);

// --- Part 2: live comparison --------------------------------------------------
const SAMPLES: Array<{ name: string; text: string }> = [
  {
    name: 'boutique hotel',
    text:
      'Pet Policy. We happily welcome up to two well-behaved dogs per room. ' +
      'A non-refundable pet cleaning fee of $50 per stay applies. ' +
      'We kindly ask that dogs weigh no more than 50 pounds and remain leashed in all common areas. ' +
      'Water bowls are available at the front desk.',
  },
  {
    name: 'restaurant (patio only)',
    text:
      'Furry friends are part of the family! Leashed dogs are welcome on our outdoor patio. ' +
      'Unfortunately pets are not permitted inside the dining room. We keep a fresh water bowl by the host stand.',
  },
  {
    name: 'no-pets inn',
    text: 'Our historic inn is not pet-friendly; service animals only. We appreciate your understanding.',
  },
];

async function live() {
  if (!llmExtractionEnabled()) {
    console.log('\nLive comparison skipped (ANTHROPIC_API_KEY not set).');
    return;
  }
  console.log('\nLive comparison (regex vs Claude):');
  for (const s of SAMPLES) {
    console.log(`\n• ${s.name}`);
    const regex = matchPetPolicy(s.text);
    console.log(`    regex  (${regex.length}):`, regex.map((c) => `${c.category}=${String(c.value)}`).join(', ') || '—');
    try {
      const llm = await extractClaims(s.text);
      console.log(`    claude (${llm.length}):`, llm.map((c) => `${c.category}=${String(c.value)}`).join(', ') || '—');
    } catch (err) {
      console.log('    claude: ERROR', err instanceof Error ? err.message : err);
    }
  }
}

live().then(() => {
  console.log(`\n${failures === 0 ? 'All pure checks passed.' : `${failures} pure check(s) FAILED.`}`);
  process.exit(failures === 0 ? 0 : 1);
});
