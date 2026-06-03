// PawSignal confidence → display tier. The engine produces `confidence` in 0–1
// (see pawsignal/score). The UI shows a 0–100 "PawSignal score" and colors it by
// tier. Thresholds match the design handoff: >=80 high, >=65 medium, else low.
// `slate` is the neutral tier for unscored / "Verify" states (not derived from a
// score).
export type ConfTier = 'hi' | 'med' | 'lo' | 'slate';

export function confOf(score: number): ConfTier {
  return score >= 80 ? 'hi' : score >= 65 ? 'med' : 'lo';
}

export const CONF_LABEL: Record<ConfTier, string> = {
  hi: 'High',
  med: 'Medium',
  lo: 'Low',
  slate: 'Verify',
};

export const CONF_VAR: Record<ConfTier, string> = {
  hi: 'var(--hi)',
  med: 'var(--med)',
  lo: 'var(--lo)',
  slate: 'var(--slate)',
};

/** PawSignal confidence (0–1) → the 0–100 score shown in rings and badges. */
export function toScore100(confidence: number): number {
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100);
}
