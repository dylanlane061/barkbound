export type SourceId = 'google' | 'osm' | 'recreation_gov' | 'nps' | 'user_import';

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

// How a single category contributed to the aggregate confidence. Exposed so the
// score is fully traceable — see the "Transparent Scoring" principle.
export interface ScoreContribution {
  category: SignalCategory;
  signalCount: number;
  weight: number;                // the category weight applied
  averageConfidence: number;     // mean signal confidence within the category (0–1)
  contribution: number;          // share of the pre-boost weighted average (0–1)
}

// A transparent breakdown of how `confidence` was derived.
export interface ScoreBreakdown {
  signalCount: number;
  base: number;                  // weighted-average confidence before any source boost
  sourceBoost: number;           // bonus added for corroborating sources
  contributions: ScoreContribution[]; // sorted descending by contribution
}

// The final output of PawSignal for a given place
export interface PlaceAssessment {
  placeId: string;
  confidence: number;           // aggregate 0–1 across all signals
  signals: Signal[];
  sourcesConsulted: SourceId[];
  computedAt: Date;
  breakdown: ScoreBreakdown;    // why this confidence — traceable, not a black box
}

export interface NormalizeResult {
  records: RawRecord[];
  warnings: string[];
}

// Diagnostic counts describing an extract() run. Returned as data (not logged
// from inside PawSignal) so callers can observe/emit progress while PawSignal
// stays framework-free.
export interface ExtractStats {
  recordsProcessed: number;
  extractorsMissing: number;     // records whose source had no registered extractor
  signalsProduced: number;
  byCategory: Partial<Record<SignalCategory, number>>;
}

export interface ExtractResult {
  signals: Signal[];
  warnings: string[];
  stats: ExtractStats;
}
