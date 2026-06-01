import { randomUUID } from 'node:crypto';
import type { RawRecord, Signal, SignalCategory, ExtractResult } from '../types';

type Extractor = (record: RawRecord) => Array<Omit<Signal, 'id' | 'placeId' | 'extractedAt' | 'evidenceIds'>>;

const extractors = new Map<string, Extractor>();

// Register a source-specific extractor. Call this once per source at startup.
export function registerExtractor(source: string, extractor: Extractor): void {
  extractors.set(source, extractor);
}

export function extract(records: RawRecord[], placeId: string): ExtractResult {
  const signals: Signal[] = [];
  const warnings: string[] = [];
  const byCategory: Partial<Record<SignalCategory, number>> = {};
  let extractorsMissing = 0;

  for (const record of records) {
    const extractor = extractors.get(record.source);
    if (!extractor) {
      extractorsMissing++;
      warnings.push(`No extractor registered for source: ${record.source}`);
      continue;
    }
    try {
      for (const partial of extractor(record)) {
        const category = partial.category as SignalCategory;
        signals.push({
          id: randomUUID(),
          placeId,
          evidenceIds: [record.id],
          extractedAt: new Date(),
          ...partial,
          category,
        });
        byCategory[category] = (byCategory[category] ?? 0) + 1;
      }
    } catch (err) {
      warnings.push(`Extractor for ${record.source} threw: ${String(err)}`);
    }
  }

  return {
    signals,
    warnings,
    stats: {
      recordsProcessed: records.length,
      extractorsMissing,
      signalsProduced: signals.length,
      byCategory,
    },
  };
}
