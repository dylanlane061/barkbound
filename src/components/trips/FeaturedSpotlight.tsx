'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/kit/Icon';
import { CATS } from '@/lib/design/cats';
import { CONF_VAR } from '@/lib/design/confidence';
import { relativeTime } from '@/lib/format';
import type { TripSummary } from '@/lib/trip-summary';
import StatusPill from './StatusPill';
import TripCover from './TripCover';
import Stat from './Stat';

// Active-trip spotlight. The whole card navigates to Trip Detail; Share is a
// separate action that stops propagation.
export default function FeaturedSpotlight({
  trip,
  onShare,
}: {
  trip: TripSummary;
  onShare: (name: string) => void;
}) {
  const router = useRouter();
  const open = () => router.push(`/trips/${trip.id}`);

  return (
    <div
      className="card card-lift"
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open();
      }}
      style={{
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 0.82fr) 1fr',
        marginBottom: 32,
      }}
    >
      <div style={{ position: 'relative', minHeight: 248 }}>
        <TripCover tone={trip.coverTone} region={trip.region} h="100%" big />
        <div style={{ position: 'absolute', left: 16, top: 16 }}>
          <StatusPill status="active" />
        </div>
      </div>

      <div className="col" style={{ padding: '26px 28px' }}>
        <div className="row center g10" style={{ marginBottom: 9 }}>
          <span className="eyebrow">Continue planning</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {relativeTime(trip.updatedAt)}</span>
        </div>

        <h2
          className="display"
          style={{ fontWeight: 800, fontSize: 27, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}
        >
          {trip.name}
        </h2>

        {trip.firstStop && (
          <div className="row center" style={{ gap: 8, marginTop: 8 }}>
            <span className="row center g6" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-700)' }}>
              <Icon name="pin" size={14} color="var(--green-700)" />
              Next up · {trip.firstStop}
            </span>
          </div>
        )}

        <div className="row wrap" style={{ gap: 18, marginTop: 16 }}>
          <Stat icon="pin">{trip.stopCount} stops</Stat>
          <Stat icon="bookmark">{trip.placeCount} places saved</Stat>
          <Stat icon="route">{Math.round(trip.miles)} miles</Stat>
          <Stat icon="clock">{trip.nights} nights</Stat>
        </div>

        {trip.picks.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <div className="label" style={{ marginBottom: 11 }}>
              Top picks so far
            </div>
            <div className="col g8">
              {trip.picks.map((p) => {
                const col = CONF_VAR[p.tier];
                return (
                  <div key={p.id} className="row center g10">
                    <span
                      className="row center"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: 'var(--green-tint-2)',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={p.category ? CATS[p.category].icon : 'paw'} size={14} color="var(--green-700)" />
                    </span>
                    <span className="grow" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                      {p.name}
                    </span>
                    {p.category && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{CATS[p.category].label}</span>
                    )}
                    <span
                      className="display"
                      style={{ fontWeight: 800, fontSize: 15, color: col, minWidth: 24, textAlign: 'right' }}
                    >
                      {p.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grow" />
        <div className="row g10" style={{ marginTop: 22 }}>
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); open(); }}>
            Open trip
            <Icon name="arrow" size={16} color="#fff" stroke={2} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              onShare(trip.name);
            }}
          >
            <Icon name="share" size={16} color="var(--green-800)" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
