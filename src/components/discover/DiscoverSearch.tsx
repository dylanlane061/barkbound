'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TerrainMap from '@/components/kit/TerrainMap';
import Icon from '@/components/kit/Icon';
import { stopColor } from '@/lib/design/confidence';

export type SearchStop = { id: string; name: string; tripId: string; tripName: string; colorIndex: number };

const POPULAR = [
  'Flagstaff, AZ',
  'Bend, OR',
  'Asheville, NC',
  'Moab, UT',
  'Lake Tahoe, CA',
  'Austin, TX',
];

export default function DiscoverSearch({ stops }: { stops: SearchStop[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');

  function pick(location: string, opts?: { tripId?: string; nodeId?: string }) {
    // Pass the full "City, State" through for geocoding — stripping the state
    // makes ambiguous names (Georgetown, CO vs TX) resolve to the wrong place.
    const params = new URLSearchParams({ location: location.trim() });
    if (opts?.tripId) params.set('trip', opts.tripId);
    if (opts?.nodeId) params.set('node', opts.nodeId);
    router.push(`/discover?${params.toString()}`);
  }

  const pool = [...POPULAR, ...stops.map((s) => `${s.name}`)];
  const matches = q.trim()
    ? pool.filter((p, i, a) => a.indexOf(p) === i).filter((p) => p.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5)
    : [];

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* terrain backdrop */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <TerrainMap h="100%" />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(250,248,243,0.62), rgba(250,248,243,0.93) 62%, var(--paper))',
          }}
        />
      </div>

      <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto', padding: '72px 28px 80px', textAlign: 'center' }}>
        <div className="row g6 center" style={{ justifyContent: 'center', marginBottom: 16 }}>
          <span
            className="row center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              justifyContent: 'center',
              boxShadow: 'var(--sh-sm)',
            }}
          >
            <Icon name="paw" size={16} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
          </span>
          <span className="label">Powered by PawSignal</span>
        </div>
        <h1 className="display" style={{ fontWeight: 800, fontSize: 38, lineHeight: 1.08, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}>
          Find dog-friendly places
          <br />
          anywhere you&rsquo;re headed
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '14px auto 0', maxWidth: 460, lineHeight: 1.5 }}>
          Search a town or city and we&rsquo;ll surface the parks, patios, trails and stays — each scored from real public
          evidence.
        </p>

        {/* search field */}
        <div style={{ position: 'relative', maxWidth: 540, margin: '30px auto 0', textAlign: 'left' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) pick(q);
            }}
            style={{ position: 'relative' }}
          >
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name="search" size={20} color="var(--green-700)" />
            </span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a town or city…"
              style={{
                width: '100%',
                height: 60,
                padding: '0 120px 0 50px',
                borderRadius: 16,
                border: '1px solid var(--line-2)',
                background: 'var(--card)',
                fontFamily: 'var(--f-body)',
                fontSize: 16.5,
                color: 'var(--ink)',
                boxShadow: 'var(--sh)',
                outline: 'none',
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: 9, top: 9, height: 42 }}>
              Search
              <Icon name="arrow" size={16} color="#fff" />
            </button>
          </form>

          {matches.length > 0 && (
            <div
              className="card"
              style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', zIndex: 5, padding: 6, boxShadow: 'var(--sh-pop)' }}
            >
              {matches.map((m) => (
                <button
                  key={m}
                  onClick={() => pick(m)}
                  className="row g10 center"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: 10,
                    textAlign: 'left',
                  }}
                >
                  <Icon name="pin" size={16} color="var(--green-700)" />
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{m}</span>
                  <span className="grow" />
                  <Icon name="arrow" size={15} color="var(--line-2)" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* your trip stops */}
        {stops.length > 0 && (
          <div style={{ maxWidth: 540, margin: '28px auto 0', textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: 10 }}>
              Jump to a stop on your trip
            </div>
            <div className="col g8">
              {stops.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => pick(s.name, { tripId: s.tripId, nodeId: s.id })}
                  className="row g12 center card-lift"
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 13,
                    padding: '11px 13px',
                    boxShadow: 'var(--sh-sm)',
                  }}
                >
                  <span
                    className="row center"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50% 50% 50% 4px',
                      background: stopColor(s.colorIndex),
                      transform: 'rotate(45deg)',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'var(--sh-sm)',
                    }}
                  >
                    <span className="display" style={{ transform: 'rotate(-45deg)', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                      {i + 1}
                    </span>
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="display" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--green-900)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{s.tripName}</div>
                  </div>
                  <span className="row g5 center" style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--green-800)' }}>
                    Discover
                    <Icon name="arrow" size={15} color="var(--green-700)" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* popular destinations */}
        <div style={{ maxWidth: 540, margin: '26px auto 0', textAlign: 'left' }}>
          <div className="label" style={{ marginBottom: 10 }}>
            Popular with dog parents
          </div>
          <div className="row wrap g8">
            {POPULAR.map((p) => (
              <button key={p} onClick={() => pick(p)} className="chip">
                <Icon name="pin" size={14} color="var(--green-700)" />
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
