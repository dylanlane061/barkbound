'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/kit/Icon';

const SUGGESTED: { name: string; state: string }[] = [
  { name: 'Bend', state: 'OR' },
  { name: 'Asheville', state: 'NC' },
  { name: 'Moab', state: 'UT' },
  { name: 'Flagstaff', state: 'AZ' },
  { name: 'Bozeman', state: 'MT' },
  { name: 'Truckee', state: 'CA' },
];

type Suggestion = { placeId: string; primaryText: string; secondaryText?: string };

// Inline add-stop affordance: a dashed pin + button that expands to a search
// field with live Google typeahead plus suggested-town chips. `onAdd` takes the
// resolved location and an optional place_id (exact coords server-side).
export default function AddStopPanel({
  existingNames,
  onAdd,
}: {
  existingNames: string[];
  onAdd: (location: string, placeId?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // One Google Autocomplete session token per add-stop session (billing).
  const tokenRef = useRef<string>(typeof crypto !== 'undefined' ? crypto.randomUUID() : 'tok');

  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  const avail = SUGGESTED.filter((s) => !taken.has(s.name.toLowerCase()));

  // Debounced Google typeahead, mirroring the Discover search box.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(text)}&token=${tokenRef.current}`,
        );
        if (res.ok) setSuggestions((await res.json()) as Suggestion[]);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  async function add(location: string, placeId?: string) {
    if (!location.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(location.trim(), placeId);
      setQuery('');
      setSuggestions([]);
      setOpen(false);
      // Fresh session token for the next add.
      tokenRef.current = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'tok';
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
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div className="input-wrap">
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
              {suggestions.length > 0 && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 'calc(100% + 6px)',
                    zIndex: 20,
                    padding: 6,
                    boxShadow: 'var(--sh-pop)',
                  }}
                >
                  {suggestions.slice(0, 6).map((s) => (
                    <button
                      key={s.placeId}
                      disabled={busy}
                      onClick={() => add(s.primaryText, s.placeId)}
                      className="row g10 center"
                      style={suggestRow}
                    >
                      <Icon name="pin" size={16} color="var(--green-700)" />
                      <span className="col" style={{ alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.primaryText}</span>
                        {s.secondaryText && (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: 'var(--muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.secondaryText}
                          </span>
                        )}
                      </span>
                      <span className="grow" />
                      <Icon name="plus" size={14} color="var(--green-700)" stroke={2} />
                    </button>
                  ))}
                </div>
              )}
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

const suggestRow: React.CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '9px 11px',
  borderRadius: 10,
  textAlign: 'left',
};
