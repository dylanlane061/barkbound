'use client';

import { useState } from 'react';
import Icon from '@/components/kit/Icon';

const SUGGESTED: { name: string; state: string }[] = [
  { name: 'Bend', state: 'OR' },
  { name: 'Asheville', state: 'NC' },
  { name: 'Moab', state: 'UT' },
  { name: 'Flagstaff', state: 'AZ' },
  { name: 'Bozeman', state: 'MT' },
  { name: 'Truckee', state: 'CA' },
];

// Inline add-stop affordance: a dashed pin + button that expands to a search
// field plus suggested-town chips. `onAdd` geocodes the location server-side.
export default function AddStopPanel({
  existingNames,
  onAdd,
}: {
  existingNames: string[];
  onAdd: (location: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  const avail = SUGGESTED.filter((s) => !taken.has(s.name.toLowerCase()));

  async function add(location: string) {
    if (!location.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(location.trim());
      setQuery('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row" style={{ gap: 16, marginTop: 4 }}>
      <div style={{ width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <span
          className="row center"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '2px dashed var(--line-2)',
            justifyContent: 'center',
          }}
        >
          <Icon name="plus" size={15} color="var(--muted)" stroke={2} />
        </span>
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        {!open ? (
          <button
            className="btn btn-quiet"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              border: '1.5px dashed var(--line-2)',
              borderRadius: 14,
              padding: '16px 18px',
              color: 'var(--green-800)',
              fontWeight: 600,
            }}
            onClick={() => setOpen(true)}
          >
            <Icon name="plus" size={17} color="var(--green-800)" stroke={2} />
            Add another stop to this trip
          </button>
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <div className="row between center" style={{ marginBottom: 13 }}>
              <span className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>
                Add a stop
              </span>
              <button
                onClick={() => setOpen(false)}
                title="Cancel"
                aria-label="Cancel"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <Icon name="x" size={15} color="var(--muted)" />
              </button>
            </div>
            <div className="input-wrap" style={{ marginBottom: 14 }}>
              <span className="input-ic">
                <Icon name="search" size={17} color="var(--muted)" />
              </span>
              <input
                className="input"
                placeholder="Search for a town or city…"
                value={query}
                disabled={busy}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') add(query);
                }}
              />
            </div>
            <div className="label" style={{ marginBottom: 10 }}>
              {busy ? 'Adding stop…' : 'Suggested for dog travel'}
            </div>
            {avail.length > 0 ? (
              <div className="row wrap g8">
                {avail.map((s) => (
                  <button
                    key={s.name}
                    className="chip"
                    disabled={busy}
                    onClick={() => add(`${s.name}, ${s.state}`)}
                  >
                    <Icon name="pin" size={14} color="var(--green-700)" />
                    {s.name}, {s.state}
                    <Icon name="plus" size={13} color="var(--green-700)" stroke={2} style={{ marginLeft: 2 }} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                Search above to add any town or city to your route.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
