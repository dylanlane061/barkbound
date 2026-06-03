import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, tripNodes, tripPlaces, trips } from '@/db/schema';
import { haversineMiles } from '@/ingest/geo';
import { assessPlaces } from '@/lib/assess';
import type { CatKey } from '@/lib/design/cats';
import type { ConfTier } from '@/lib/design/confidence';

export type TripStatus = 'active' | 'planning' | 'past';
export type CoverTone = 'green' | 'sand' | 'cool' | 'rust' | 'alpine';

export type TripPick = {
  id: string;
  name: string;
  category: CatKey | null;
  score: number;
  tier: ConfTier;
};

export type TripSummary = {
  id: string;
  name: string;
  status: TripStatus;
  region: string | null;
  coverTone: CoverTone;
  updatedAt: Date;
  stopCount: number;
  placeCount: number;
  miles: number;
  nights: number;
  firstStop: string | null;
  picks: TripPick[];
};

// Sum great-circle miles between consecutive stops, in itinerary order.
function routeMiles(stops: { latitude: number; longitude: number }[]): number {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    total += haversineMiles(
      stops[i - 1].latitude,
      stops[i - 1].longitude,
      stops[i].latitude,
      stops[i].longitude,
    );
  }
  return total;
}

// Load every trip with the derived stats the gallery + spotlight need. Loads
// nodes / saved places / saved-place rows in bulk (a handful of queries total),
// then computes per-trip stats and top picks in memory.
export async function getTripSummaries(): Promise<TripSummary[]> {
  const allTrips = await db.select().from(trips);
  if (allTrips.length === 0) return [];

  const tripIds = allTrips.map((t) => t.id);

  const [nodes, saved] = await Promise.all([
    db
      .select()
      .from(tripNodes)
      .where(inArray(tripNodes.tripId, tripIds))
      .orderBy(tripNodes.sortOrder),
    db
      .select({
        tripId: tripPlaces.tripId,
        placeId: tripPlaces.placeId,
        name: places.name,
        category: places.category,
        assessedAt: places.assessedAt,
      })
      .from(tripPlaces)
      .innerJoin(places, eq(tripPlaces.placeId, places.id))
      .where(inArray(tripPlaces.tripId, tripIds)),
  ]);

  // Score only the assessed saved places, in one bulk pass.
  const assessedIds = saved.filter((s) => s.assessedAt != null).map((s) => s.placeId);
  const scores = await assessPlaces([...new Set(assessedIds)]);

  const nodesByTrip = groupBy(nodes, (n) => n.tripId);
  const savedByTrip = groupBy(saved, (s) => s.tripId);

  return allTrips.map((t) => {
    const tripStops = nodesByTrip.get(t.id) ?? [];
    const tripSaved = savedByTrip.get(t.id) ?? [];

    const picks: TripPick[] = tripSaved
      .map((s) => {
        const sc = scores.get(s.placeId);
        return sc
          ? {
              id: s.placeId,
              name: s.name,
              category: (s.category as CatKey | null) ?? null,
              score: sc.score,
              tier: sc.tier,
            }
          : null;
      })
      .filter((p): p is TripPick => p != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return {
      id: t.id,
      name: t.name,
      status: t.status as TripStatus,
      region: t.region,
      coverTone: t.coverTone as CoverTone,
      updatedAt: t.updatedAt,
      stopCount: tripStops.length,
      placeCount: tripSaved.length,
      miles: routeMiles(tripStops),
      nights: tripStops.reduce((sum, n) => sum + (n.nights ?? 0), 0),
      firstStop: tripStops[0]?.label ?? null,
      picks,
    };
  });
}

// --- tiny local helpers ---------------------------------------------------------------

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}
