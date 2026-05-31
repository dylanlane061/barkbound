import { extract } from '@barkbound/pawsignal';
import type { SourceId } from '@barkbound/pawsignal';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, rawRecords, signals, tripNodes } from '@/db/schema';
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

type AreaFetcher = (bbox: BoundingBox) => Promise<FetchResult>;

const fetchers: AreaFetcher[] = [];

// Register a bbox fetcher for a data source. Call once at startup per source (Phase 1+).
export function registerAreaFetcher(fetcher: AreaFetcher): void {
  fetchers.push(fetcher);
}

export async function ingestArea(nodeId: string, bbox: BoundingBox): Promise<IngestResult> {
  const result: IngestResult = {
    placesUpserted: 0,
    rawRecordsCreated: 0,
    signalsExtracted: 0,
    warnings: [],
  };

  if (fetchers.length === 0) {
    result.warnings.push('No data sources configured yet.');
  }

  for (const fetcher of fetchers) {
    let fetchResult: FetchResult;
    try {
      fetchResult = await fetcher(bbox);
    } catch (err) {
      result.warnings.push(`Fetcher threw: ${String(err)}`);
      continue;
    }

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

      const { signals: extracted, warnings } = extract([pawRecord], placeId);
      result.warnings.push(...warnings);

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
      }

      await db
        .update(places)
        .set({ lastIngestedAt: new Date() })
        .where(eq(places.id, placeId));
    }
  }

  await db.update(tripNodes).set({ ingestedAt: new Date() }).where(eq(tripNodes.id, nodeId));

  return result;
}
