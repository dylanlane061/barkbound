import { ScoreRing } from '@/components/kit/Score';
import Icon from '@/components/kit/Icon';

export type LiveStatus = 'scored' | 'unscored' | 'computing';

// Status-aware gauge: a score ring when scored, an indeterminate spinning arc
// while computing, and a dashed paw ring when unscored.
export default function StatusRing({
  status,
  score,
  size = 54,
}: {
  status: LiveStatus;
  score: number | null;
  size?: number;
}) {
  const stroke = 5;
  const r = (size - stroke) / 2 - 3;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  if (status === 'scored' && score != null) {
    return <ScoreRing value={score} size={size} stroke={stroke} label={null} />;
  }

  if (status === 'computing') {
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-2)" strokeWidth={stroke} />
          <circle
            className="ring-spin"
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="var(--green-700)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.26} ${circ}`}
          />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--line-2)"
          strokeWidth={stroke}
          strokeDasharray="2.5 6"
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="paw" size={size * 0.38} color="var(--muted)" fill="var(--muted)" stroke={0} />
      </div>
    </div>
  );
}
