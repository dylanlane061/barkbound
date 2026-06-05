export type {
  SourceId,
  SignalCategory,
  SignalValue,
  RawRecord,
  Signal,
  PlaceAssessment,
  ScoreContribution,
  ScoreBreakdown,
  NormalizeResult,
  ExtractResult,
  ExtractStats,
} from './types';

export { normalize, registerAdapter } from './normalize/index';
export { extract, registerExtractor } from './extract/index';
export { osmExtractor } from './extract/osm';
export { score, signalPolarity } from './score/index';
