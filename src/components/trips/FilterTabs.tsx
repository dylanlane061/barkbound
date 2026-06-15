'use client';

export type FilterValue = 'All' | 'Active' | 'Planning' | 'Past';
export const FILTER_VALUES: FilterValue[] = ['All', 'Active', 'Planning', 'Past'];

// Segmented filter for the gallery; the active segment is a white pill.
export default function FilterTabs({
  value,
  onChange,
  counts,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  counts: Record<FilterValue, number>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--paper-2)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: 4,
        gap: 2,
      }}
    >
      {FILTER_VALUES.map((t) => {
        const on = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="row center g6"
            style={{
              appearance: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 15px',
              borderRadius: 999,
              fontFamily: 'var(--f-body)',
              fontSize: 13,
              fontWeight: on ? 600 : 500,
              background: on ? 'var(--card)' : 'transparent',
              color: on ? 'var(--green-900)' : 'var(--ink-2)',
              boxShadow: on ? 'var(--sh-sm)' : 'none',
              transition: 'background .14s, color .14s',
            }}
          >
            {t}
            <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--green-700)' : 'var(--muted)' }}>
              {counts[t]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
