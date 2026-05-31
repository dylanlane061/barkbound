export type {
  SourceId,
  SignalCategory,
  SignalValue,
  RawRecord,
  Signal,
  PlaceAssessment,
  NormalizeResult,
  ExtractResult,
} from './types.js';

export { normalize, registerAdapter } from './normalize/index.js';
export { extract, registerExtractor } from './extract/index.js';
export { osmExtractor } from './extract/osm.js';
export { score } from './score/index.js';
