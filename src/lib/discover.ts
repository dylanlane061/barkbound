import { and, desc, eq, gte, isNotNull, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, tripNodes, trips } from '@/db/schema';
import { geocode, haversineMiles, radiusToBbox } from '@/ingest/geo';
import { assessPlaces } from '@/lib/assess';
import type { CatKey } from '@/lib/design/cats';
import type { ConfTier } from '@/lib/design/confidence';

// Widest radius we ever load (the slider maxes at 50mi); the client filters
// down from this set so changing the radius doesn't refetch.
const MAX_LOAD_MILES = 50;

export type DiscoverPlace = {
  id: string;
  name: string;
  category: CatKey | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  status: 'scored' | 'unscored';
  score: number | null;
  tier: ConfTier;
  reason: string;
  sources: number;
};

export type SaveTarget = { tripId: string; tripName: string; nodeId: string | null } | null;

export type DiscoverData = {
  location: string;
  latitude: number;
  longitude: number;
  fromTrip: boolean;
  breadcrumbTrip: { id: string; name: string } | null;
  saveTarget: SaveTarget;
  places: DiscoverPlace[];
};

export type DiscoverQuery = {
  location: string;
  lat?: number;
  lon?: number;
  tripId?: string;
  nodeId?: string;
};

// Resolve the Discover results for a chosen location. Returns null when the
// location can't be resolved to coordinates.
export async function getDiscoverData(q: DiscoverQuery): Promise<DiscoverData | null> {
  let lat = q.lat;
  let lon = q.lon;

  if (lat == null || lon == null) {
    const geo = await geocode(q.location);
    if (!geo) return null;
    lat = geo.lat;
    lon = geo.lon;
  }

  // Resolve the breadcrumb trip + save target.
  let breadcrumbTrip: { id: string; name: string } | null = null;
  let saveTarget: SaveTarget = null;

  if (q.tripId) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, q.tripId));
    if (trip) {
      breadcrumbTrip = { id: trip.id, name: trip.name };
      saveTarget = { tripId: trip.id, tripName: trip.name, nodeId: q.nodeId ?? null };
    }
  }
  if (!saveTarget) {
    // Default save target: the active trip (saved trip-level).
    const [active] = await db
      .select()
      .from(trips)
      .where(eq(trips.status, 'active'))
      .orderBy(desc(trips.updatedAt))
      .limit(1);
    if (active) saveTarget = { tripId: active.id, tripName: active.name, nodeId: null };
  }

  // Catalog places within the widest radius.
  const bbox = radiusToBbox(lat, lon, MAX_LOAD_MILES);
  const rows = await db
    .select()
    .from(places)
    .where(
      and(
        isNotNull(places.latitude),
        isNotNull(places.longitude),
        gte(places.latitude, bbox.minLat),
        lte(places.latitude, bbox.maxLat),
        gte(places.longitude, bbox.minLon),
        lte(places.longitude, bbox.maxLon),
      ),
    );

  const assessedIds = rows.filter((p) => p.assessedAt != null).map((p) => p.id);
  const scores = await assessPlaces(assessedIds);

  const placesOut: DiscoverPlace[] = rows
    .map((p) => {
      const distanceMiles = haversineMiles(lat!, lon!, p.latitude!, p.longitude!);
      const sc = p.assessedAt != null ? scores.get(p.id) : undefined;
      return {
        id: p.id,
        name: p.name,
        category: (p.category as CatKey | null) ?? null,
        address: p.address,
        latitude: p.latitude!,
        longitude: p.longitude!,
        distanceMiles,
        status: (sc ? 'scored' : 'unscored') as 'scored' | 'unscored',
        score: sc?.score ?? null,
        tier: sc?.tier ?? 'slate',
        reason: sc?.reason ?? 'Not checked yet',
        sources: sc?.sources.length ?? 1,
      } satisfies DiscoverPlace;
    })
    .filter((p) => p.distanceMiles <= MAX_LOAD_MILES);

  // Stable default ordering by distance; the client re-sorts by the chosen mode.
  placesOut.sort((a, b) => a.distanceMiles - b.distanceMiles);

  return {
    location: q.location,
    latitude: lat,
    longitude: lon,
    fromTrip: Boolean(q.tripId),
    breadcrumbTrip,
    saveTarget,
    places: placesOut,
  };
}

// Lightweight search suggestions for the empty state: the user's trip stops.
export async function getTripStopsForSearch(): Promise<
  { id: string; name: string; tripId: string; tripName: string; colorIndex: number }[]
> {
  const rows = await db
    .select({
      id: tripNodes.id,
      name: tripNodes.label,
      colorIndex: tripNodes.colorIndex,
      tripId: trips.id,
      tripName: trips.name,
      status: trips.status,
      updatedAt: trips.updatedAt,
    })
    .from(tripNodes)
    .innerJoin(trips, eq(tripNodes.tripId, trips.id))
    .orderBy(desc(trips.updatedAt), tripNodes.sortOrder);

  // Prefer the most recently updated trip's stops (typically the active one).
  const topTripId = rows[0]?.tripId;
  return rows
    .filter((r) => r.tripId === topTripId && r.name)
    .map((r) => ({
      id: r.id,
      name: r.name as string,
      tripId: r.tripId,
      tripName: r.tripName,
      colorIndex: r.colorIndex,
    }));
}
