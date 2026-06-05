'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/kit/Icon';
import type { SaveTargetTrip } from '@/lib/current-trip';

type Variant = 'icon' | 'ghost' | 'primary';

const MENU_WIDTH = 260;

// Bookmark trigger + a "Save to… (trip ▸ stop)" popover. Lets the user choose
// which trip and which stop to save a place under, instead of silently using
// the active trip. `onPick(tripId, nodeId, tripName, stopLabel)` does the POST.
export default function SaveButton({
  targets,
  saved,
  variant = 'icon',
  label,
  onPick,
}: {
  targets: SaveTargetTrip[];
  saved: boolean;
  variant?: Variant;
  label?: string;
  onPick: (tripId: string, nodeId: string | null, tripName: string, stopLabel: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null); // trigger wrapper
  const popRef = useRef<HTMLDivElement>(null); // portalled popover

  // Anchor the (portalled) popover to the trigger in viewport coords, clamped to
  // the viewport so it never spills off-screen.
  const reposition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPos({ top: r.bottom + 8, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // Keep it pinned to the trigger as the page scrolls/resizes.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      // The popover lives in a portal, so check it explicitly too.
      if (ref.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function pick(t: SaveTargetTrip, nodeId: string | null, stopLabel: string | null) {
    onPick(t.tripId, nodeId, t.tripName, stopLabel);
    setOpen(false);
  }

  const trigger =
    variant === 'icon' ? (
      <button
        className="rc-btn"
        title={saved ? 'Saved — save to another stop' : 'Save to a trip'}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={saved ? { color: 'var(--hi)', borderColor: 'var(--hi-line)', background: 'var(--hi-bg)' } : undefined}
      >
        <Icon name={saved ? 'check' : 'bookmark'} size={14} color={saved ? 'var(--hi)' : 'var(--green-800)'} stroke={saved ? 2.4 : 1.7} />
      </button>
    ) : (
      <button
        className={`btn btn-${variant === 'primary' ? 'primary' : 'ghost'} ${variant === 'ghost' ? 'btn-sm' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          width: variant === 'primary' ? '100%' : undefined,
          ...(saved && variant === 'ghost'
            ? { color: 'var(--hi)', borderColor: 'var(--hi-line)', background: 'var(--hi-bg)' }
            : {}),
        }}
      >
        <Icon
          name={saved ? 'check' : 'bookmark'}
          size={variant === 'primary' ? 16 : 14}
          color={variant === 'primary' ? '#fff' : saved ? 'var(--hi)' : 'var(--green-800)'}
          stroke={saved ? 2.4 : 1.7}
        />
        {label ?? (saved ? 'Saved' : 'Save')}
      </button>
    );

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {trigger}
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
        <div
          ref={popRef}
          className="card scroll"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 1000,
            width: MENU_WIDTH,
            maxHeight: 340,
            overflowY: 'auto',
            boxShadow: 'var(--sh-lg)',
            padding: 6,
          }}
        >
          <div className="label" style={{ padding: '8px 10px 6px' }}>
            Save to
          </div>
          {targets.length === 0 ? (
            <div style={{ padding: '8px 10px 12px', fontSize: 12.5, color: 'var(--muted)' }}>
              No trips yet — create one first.
            </div>
          ) : (
            targets.map((t) => (
              <div key={t.tripId} style={{ marginBottom: 4 }}>
                <div
                  className="row between center"
                  style={{ padding: '6px 10px 2px', fontSize: 12.5, fontWeight: 700, color: 'var(--green-900)' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tripName}</span>
                  {t.status === 'active' && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--orange)' }}>
                      Active
                    </span>
                  )}
                </div>
                {t.stops.map((s) => (
                  <button
                    key={s.id}
                    className="row g8 center"
                    onClick={() => pick(t, s.id, s.label)}
                    style={menuRow}
                  >
                    <Icon name="pin" size={14} color="var(--green-700)" />
                    {s.label}
                  </button>
                ))}
                <button className="row g8 center" onClick={() => pick(t, null, null)} style={{ ...menuRow, color: 'var(--muted)' }}>
                  <Icon name="bookmark" size={13} color="var(--muted)" />
                  Trip · no specific stop
                </button>
              </div>
            ))
          )}
        </div>,
          document.body,
        )}
    </div>
  );
}

const menuRow: React.CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  fontSize: 13.5,
  color: 'var(--ink)',
  fontWeight: 500,
};
