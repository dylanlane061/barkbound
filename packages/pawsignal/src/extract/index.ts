import { randomUUID } from 'node:crypto';
import type { RawRecord, Signal, SignalCategory, ExtractResult } from '../types.js';

type Extractor = (record: RawRecord) => Array<Omit<Signal, 'id' | 'placeId' | 'extractedAt' | 'evidenceIds'>>;

const extractors = new Map<string, Extractor>();

// Register a source-specific extractor. Call this once per source at startup.
export function registerExtractor(source: string, extractor: Extractor): void {
  extractors.set(source, extractor);
}

export function extract(records: RawRecord[], placeId: string): ExtractResult {
  const signals: Signal[] = [];
  const warnings: string[] = [];

  for (const record of records) {
    const extractor = extractors.get(record.source);
    if (!extractor) {
      warnings.push(`No extractor registered for source: ${record.source}`);
      continue;
    }
    try {
      for (const partial of extractor(record)) {
        signals.push({
          id: randomUUID(),
          placeId,
          evidenceIds: [record.id],
          extractedAt: new Date(),
          ...partial,
          category: partial.category as SignalCategory,
        });
      }
    } catch (err) {
      warnings.push(`Extractor for ${record.source} threw: ${String(err)}`);
    }
  }

  return { signals, warnings };
}
