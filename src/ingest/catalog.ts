import { inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { places } from '@/db/schema';
import { categoryFromTypes } from '@/lib/design/cats';
import type { PipelineRun } from '@/lib/pipeline';
import { searchNearby, type CanonicalPlace } from './google';

export interface CatalogResult {
  catalogued: number;
  created: number;
  updated: number;
}

// Google Places (New) Nearby Search returns at most 20 results PER CALL and has
// no pagination. To get real coverage we issue one Nearby call per included
// type (each can return its own 20) and dedupe by place_id — so a city yields
// ~20 restaurants + ~20 parks + ~20 lodging… instead of 20 total.
async function searchNearbyFanout(
  params: { latitude: number; longitude: number; radiusMiles: number; includedTypes: string[] },
  run: PipelineRun,
): Promise<CanonicalPlace[]> {
  const results = await Promise.all(
    params.includedTypes.map(async (type) => {
      try {
        return await searchNearby({
          latitude: params.latitude,
          longitude: params.longitude,
          radiusMiles: params.radiusMiles,
          includedTypes: [type],
          maxResultCount: 20,
        });
      } catch (err) {
        run.warn(`Nearby(${type}) failed: ${err instanceof Error ? err.message : 'error'}`);
        return [];
      }
    }),
  );

  const byId = new Map<string, CanonicalPlace>();
  for (const list of results) {
    for (const p of list) if (!byId.has(p.placeId)) byId.set(p.placeId, p);
  }
  return [...byId.values()];
}

/**
 * Phase 1.5 catalog step: pull places within a radius from Google and upsert them as
 * canonical places keyed by `external_id` (the Google place_id). This is the cheap,
 * eager half of ingestion — NO evidence collection or scoring happens here. That runs
 * on demand, per place (Phase 1.5c).
 */
export async function catalogArea(
  params: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
    includedTypes: string[];
  },
  run: PipelineRun,
): Promise<CatalogResult> {
  run.step('fetch', `Google Nearby × ${params.includedTypes.length} types`, {
    radiusMiles: params.radiusMiles,
    types: params.includedTypes,
  });

  const found = await searchNearbyFanout(params, run);
  run.step('parse', `Google returned ${found.length} unique places`);

  if (found.length === 0) {
    return { catalogued: 0, created: 0, updated: 0 };
  }

  // One round-trip to find which place_ids we already have, then batch the inserts
  // and run the updates concurrently.
  const placeIds = found.map((p) => p.placeId);
  const existing = await db
    .select({ id: places.id, externalId: places.externalId })
    .from(places)
    .where(inArray(places.externalId, placeIds));

  const existingByExternalId = new Map(existing.map((e) => [e.externalId, e.id]));

  const toInsert = found.filter((p) => !existingByExternalId.has(p.placeId));
  const toUpdate = found.filter((p) => existingByExternalId.has(p.placeId));

  const now = new Date();

  if (toInsert.length > 0) {
    await db.insert(places).values(
      toInsert.map((p) => ({
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        address: p.address,
        canonicalSource: 'google',
        externalId: p.placeId,
        // Derive the display category from Google types so Discover filters work.
        category: categoryFromTypes(p.types),
        // Marks when this area was last catalogued — drives the recency gate
        // that decides whether a search re-catalogs.
        lastIngestedAt: now,
      })),
    );
  }

  await Promise.all(
    toUpdate.map((p) =>
      db
        .update(places)
        .set({
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address,
          canonicalSource: 'google',
          category: categoryFromTypes(p.types),
          lastIngestedAt: now,
        })
        .where(inArray(places.id, [existingByExternalId.get(p.placeId)!])),
    ),
  );

  run.step(
    'store',
    `Catalogued ${found.length} places (${toInsert.length} new, ${toUpdate.length} updated)`,
  );

  return { catalogued: found.length, created: toInsert.length, updated: toUpdate.length };
}
