'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/kit/Icon';
import { CATS, FILTERS, type CatKey } from '@/lib/design/cats';

function RadiusControl({ radius, setRadius }: { radius: number; setRadius: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="chip on" onClick={() => setOpen((o) => !o)}>
        <Icon name="sliders" size={15} color="#fff" />
        {radius} mi radius
        <Icon name="chevronD" size={13} color="rgba(255,255,255,0.75)" style={{ marginLeft: 1 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 60,
            width: 256,
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            boxShadow: 'var(--sh-lg)',
            padding: 16,
          }}
        >
          <div className="row between center" style={{ marginBottom: 12 }}>
            <span className="label">Search radius</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-800)' }}>
              {radius} mi
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={50}
            step={1}
            value={radius}
            onChange={(e) => setRadius(+e.target.value)}
            className="bb-range"
            style={{ width: '100%' }}
          />
          <div className="row between" style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              2 mi
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              50 mi
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Sticky filter bar: radius control + category toggle chips + reset.
export default function FilterBar({
  cats,
  toggle,
  radius,
  setRadius,
  reset,
}: {
  cats: Record<CatKey, boolean>;
  toggle: (k: CatKey) => void;
  radius: number;
  setRadius: (n: number) => void;
  reset: () => void;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(250,248,243,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="row g10 wrap" style={{ maxWidth: 1320, margin: '0 auto', padding: '13px 28px' }}>
        <RadiusControl radius={radius} setRadius={setRadius} />
        <div style={{ width: 1, height: 24, background: 'var(--line-2)', margin: '0 2px', alignSelf: 'center' }} />
        {FILTERS.map(([k, l]) => (
          <button key={k} className={`chip ${cats[k] ? 'on' : ''}`} onClick={() => toggle(k)}>
            <Icon name={CATS[k].icon} size={14} color={cats[k] ? '#fff' : 'var(--ink-2)'} />
            {l}
          </button>
        ))}
        <div className="grow" />
        <button className="chip" onClick={reset} style={{ borderStyle: 'dashed' }}>
          <Icon name="x" size={13} color="var(--muted)" />
          Reset
        </button>
      </div>
    </div>
  );
}
