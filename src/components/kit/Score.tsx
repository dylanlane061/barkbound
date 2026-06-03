import { confOf, CONF_LABEL, CONF_VAR, type ConfTier } from '@/lib/design/confidence';
import { CATS, type CatKey } from '@/lib/design/cats';
import Icon from './Icon';

/* ---- Confidence pill ---- */
export function Conf({
  level,
  score,
  small = false,
}: {
  level?: ConfTier;
  score?: number;
  small?: boolean;
}) {
  const lv = level ?? confOf(score ?? 0);
  return (
    <span
      className={`conf conf-${lv}`}
      style={small ? { fontSize: 10, padding: '3px 7px 3px 6px' } : undefined}
    >
      {CONF_LABEL[lv]}
    </span>
  );
}

/* ---- Score ring (signature gauge) ---- */
export function ScoreRing({
  value = 92,
  size = 76,
  stroke = 6,
  level,
  label = 'PawSignal',
  ticks = true,
}: {
  value?: number;
  size?: number;
  stroke?: number;
  level?: ConfTier;
  label?: string | null;
  ticks?: boolean;
}) {
  const lv = level ?? confOf(value);
  const col = CONF_VAR[lv];
  const r = (size - stroke) / 2 - (ticks ? 4 : 0);
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const tickEls = [];
  if (ticks) {
    const N = 32;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI - Math.PI / 2;
      const on = i / N <= value / 100;
      const ro = size / 2 - 1.5;
      const ri = size / 2 - 4.5;
      tickEls.push(
        <line
          key={i}
          x1={cx + Math.cos(a) * ri}
          y1={cx + Math.sin(a) * ri}
          x2={cx + Math.cos(a) * ro}
          y2={cx + Math.sin(a) * ro}
          stroke={on ? col : 'var(--line-2)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={on ? 0.9 : 0.5}
        />,
      );
    }
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        {tickEls}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        <span className="display" style={{ fontWeight: 800, fontSize: size * 0.34, color: col }}>
          {value}
        </span>
        {label && (
          <span
            style={{
              fontSize: size * 0.1,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: size * 0.04,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---- Small score badge for list rows / pins ---- */
export function ScoreBadge({ value, size = 44 }: { value: number; size?: number }) {
  const col = CONF_VAR[confOf(value)];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'var(--card)',
        border: `1.5px solid ${col}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'var(--sh-sm)',
      }}
    >
      <span
        className="display"
        style={{ fontWeight: 800, fontSize: size * 0.4, color: col, lineHeight: 1 }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---- Unscored placeholder chip (square, neutral, with category glyph) ---- */
export function UnscoredBadge({ cat, size = 44 }: { cat?: CatKey; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'var(--slate-bg)',
        border: '1.5px dashed var(--slate-line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--slate)',
      }}
    >
      <Icon name={cat ? CATS[cat].icon : 'paw'} size={size * 0.42} color="var(--slate)" />
    </div>
  );
}
