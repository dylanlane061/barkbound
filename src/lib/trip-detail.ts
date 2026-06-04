import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, tripNodes, tripPlaces, trips } from '@/db/schema';
import { haversineMiles } from '@/ingest/geo';
import { assessPlaces } from '@/lib/assess';
import { stopColor, type ConfTier } from '@/lib/design/confidence';
import type { CatKey } from '@/lib/design/cats';
import type { TripStatus } from '@/lib/trip-summary';

export type SavedPlaceView = {
  id: string;
  name: string;
  category: CatKey | null;
  distanceMiles: number | null;
  summary: string;
  score: number | null; // null = not yet assessed
  tier: ConfTier;
};

export type StopView = {
  id: string;
  name: string;
  nights: number;
  note: string | null;
  color: string;
  latitude: number;
  longitude: number;
  saved: SavedPlaceView[];
};

export type TripDetail = {
  id: string;
  name: string;
  status: TripStatus;
  region: string | null;
  updatedAt: Date;
  stops: StopView[];
  // Saved places not tied to a specific stop (e.g. saved "to the trip").
  unassignedSaved: SavedPlaceView[];
  // Derived totals (recomputed live as the client edits).
  placeCount: number;
};

// Load a trip with its ordered stops and the saved places grouped under each
// stop, scored in one bulk pass. Returns null when the trip doesn't exist.
export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
  if (!trip) return null;

  const [nodes, saved] = await Promise.all([
    db.select().from(tripNodes).where(eq(tripNodes.tripId, tripId)).orderBy(tripNodes.sortOrder),
    db
      .select({
        nodeId: tripPlaces.nodeId,
        placeId: tripPlaces.placeId,
        name: places.name,
        category: places.category,
        latitude: places.latitude,
        longitude: places.longitude,
        assessedAt: places.assessedAt,
      })
      .from(tripPlaces)
      .innerJoin(places, eq(tripPlaces.placeId, places.id))
      .where(eq(tripPlaces.tripId, tripId)),
  ]);

  const assessedIds = saved.filter((s) => s.assessedAt != null).map((s) => s.placeId);
  const scores = await assessPlaces([...new Set(assessedIds)]);

  type SavedRow = (typeof saved)[number];
  // Build a saved-place view. Status follows assessed_at, not signal presence
  // (an assessed place with no evidence stays "scored" at a low score).
  const toView = (r: SavedRow, ref?: { lat: number; lon: number }): SavedPlaceView => {
    const sc = scores.get(r.placeId);
    const assessed = r.assessedAt != null;
    const distanceMiles =
      ref && r.latitude != null && r.longitude != null
        ? haversineMiles(ref.lat, ref.lon, r.latitude, r.longitude)
        : null;
    return {
      id: r.placeId,
      name: r.name,
      category: (r.category as CatKey | null) ?? null,
      distanceMiles,
      summary: sc?.reason ?? (assessed ? 'We found little dog-specific evidence' : 'Not assessed yet'),
      score: assessed ? (sc?.score ?? 0) : null,
      tier: assessed ? (sc?.tier ?? 'lo') : 'slate',
    };
  };
  const byScore = (a: SavedPlaceView, b: SavedPlaceView) => (b.score ?? -1) - (a.score ?? -1);

  const savedByNode = new Map<string, SavedRow[]>();
  const unassigned: SavedRow[] = [];
  for (const s of saved) {
    if (!s.nodeId) {
      unassigned.push(s);
      continue;
    }
    const list = savedByNode.get(s.nodeId) ?? [];
    list.push(s);
    savedByNode.set(s.nodeId, list);
  }

  const stops: StopView[] = nodes.map((node) => ({
    id: node.id,
    name: node.label ?? 'Stop',
    nights: node.nights,
    note: node.notes,
    color: stopColor(node.colorIndex),
    latitude: node.latitude,
    longitude: node.longitude,
    saved: (savedByNode.get(node.id) ?? [])
      .map((r) => toView(r, { lat: node.latitude, lon: node.longitude }))
      .sort(byScore),
  }));

  const unassignedSaved: SavedPlaceView[] = unassigned.map((r) => toView(r)).sort(byScore);

  return {
    id: trip.id,
    name: trip.name,
    status: trip.status as TripStatus,
    region: trip.region,
    updatedAt: trip.updatedAt,
    stops,
    unassignedSaved,
    placeCount: saved.length,
  };
}
