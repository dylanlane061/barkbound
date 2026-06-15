import Icon from '@/components/kit/Icon';

// Shown when active filters exclude every place in range.
export default function EmptyState({ reset }: { reset: () => void }) {
  return (
    <div className="card" style={{ padding: '46px 28px', textAlign: 'center', borderStyle: 'dashed', background: 'var(--paper)' }}>
      <div
        className="row center"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'var(--paper-2)',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Icon name="search" size={26} color="var(--muted)" />
      </div>
      <div className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', marginBottom: 6 }}>
        No places match those filters
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 auto 18px', maxWidth: 320, lineHeight: 1.5 }}>
        Try widening the radius or turning a category back on.
      </p>
      <button className="btn btn-ghost btn-sm" onClick={reset} style={{ margin: '0 auto' }}>
        <Icon name="x" size={14} color="var(--green-800)" />
        Reset filters
      </button>
    </div>
  );
}
