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

// Direction (and relative magnitude) a signal pushes the dog-friendliness score,
// in [-1, 1]. Confidence (how sure we are the signal is true) is applied
// separately. The aggregator is ADDITIVE (see score()), so a small positive like
// a pet fee only ever nudges the score up — it can never drag down a strong
// "dogs welcome", which was the flaw in the old averaging model.
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
      // A pet fee CONFIRMS the place accommodates dogs — a mild positive that
      // adds to the evidence; it must never reduce the score.
      return 0.35;
    case 'size_restriction':
      // A restriction on which dogs are allowed — moderate negative.
      return -0.5;
    default:
      return 1;
  }
}

// Aggregation tuning ----------------------------------------------------------
// PRIOR: with no evidence the score is 0; evidence (P) must accumulate past this
// before the score climbs, so a single thin tag stays modest while a strong
// authoritative claim (or several corroborating ones) reaches the 80s–90s.
const PRIOR = 0.55;
// Within ONE category, extra signals corroborate but with diminishing returns,
// so a pile of low-trust reviews can't outweigh one authoritative source.
const DIMINISH = 0.6;

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

  // ADDITIVE evidence model. Each signal yields "evidence points":
  //   points = |polarity| × confidence × categoryWeight × sourceTrust
  // routed to a POSITIVE pool (P) or NEGATIVE pool (N) by the polarity's sign.
  // Within a category we sort by magnitude and apply diminishing returns, so the
  // first (strongest) signal counts fully and extras corroborate with less pull.
  // The score is the share of positive evidence: P / (P + N + PRIOR). This means
  //   • more positive evidence only ever RAISES the score (a pet fee nudges up);
  //   • a confident "no dogs" loads N heavily and drives the score toward 0;
  //   • thin evidence stays modest because PRIOR holds the score down until it
  //     accumulates.
  const groups = new Map<
    SignalCategory,
    { pos: number[]; neg: number[]; confSum: number; count: number; net: number }
  >();

  for (const signal of signals) {
    const polarity = signalPolarity(signal.category, signal.value);
    const magnitude =
      Math.abs(polarity) *
      signal.confidence *
      (CATEGORY_WEIGHTS[signal.category] ?? 1.0) *
      trustOf(signal.source);

    const g =
      groups.get(signal.category) ?? { pos: [], neg: [], confSum: 0, count: 0, net: 0 };
    if (polarity < 0) g.neg.push(magnitude);
    else g.pos.push(magnitude);
    g.confSum += signal.confidence;
    g.count += 1;
    groups.set(signal.category, g);
  }

  // Sum a pool with diminishing returns (strongest first).
  const dimSum = (vals: number[]): number =>
    vals
      .slice()
      .sort((a, b) => b - a)
      .reduce((sum, v, i) => sum + v * Math.pow(DIMINISH, i), 0);

  let P = 0;
  let N = 0;
  for (const g of groups.values()) {
    const pCat = dimSum(g.pos);
    const nCat = dimSum(g.neg);
    g.net = pCat - nCat;
    P += pCat;
    N += nCat;
  }

  const denom = P + N + PRIOR;
  const base = denom > 0 ? clamp01(P / denom) : 0;
  const confidence = round2(base);

  const contributions: ScoreContribution[] = [...groups.entries()]
    .map(([category, g]) => ({
      category,
      signalCount: g.count,
      weight: round2(dimSum(g.pos) + dimSum(g.neg)),
      averageConfidence: round2(g.confSum / g.count),
      // Share of the final score this category accounts for (signed).
      contribution: round2(g.net / denom),
      polarity: Math.sign(g.net),
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
      // Retained for the breakdown shape; corroboration is now intrinsic to the
      // additive model (extra sources add evidence points), not a separate bonus.
      sourceBoost: 0,
      contributions,
    },
  };
}
