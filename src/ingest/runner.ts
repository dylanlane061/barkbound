import { extract } from '@pawsignal';
import type { SourceId } from '@pawsignal';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, rawRecords, signals, tripNodes } from '@/db/schema';
import type { PipelineRun } from '@/lib/pipeline';
import type { BoundingBox } from './geo';

export interface IngestResult {
  placesUpserted: number;
  rawRecordsCreated: number;
  signalsExtracted: number;
  warnings: string[];
}

interface SourceItem {
  sourceEntityId: string;
  name: string;
  latitude?: number;
  longitude?: number;
  raw: Record<string, unknown>;
}

interface FetchResult {
  source: SourceId;
  items: SourceItem[];
}

// Fetchers receive the active PipelineRun so they can log their own progress
// (HTTP request, response size, mapping) under the same run as the rest of the flow.
type AreaFetcher = (bbox: BoundingBox, run: PipelineRun) => Promise<FetchResult>;

const fetchers: AreaFetcher[] = [];

// Register a bbox fetcher for a data source. Call once at startup per source (Phase 1+).
export function registerAreaFetcher(fetcher: AreaFetcher): void {
  fetchers.push(fetcher);
}

export async function ingestArea(
  nodeId: string,
  bbox: BoundingBox,
  run: PipelineRun,
): Promise<IngestResult> {
  const result: IngestResult = {
    placesUpserted: 0,
    rawRecordsCreated: 0,
    signalsExtracted: 0,
    warnings: [],
  };

  if (fetchers.length === 0) {
    run.warn('No data sources configured — nothing will be fetched.');
    result.warnings.push('No data sources configured yet.');
  } else {
    run.step('ingest', `Running ${fetchers.length} source fetcher(s)`);
  }

  for (const fetcher of fetchers) {
    let fetchResult: FetchResult;
    try {
      fetchResult = await fetcher(bbox, run);
    } catch (err) {
      // Surface the real error — a swallowed fetch failure is indistinguishable
      // from "this area genuinely has no places".
      run.error('Fetcher threw — treating area as no results', err);
      result.warnings.push(`Fetcher threw: ${String(err)}`);
      continue;
    }

    let created = 0;
    let updated = 0;
    let signalsForSource = 0;
    const categoryTotals: Record<string, number> = {};

    for (const item of fetchResult.items) {
      // Find existing raw record for this source entity to get the placeId
      const [existing] = await db
        .select({ id: rawRecords.id, placeId: rawRecords.placeId })
        .from(rawRecords)
        .where(
          and(
            eq(rawRecords.source, fetchResult.source),
            eq(rawRecords.sourceEntityId, item.sourceEntityId),
          ),
        )
        .limit(1);

      let placeId: string;
      let rawRecordId: string;

      if (existing) {
        // Refresh the raw data
        placeId = existing.placeId;
        rawRecordId = existing.id;
        updated++;
        await db
          .update(rawRecords)
          .set({ raw: item.raw, fetchedAt: new Date() })
          .where(eq(rawRecords.id, existing.id));
      } else {
        const [newPlace] = await db
          .insert(places)
          .values({ name: item.name, latitude: item.latitude, longitude: item.longitude })
          .returning({ id: places.id });
        placeId = newPlace.id;
        created++;
        result.placesUpserted++;

        const [newRecord] = await db
          .insert(rawRecords)
          .values({
            placeId,
            source: fetchResult.source,
            sourceEntityId: item.sourceEntityId,
            raw: item.raw,
            fetchedAt: new Date(),
          })
          .returning({ id: rawRecords.id });
        rawRecordId = newRecord.id;
        result.rawRecordsCreated++;
      }

      // Build a PawSignal RawRecord and run extraction
      const pawRecord = {
        id: rawRecordId,
        source: fetchResult.source,
        sourceEntityId: item.sourceEntityId,
        fetchedAt: new Date(),
        raw: item.raw,
      };

      const { signals: extracted, warnings, stats } = extract([pawRecord], placeId);
      result.warnings.push(...warnings);
      for (const w of warnings) run.warn(w, { place: item.name });
      for (const [cat, n] of Object.entries(stats.byCategory)) {
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + (n ?? 0);
      }

      if (extracted.length > 0) {
        await db
          .insert(signals)
          .values(
            extracted.map((s) => ({
              id: s.id,
              placeId: s.placeId,
              category: s.category,
              value: s.value,
              confidence: s.confidence,
              evidenceIds: s.evidenceIds,
            })),
          )
          .onConflictDoNothing();
        result.signalsExtracted += extracted.length;
        signalsForSource += extracted.length;
      }

      await db
        .update(places)
        .set({ lastIngestedAt: new Date() })
        .where(eq(places.id, placeId));
    }

    run.step(
      'store',
      `${fetchResult.source}: ${created} new + ${updated} updated places ` +
        `(${fetchResult.items.length} fetched)`,
    );
    run.step('extract', `${fetchResult.source}: ${signalsForSource} signals extracted`, {
      byCategory: categoryTotals,
    });
  }

  await db.update(tripNodes).set({ ingestedAt: new Date() }).where(eq(tripNodes.id, nodeId));

  run.step(
    'ingest',
    `Ingest finished: ${result.placesUpserted} new places, ` +
      `${result.rawRecordsCreated} raw records, ${result.signalsExtracted} signals`,
  );

  return result;
}
