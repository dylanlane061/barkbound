import type { RawRecord, NormalizeResult, SourceId } from '../types.js';

// Each source adapter transforms raw API/import data into a RawRecord.
// Add a new adapter here when integrating a new data source.
type SourceAdapter = (raw: Record<string, unknown>, sourceEntityId: string) => RawRecord;

const adapters: Partial<Record<SourceId, SourceAdapter>> = {};

export function registerAdapter(source: SourceId, adapter: SourceAdapter): void {
  adapters[source] = adapter;
}

export function normalize(
  source: SourceId,
  rawData: Record<string, unknown>[],
): NormalizeResult {
  const adapter = adapters[source];
  if (!adapter) {
    return {
      records: [],
      warnings: [`No adapter registered for source: ${source}`],
    };
  }

  const records: RawRecord[] = [];
  const warnings: string[] = [];

  for (const raw of rawData) {
    try {
      const entityId = String(raw['id'] ?? raw['_id'] ?? crypto.randomUUID());
      records.push(adapter(raw, entityId));
    } catch (err) {
      warnings.push(`Failed to normalize record: ${String(err)}`);
    }
  }

  return { records, warnings };
}
