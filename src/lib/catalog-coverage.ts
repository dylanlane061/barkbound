import { and, gte, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { catalogRuns } from '@/db/schema';
import { haversineMiles, radiusToBbox } from '@/ingest/geo';

// How long a catalog stays "fresh" before a search re-runs it for that area.
const FRESH_DAYS = 14;
// Bbox prefilter width when looking for runs that might cover a point.
const SEARCH_MILES = 60;

// Has some recent catalog run covered this point (its center within its own
// radius of the point)? Decoupled from per-place timestamps, so even a tiny
// town that yields few places is recorded and won't re-catalogue every visit.
export async function hasRecentCatalog(lat: number, lon: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - FRESH_DAYS * 86_400_000);
  const bbox = radiusToBbox(lat, lon, SEARCH_MILES);
  const runs = await db
    .select()
    .from(catalogRuns)
    .where(
      and(
        gte(catalogRuns.catalogedAt, cutoff),
        gte(catalogRuns.latitude, bbox.minLat),
        lte(catalogRuns.latitude, bbox.maxLat),
        gte(catalogRuns.longitude, bbox.minLon),
        lte(catalogRuns.longitude, bbox.maxLon),
      ),
    );
  return runs.some((r) => haversineMiles(lat, lon, r.latitude, r.longitude) <= r.radiusMiles);
}

export async function recordCatalogRun(
  lat: number,
  lon: number,
  radiusMiles: number,
  resultCount: number,
): Promise<void> {
  await db.insert(catalogRuns).values({ latitude: lat, longitude: lon, radiusMiles, resultCount });
}
