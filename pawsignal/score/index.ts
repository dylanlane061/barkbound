import type {
  Signal,
  SignalCategory,
  SignalValue,
  PlaceAssessment,
  ScoreContribution,
  SourceId,
} from '../types';

// Higher weight = more influential on the aggregate confidence score
const CATEGORY_WEIGHTS: Record<string, number> = {
  pets_allowed: 2.0,
  size_restriction: 1.5,
  leash_required: 1.2,
  pet_fee: 1.0,
  designated_area: 1.0,
  water_access: 0.8,
  trail_access: 0.8,
};

// How much to trust a signal based on WHO said it. A place's own website is the
// most authoritative statement of its pet policy; official agencies rank high;
// individual reviews are noisy and crowd-sourced map tags are middling. Applied
// multiplicatively to the category weight, so an official-site claim pulls far
// harder than the same claim from a single review. Unknown sources stay neutral.
const SOURCE_TRUST: Record<string, number> = {
  website: 1.6,
  nps: 1.3,
  recreation_gov: 1.3,
  google: 1.2,
  osm: 1.0,
  user_import: 0.9,
  google_reviews: 0.8,
};

function trustOf(source: Signal['source']): number {
  return source ? SOURCE_TRUST[source] ?? 1.0 : 1.0;
}

// Direction a signal pushes the dog-friendliness score, in [-1, 1]. Confidence
// (how sure we are the signal is true) is applied separately — polarity is
// purely about meaning. Without this, a confident "no dogs allowed" would raise
// the score just like any other evidence; here it subtracts.
export function signalPolarity(category: string, value: SignalValue): number {
  switch (category) {
    case 'pets_allowed':
      // Explicit negation is a strong negative; anything else affirms dogs.
      return value === false || value === 'no' || value === 'none' || value === 'No' ? -1 : 1;
    case 'designated_area':
    case 'water_access':
    case 'trail_access':
      return 1;
    case 'leash_required':
      // Dogs are welcome (leashed, or off-leash when false) — positive either way.
      return value === false ? 1 : 0.8;
    case 'pet_fee':
      // Pets are accommodated, but a fee applies — mildly positive.
      return 0.2;
    case 'size_restriction':
      // A restriction on which dogs are allowed — negative.
      return -0.5;
    default:
      return 1;
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export function score(
  placeId: string,
  signals: Signal[],
  sourcesConsulted: SourceId[],
): PlaceAssessment {
  const computedAt = new Date();

  if (signals.length === 0) {
    return {
      placeId,
      confidence: 0,
      signals,
      sourcesConsulted,
      computedAt,
      breakdown: { signalCount: 0, base: 0, sourceBoost: 0, contributions: [] },
    };
  }

  // Per-category accumulation, polarity- and source-aware. Each signal's
  // EFFECTIVE weight is its category weight × its source-trust multiplier, so a
  // claim from the official website counts for more than the same claim from a
  // single review. `weightedSignedSum` is Σ(polarity × confidence × effWeight)
  // within the category; its net contribution to `base` is that sum / totalWeight.
  const groups = new Map<
    SignalCategory,
    { effWeightSum: number; weightedSignedSum: number; signedSum: number; confSum: number; count: number }
  >();
  let weightedSigned = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const effWeight = (CATEGORY_WEIGHTS[signal.category] ?? 1.0) * trustOf(signal.source);
    const polarity = signalPolarity(signal.category, signal.value);
    const signed = polarity * signal.confidence;
    weightedSigned += signed * effWeight;
    totalWeight += effWeight;

    const g =
      groups.get(signal.category) ??
      { effWeightSum: 0, weightedSignedSum: 0, signedSum: 0, confSum: 0, count: 0 };
    g.effWeightSum += effWeight;
    g.weightedSignedSum += signed * effWeight;
    g.signedSum += signed;
    g.confSum += signal.confidence;
    g.count += 1;
    groups.set(signal.category, g);
  }

  // Net friendliness before boost, clamped into [0, 1]. All-positive evidence
  // reduces to the previous confidence-weighted average; negatives subtract.
  const baseRaw = weightedSigned / totalWeight;
  const base = clamp01(baseRaw);

  // Corroborating sources add confidence — but only to an already-positive
  // assessment; they should never lift a "not allowed" toward friendly.
  const sourceBoost = base > 0 ? Math.min(0.1 * (sourcesConsulted.length - 1), 0.2) : 0;
  const confidence = round2(clamp01(base + sourceBoost));

  const contributions: ScoreContribution[] = [...groups.entries()]
    .map(([category, g]) => ({
      category,
      signalCount: g.count,
      weight: round2(g.effWeightSum),
      averageConfidence: round2(g.confSum / g.count),
      contribution: round2(g.weightedSignedSum / totalWeight),
      polarity: Math.sign(g.signedSum),
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    placeId,
    confidence,
    signals,
    sourcesConsulted,
    computedAt,
    breakdown: {
      signalCount: signals.length,
      base: round2(base),
      sourceBoost: round2(sourceBoost),
      contributions,
    },
  };
}
