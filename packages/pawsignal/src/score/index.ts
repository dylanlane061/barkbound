import type { Signal, PlaceAssessment, SourceId } from '../types.js';

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

export function score(
  placeId: string,
  signals: Signal[],
  sourcesConsulted: SourceId[],
): PlaceAssessment {
  if (signals.length === 0) {
    return { placeId, confidence: 0, signals, sourcesConsulted, computedAt: new Date() };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = CATEGORY_WEIGHTS[signal.category] ?? 1.0;
    weightedSum += signal.confidence * weight;
    totalWeight += weight;
  }

  const base = weightedSum / totalWeight;
  // Each additional source that corroborates adds up to 0.2 bonus confidence
  const sourceBoost = Math.min(0.1 * (sourcesConsulted.length - 1), 0.2);
  const confidence = Math.round(Math.min(base + sourceBoost, 1) * 100) / 100;

  return { placeId, confidence, signals, sourcesConsulted, computedAt: new Date() };
}
