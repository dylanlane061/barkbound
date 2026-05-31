export type SourceId = 'osm' | 'recreation_gov' | 'nps' | 'user_import';

export type SignalCategory =
  | 'pets_allowed'
  | 'size_restriction'
  | 'leash_required'
  | 'pet_fee'
  | 'designated_area'
  | 'water_access'
  | 'trail_access';

export type SignalValue = string | boolean | number | null;

// Raw, unnormalized data exactly as received from a source
export interface RawRecord {
  id: string;
  source: SourceId;
  sourceEntityId: string;
  fetchedAt: Date;
  raw: Record<string, unknown>;
}

// A single dog-relevant signal extracted from one or more raw records
export interface Signal {
  id: string;
  placeId: string;
  category: SignalCategory;
  value: SignalValue;
  confidence: number;       // 0–1: how confident we are in this signal
  evidenceIds: string[];    // IDs of the RawRecords that support this signal
  extractedAt: Date;
}

// The final output of PawSignal for a given place
export interface PlaceAssessment {
  placeId: string;
  confidence: number;           // aggregate 0–1 across all signals
  signals: Signal[];
  sourcesConsulted: SourceId[];
  computedAt: Date;
}

export interface NormalizeResult {
  records: RawRecord[];
  warnings: string[];
}

export interface ExtractResult {
  signals: Signal[];
  warnings: string[];
}
