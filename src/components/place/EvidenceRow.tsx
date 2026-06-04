'use client';

import { useState } from 'react';
import Icon from '@/components/kit/Icon';
import { Conf } from '@/components/kit/Score';
import { toScore100 } from '@/lib/design/confidence';
import type { EvidenceRow as EvidenceRowData } from '@/lib/place-detail';

// One source/signal evidence row. Expands to reveal the exact raw record behind
// the signal — the transparent, traceable evidence chain (never a black box).
export default function EvidenceRow({
  e,
  defaultOpen = false,
  last = false,
}: {
  e: EvidenceRowData;
  defaultOpen?: boolean;
  last?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <button
        className="ev-toggle row g12"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '14px 10px',
          alignItems: 'center',
        }}
      >
        <Icon name="chevron" size={15} color="var(--muted)" className={`ev-chevron ${open ? 'open' : ''}`} />
        <span
          className="row center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--green-tint-2)',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="doc" size={16} color="var(--green-700)" />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row g8 center">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-900)' }}>{e.claim}</span>
            {e.detail && (
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>({e.detail})</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {e.sourceLabel} · {toScore100(e.confidence)}% signal confidence
          </div>
        </div>
        <Conf level={e.tier} small />
      </button>
      {open && (
        <div style={{ padding: '0 10px 16px 61px' }}>
          <div
            className="mono"
            style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              fontSize: 11.5,
              color: 'var(--ink-2)',
              overflowX: 'auto',
              lineHeight: 1.5,
            }}
          >
            {e.raw ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(e.raw, null, 2)}
              </pre>
            ) : (
              <span style={{ color: 'var(--muted)' }}>Raw evidence unavailable.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
