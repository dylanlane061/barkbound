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

  // Per-category accumulation, now polarity-aware. `signedSum` is the sum of
  // (polarity × confidence) within the category (per unit weight); the
  // category's net contribution to `base` is weight × signedSum / totalWeight.
  const groups = new Map<
    SignalCategory,
    { weight: number; signedSum: number; confSum: number; count: number }
  >();
  let weightedSigned = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = CATEGORY_WEIGHTS[signal.category] ?? 1.0;
    const polarity = signalPolarity(signal.category, signal.value);
    weightedSigned += polarity * signal.confidence * weight;
    totalWeight += weight;

    const g = groups.get(signal.category) ?? { weight, signedSum: 0, confSum: 0, count: 0 };
    g.signedSum += polarity * signal.confidence;
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
      weight: g.weight,
      averageConfidence: round2(g.confSum / g.count),
      contribution: round2((g.weight * g.signedSum) / totalWeight),
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
