'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/kit/Icon';
import type { TripStatus } from '@/lib/trip-summary';

// Trip-level actions in the Trip Detail hero: set the current trip active
// (single active enforced server-side) and delete the trip.
export default function TripActionsMenu({
  tripId,
  status,
  name,
}: {
  tripId: string;
  status: TripStatus;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  async function setStatus(next: TripStatus) {
    setBusy(true);
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete "${name}"? This removes its stops and saved places.`)) return;
    setBusy(true);
    const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
    if (res.ok) router.push('/trips');
    else setBusy(false);
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)} disabled={busy}>
        <Icon name="sliders" size={16} color="var(--green-800)" />
        Manage
      </button>
      {open && (
        <div
          className="card"
          style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 220, boxShadow: 'var(--sh-lg)', padding: 6 }}
        >
          {status !== 'active' && (
            <button className="row g8 center" style={row} onClick={() => setStatus('active')}>
              <Icon name="check" size={15} color="var(--orange)" stroke={2.2} />
              Set as active trip
            </button>
          )}
          {status !== 'planning' && (
            <button className="row g8 center" style={row} onClick={() => setStatus('planning')}>
              <Icon name="route" size={15} color="var(--green-700)" />
              Mark as planning
            </button>
          )}
          {status !== 'past' && (
            <button className="row g8 center" style={row} onClick={() => setStatus('past')}>
              <Icon name="clock" size={15} color="var(--muted)" />
              Mark as past
            </button>
          )}
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 6px' }} />
          <button className="row g8 center" style={{ ...row, color: 'var(--lo)' }} onClick={remove}>
            <Icon name="x" size={15} color="var(--lo)" stroke={2.2} />
            Delete trip
          </button>
        </div>
      )}
    </div>
  );
}

const row: React.CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  padding: '9px 10px',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 500,
  color: 'var(--ink)',
};
