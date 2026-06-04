import { inArray } from 'drizzle-orm';
import { score } from '@pawsignal';
import type { Signal, SourceId } from '@pawsignal';
import { db } from '@/db/client';
import { rawRecords, signals as signalsTable } from '@/db/schema';
import { confOf, toScore100, type ConfTier } from '@/lib/design/confidence';

export type PlaceScore = {
  /** 0–100 PawSignal score (confidence × 100). */
  score: number;
  /** Raw aggregate confidence (0–1). */
  confidence: number;
  tier: ConfTier;
  signalCount: number;
  sources: string[];
  /** One-line "why" from the top-contributing signal category. */
  reason: string;
};

// Human phrasing for each signal category — used for the one-line "why" on
// result cards and saved rows.
const CATEGORY_REASON: Record<string, string> = {
  pets_allowed: 'Dogs allowed',
  designated_area: 'Designated dog area',
  leash_required: 'Leashed dogs welcome',
  water_access: 'Water access for dogs',
  trail_access: 'Dog-friendly trails',
  pet_fee: 'Pet fee applies',
  size_restriction: 'Size restrictions apply',
};

// Bulk-score a set of places from their stored signals + sources. Loading
// signals and sources in two `IN (...)` queries (instead of per-place) keeps the
// gallery / Discover list off the N+1 path. Returns a map keyed by place id;
// places with no signals are simply absent (callers treat assessed_at as the
// source of truth for "has it been assessed").
export async function assessPlaces(placeIds: string[]): Promise<Map<string, PlaceScore>> {
  const result = new Map<string, PlaceScore>();
  if (placeIds.length === 0) return result;

  const [sigRows, sourceRows] = await Promise.all([
    db.select().from(signalsTable).where(inArray(signalsTable.placeId, placeIds)),
    db
      .selectDistinct({ placeId: rawRecords.placeId, source: rawRecords.source })
      .from(rawRecords)
      .where(inArray(rawRecords.placeId, placeIds)),
  ]);

  const byPlace = new Map<string, Signal[]>();
  for (const s of sigRows) {
    const list = byPlace.get(s.placeId) ?? [];
    list.push({
      id: s.id,
      placeId: s.placeId,
      category: s.category as Signal['category'],
      value: s.value as Signal['value'],
      confidence: s.confidence,
      evidenceIds: s.evidenceIds,
      extractedAt: s.extractedAt,
    });
    byPlace.set(s.placeId, list);
  }

  const sourcesByPlace = new Map<string, string[]>();
  for (const r of sourceRows) {
    const list = sourcesByPlace.get(r.placeId) ?? [];
    list.push(r.source);
    sourcesByPlace.set(r.placeId, list);
  }

  for (const [placeId, sigs] of byPlace) {
    const sources = sourcesByPlace.get(placeId) ?? [];
    const assessment = score(placeId, sigs, sources as SourceId[]);
    const s = toScore100(assessment.confidence);
    const topCategory = assessment.breakdown.contributions[0]?.category;
    result.set(placeId, {
      score: s,
      confidence: assessment.confidence,
      tier: confOf(s),
      signalCount: sigs.length,
      sources,
      reason: (topCategory && CATEGORY_REASON[topCategory]) || 'Dog-friendly signals found',
    });
  }

  return result;
}
