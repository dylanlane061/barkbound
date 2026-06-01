import type {
  Signal,
  SignalCategory,
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

const round2 = (n: number): number => Math.round(n * 100) / 100;

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

  // Accumulate per-category totals so we can expose a transparent breakdown.
  // All signals in a category share the same weight, so a category's weighted
  // sum is simply weight × (sum of its confidences).
  const groups = new Map<SignalCategory, { weight: number; confSum: number; count: number }>();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = CATEGORY_WEIGHTS[signal.category] ?? 1.0;
    weightedSum += signal.confidence * weight;
    totalWeight += weight;

    const g = groups.get(signal.category) ?? { weight, confSum: 0, count: 0 };
    g.confSum += signal.confidence;
    g.count += 1;
    groups.set(signal.category, g);
  }

  const base = weightedSum / totalWeight;
  // Each additional source that corroborates adds up to 0.2 bonus confidence
  const sourceBoost = Math.min(0.1 * (sourcesConsulted.length - 1), 0.2);
  const confidence = Math.round(Math.min(base + sourceBoost, 1) * 100) / 100;

  const contributions: ScoreContribution[] = [...groups.entries()]
    .map(([category, g]) => ({
      category,
      signalCount: g.count,
      weight: g.weight,
      averageConfidence: round2(g.confSum / g.count),
      contribution: round2((g.weight * g.confSum) / weightedSum),
    }))
    .sort((a, b) => b.contribution - a.contribution);

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
