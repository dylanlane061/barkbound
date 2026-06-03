'use client';

import { useState } from 'react';
import Icon from '@/components/kit/Icon';

// Dashed "start a new trip" cell that lives as the last item in the grid.
export default function NewTripCard({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="col center"
      style={{
        appearance: 'none',
        cursor: 'pointer',
        minHeight: 280,
        border: `1.5px dashed ${hover ? 'var(--green-600)' : 'var(--line-2)'}`,
        borderRadius: 16,
        background: hover ? 'var(--green-tint)' : 'var(--green-tint-2)',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--green-800)',
        transition: 'border-color .15s, background .15s',
        fontFamily: 'var(--f-body)',
      }}
    >
      <div
        className="row center"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          justifyContent: 'center',
          boxShadow: 'var(--sh-sm)',
        }}
      >
        <Icon name="plus" size={24} color="var(--green-800)" stroke={2} />
      </div>
      <span style={{ fontWeight: 600, fontSize: 14.5 }}>Start a new trip</span>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Plan a dog-friendly adventure</span>
    </button>
  );
}
