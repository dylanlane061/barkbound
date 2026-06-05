import { eq } from 'drizzle-orm';
import { score, signalPolarity } from '@pawsignal';
import type { Signal, SourceId } from '@pawsignal';
import { db } from '@/db/client';
import { places, rawRecords, signals as signalsTable, tripNodes, trips } from '@/db/schema';
import { confOf, toScore100, type ConfTier } from '@/lib/design/confidence';
import { getSaveTargets, resolveCurrentTrip, type SaveTargetTrip } from '@/lib/current-trip';
import type { CatKey } from '@/lib/design/cats';

const SOURCE_LABEL: Record<string, string> = {
  osm: 'OpenStreetMap',
  google: 'Google',
  nps: 'National Park Service',
  recreation_gov: 'Recreation.gov',
  user_import: 'User report',
};

// Human phrasing for a signal category (claim shown on each evidence row).
const CLAIM: Record<string, string> = {
  pets_allowed: 'Dogs are allowed here',
  designated_area: 'Has a designated dog area',
  leash_required: 'Leashed dogs welcome',
  water_access: 'Water access for dogs',
  trail_access: 'Dog-friendly trail access',
  pet_fee: 'A pet fee applies',
  size_restriction: 'Dog size restrictions apply',
};

// Claim phrasing for negative-polarity signals.
const NEGATIVE_CLAIM: Record<string, string> = {
  pets_allowed: 'Dogs are not allowed here',
  size_restriction: 'Dog size restrictions apply',
};

const TAG: Record<string, string> = {
  pets_allowed: 'Dogs allowed',
  designated_area: 'Designated dog area',
  leash_required: 'Leashed dogs',
  water_access: 'Water access',
  trail_access: 'Trail access',
  pet_fee: 'Pet fee',
  size_restriction: 'Size limits',
};
const NEGATIVE_TAG: Record<string, string> = {
  pets_allowed: 'No dogs',
  size_restriction: 'Size limits',
};

export type EvidenceRow = {
  id: string;
  source: string;
  sourceLabel: string;
  claim: string;
  detail: string | null;
  confidence: number; // 0–1
  tier: ConfTier;
  negative: boolean; // true when this signal lowers the score
  raw: unknown; // the raw_record payload behind this signal
};

export type PlaceDetail = {
  id: string;
  name: string;
  category: CatKey | null;
  city: string | null;
  state: string | null;
  address: string | null;
  assessed: boolean;
  score: number; // 0–100
  confidence: number; // 0–1
  tier: ConfTier;
  sourcesCount: number;
  sources: string[];
  tags: string[];
  evidence: EvidenceRow[];
  saveTarget: { tripId: string; tripName: string; nodeId: string | null } | null;
  saveTargets: SaveTargetTrip[];
  breadcrumb: { label: string; href?: string }[];
};

export async function getPlaceDetail(
  id: string,
  ctx?: { tripId?: string; nodeId?: string },
): Promise<PlaceDetail | null> {
  const [place] = await db.select().from(places).where(eq(places.id, id));
  if (!place) return null;

  const [sigRows, rawRows] = await Promise.all([
    db.select().from(signalsTable).where(eq(signalsTable.placeId, id)),
    db.select().from(rawRecords).where(eq(rawRecords.placeId, id)),
  ]);

  const typedSignals: Signal[] = sigRows.map((s) => ({
    id: s.id,
    placeId: s.placeId,
    category: s.category as Signal['category'],
    value: s.value as Signal['value'],
    confidence: s.confidence,
    evidenceIds: s.evidenceIds,
    extractedAt: s.extractedAt,
  }));

  const sources = [...new Set(rawRows.map((r) => r.source))];
  const assessment = score(id, typedSignals, sources as SourceId[]);
  const scoreVal = toScore100(assessment.confidence);

  const rawById = new Map(rawRows.map((r) => [r.id, r]));

  // One evidence row per signal, strongest first. Negative-polarity signals
  // (e.g. "no dogs allowed") are shown as score-lowering and tinted low (red),
  // not green, regardless of how confident the signal is.
  const evidence: EvidenceRow[] = typedSignals
    .map((s) => {
      const raw = s.evidenceIds.map((eid) => rawById.get(eid)).find(Boolean);
      const sourceId = raw?.source ?? sources[0] ?? 'osm';
      const valueDetail =
        typeof s.value === 'string' && s.value && s.value !== 'true' ? s.value : null;
      const negative = signalPolarity(s.category, s.value) < 0;
      return {
        id: s.id,
        source: sourceId,
        sourceLabel: SOURCE_LABEL[sourceId] ?? sourceId,
        claim: negative ? NEGATIVE_CLAIM[s.category] ?? CLAIM[s.category] ?? s.category : CLAIM[s.category] ?? s.category,
        detail: valueDetail,
        confidence: s.confidence,
        tier: negative ? 'lo' : confOf(toScore100(s.confidence)),
        negative,
        raw: raw?.raw ?? null,
      } satisfies EvidenceRow;
    })
    .sort((a, b) => b.confidence - a.confidence);

  const tags = [
    ...new Set(
      typedSignals
        .map((s) => (signalPolarity(s.category, s.value) < 0 ? NEGATIVE_TAG[s.category] : TAG[s.category]))
        .filter(Boolean),
    ),
  ].slice(0, 5);

  // Save target + breadcrumb.
  let saveTarget: PlaceDetail['saveTarget'] = null;
  const breadcrumb: PlaceDetail['breadcrumb'] = [];

  if (ctx?.tripId) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, ctx.tripId));
    if (trip) {
      saveTarget = { tripId: trip.id, tripName: trip.name, nodeId: ctx.nodeId ?? null };
      breadcrumb.push({ label: 'Trips', href: '/trips' }, { label: trip.name, href: `/trips/${trip.id}` });
      if (ctx.nodeId) {
        const [node] = await db.select().from(tripNodes).where(eq(tripNodes.id, ctx.nodeId));
        if (node?.label) breadcrumb.push({ label: node.label, href: `/discover?location=${encodeURIComponent(node.label)}&trip=${trip.id}&node=${node.id}` });
      }
    }
  }
  if (!saveTarget) {
    const current = await resolveCurrentTrip();
    if (current) saveTarget = { tripId: current.id, tripName: current.name, nodeId: null };
    breadcrumb.push({ label: 'Discover', href: '/discover' });
    if (place.city) breadcrumb.push({ label: place.city, href: `/discover?location=${encodeURIComponent(place.city)}` });
  }
  breadcrumb.push({ label: place.name });

  const saveTargets = await getSaveTargets();

  return {
    id: place.id,
    name: place.name,
    category: (place.category as CatKey | null) ?? null,
    city: place.city,
    state: place.state,
    address: place.address,
    assessed: place.assessedAt != null,
    score: scoreVal,
    confidence: assessment.confidence,
    tier: confOf(scoreVal),
    sourcesCount: sources.length,
    sources,
    tags,
    evidence,
    saveTarget,
    saveTargets,
    breadcrumb,
  };
}
