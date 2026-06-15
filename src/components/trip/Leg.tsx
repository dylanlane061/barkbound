import Icon from '@/components/kit/Icon';

// Drive-leg connector shown above a stop. `leg` is null when distance is
// unknown (e.g. a stop with no coordinates).
export default function Leg({
  leg,
  name,
}: {
  leg: { miles: number; label: string } | null;
  name: string;
}) {
  return (
    <div className="row g8 center" style={{ margin: '2px 0 14px', color: 'var(--muted)' }}>
      <span
        className="row center"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="route" size={13} color="var(--green-700)" />
      </span>
      {leg ? (
        <>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{leg.miles} mi</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span style={{ fontSize: 12 }}>
            ~{leg.label} drive to {name}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 12 }}>
          Drive to {name} ·{' '}
          <span style={{ color: 'var(--green-700)', fontWeight: 600 }}>add drive details</span>
        </span>
      )}
    </div>
  );
}
