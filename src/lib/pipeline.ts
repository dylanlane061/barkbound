/**
 * Dev-mode pipeline logging.
 *
 * Every meaningful step in the search → geocode → ingest → fetch → extract → score
 * flow emits a structured PipelineEvent, printed to the server console in dev. Each
 * run gets a short id (so interleaved requests stay readable) and every line carries
 * the elapsed time since the run started — so you can see both WHERE you are in the
 * pipeline and how long each step took.
 *
 * Usage:
 *   const run = startRun(`Add stop: ${location}`);
 *   run.step('geocode', `Resolved "${location}"`, { lat, lon });
 *   run.warn('Nothing matched');
 *   run.error('Fetch failed', err);
 *   run.done('Pipeline complete', { places: 12 });
 *
 * Enabled in development automatically. Set DEBUG_PIPELINE=1 to force it on in
 * other environments (e.g. to debug a deployed preview).
 */

const ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.DEBUG_PIPELINE === '1';

export type PipelineStage =
  | 'start'
  | 'geocode'
  | 'bbox'
  | 'ingest'
  | 'fetch'
  | 'parse'
  | 'store'
  | 'extract'
  | 'score'
  | 'done'
  | 'warn'
  | 'error';

export interface PipelineEvent {
  runId: string;
  label: string;
  stage: PipelineStage;
  message: string;
  elapsedMs: number;
  data?: Record<string, unknown>;
}

export interface PipelineRun {
  readonly id: string;
  /** Log a normal pipeline step. */
  step(stage: PipelineStage, message: string, data?: Record<string, unknown>): void;
  /** Log a non-fatal problem (printed via console.warn). */
  warn(message: string, data?: Record<string, unknown>): void;
  /** Log a failure (printed via console.error), optionally with the caught error. */
  error(message: string, err?: unknown): void;
  /** Log the terminal success step. */
  done(message: string, data?: Record<string, unknown>): void;
}

// The single place where a pipeline event becomes output. Extend this if you ever
// want another sink (file, UI transport, etc.) — the event is already serializable.
function emit(evt: PipelineEvent): void {
  if (!ENABLED) return;
  const head = `[pipeline ${evt.runId} ${evt.stage} +${evt.elapsedMs}ms]`;
  const line = `${head} ${evt.message}`;
  const sink =
    evt.stage === 'error' ? console.error : evt.stage === 'warn' ? console.warn : console.info;
  if (evt.data !== undefined) sink(line, evt.data);
  else sink(line);
}

export function startRun(label: string): PipelineRun {
  const id = Math.random().toString(36).slice(2, 6);
  const start = Date.now();
  const elapsed = () => Date.now() - start;

  const run: PipelineRun = {
    id,
    step(stage, message, data) {
      emit({ runId: id, label, stage, message, elapsedMs: elapsed(), data });
    },
    warn(message, data) {
      emit({ runId: id, label, stage: 'warn', message, elapsedMs: elapsed(), data });
    },
    error(message, err) {
      const data =
        err === undefined
          ? undefined
          : { error: err instanceof Error ? (err.stack ?? err.message) : String(err) };
      emit({ runId: id, label, stage: 'error', message, elapsedMs: elapsed(), data });
    },
    done(message, data) {
      emit({ runId: id, label, stage: 'done', message, elapsedMs: elapsed(), data });
    },
  };

  emit({ runId: id, label, stage: 'start', message: `▶ ${label}`, elapsedMs: 0 });
  return run;
}
