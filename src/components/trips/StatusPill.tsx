import type { TripStatus } from '@/lib/trip-summary';

const STYLES: Record<
  TripStatus,
  { bg: string; color: string; border?: string; label: string; dot?: boolean }
> = {
  active: { bg: 'var(--orange)', color: '#fff', label: 'Active', dot: true },
  planning: {
    bg: 'var(--slate-bg)',
    color: 'var(--slate)',
    border: 'var(--slate-line)',
    label: 'Planning',
  },
  past: { bg: 'var(--paper-2)', color: 'var(--muted)', border: 'var(--line)', label: 'Past' },
};

// Trip lifecycle pill. The active variant is solid orange with a pulsing dot.
export default function StatusPill({ status }: { status: TripStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="row center g6"
      style={{
        background: s.bg,
        color: s.color,
        border: s.border ? `1px solid ${s.border}` : '1px solid transparent',
        borderRadius: 'var(--pill)',
        padding: s.dot ? '4px 10px' : '3px 9px',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        boxShadow: status === 'active' ? 'var(--sh-sm)' : 'none',
        width: 'fit-content',
      }}
    >
      {s.dot && (
        <span
          className="pulse-dot"
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }}
        />
      )}
      {s.label}
    </span>
  );
}
