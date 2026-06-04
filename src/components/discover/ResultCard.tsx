'use client';

import Photo from '@/components/kit/Photo';
import Icon from '@/components/kit/Icon';
import { CATS } from '@/lib/design/cats';
import { CONF_VAR } from '@/lib/design/confidence';
import { pluralize } from '@/lib/format';
import type { DiscoverPlace } from '@/lib/discover';
import type { SaveTargetTrip } from '@/lib/current-trip';
import SaveButton from '@/components/trips/SaveButton';
import StatusRing, { type LiveStatus } from './StatusRing';
import Spinner from './Spinner';

function fmtDist(d: number): string {
  return d < 10 ? `${d.toFixed(1)} mi` : `${Math.round(d)} mi`;
}

export default function ResultCard({
  place,
  status,
  rank,
  topTag,
  idx,
  selected,
  saved,
  targets,
  onHover,
  onSelect,
  onSaveTo,
  onRun,
  onOpenDetails,
}: {
  place: DiscoverPlace;
  status: LiveStatus;
  rank: number | null;
  topTag: boolean;
  idx: number;
  selected: boolean;
  saved: boolean;
  targets: SaveTargetTrip[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onSaveTo: (placeId: string, tripId: string, nodeId: string | null, tripName: string, stopLabel: string | null) => void;
  onRun: (id: string) => void;
  onOpenDetails: (id: string) => void;
}) {
  const scored = status === 'scored';
  const computing = status === 'computing';
  const cat = place.category;
  const col = place.score != null ? CONF_VAR[place.tier] : 'var(--muted)';

  return (
    <div
      className="res-card card"
      style={{
        animationDelay: `${Math.min(idx * 35, 280)}ms`,
        padding: 14,
        display: 'flex',
        gap: 14,
        cursor: 'pointer',
        borderColor: selected ? 'var(--green-600)' : 'var(--line)',
        boxShadow: selected ? 'var(--sh)' : 'var(--sh-sm)',
        background: selected ? 'var(--green-tint-2)' : 'var(--card)',
        transition: 'border-color .16s, box-shadow .16s, background .16s',
      }}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(place.id)}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Photo
          h={94}
          w={94}
          cat={cat ?? undefined}
          tone="green"
          round={12}
          style={scored ? undefined : { filter: 'saturate(0.7)', opacity: 0.92 }}
        />
        {scored ? (
          <span
            style={{
              position: 'absolute',
              top: 7,
              left: 7,
              width: 22,
              height: 22,
              borderRadius: 7,
              background: 'rgba(20,53,42,0.82)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--f-display)',
              fontWeight: 800,
              fontSize: 11.5,
            }}
          >
            {rank}
          </span>
        ) : (
          <span
            style={{
              position: 'absolute',
              top: 7,
              left: 7,
              padding: '2px 7px',
              borderRadius: 7,
              background: computing ? 'var(--green-700)' : 'rgba(28,28,28,0.55)',
              color: '#fff',
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {computing ? 'Checking' : 'New'}
          </span>
        )}
        {scored && topTag && (
          <span
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              background: 'var(--orange)',
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 999,
              boxShadow: 'var(--sh-sm)',
            }}
          >
            Top match
          </span>
        )}
      </div>

      <div className="grow">
        <div className="row between" style={{ alignItems: 'flex-start', gap: 10 }}>
          <div className="grow">
            <div className="row g8 center">
              {cat && <Icon name={CATS[cat].icon} size={15} color="var(--green-700)" />}
              <span className="display" style={{ fontWeight: 700, fontSize: 16.5, color: 'var(--green-900)' }}>
                {place.name}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              {cat ? CATS[cat].label : 'Place'} · {fmtDist(place.distanceMiles)}
              {place.address ? ` · ${place.address}` : ''}
            </div>
          </div>
          <StatusRing status={status} score={place.score} size={54} />
        </div>

        {scored ? (
          <>
            <div className="row g6 center" style={{ marginTop: 9, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <Icon name="check" size={13} color={place.tier === 'hi' ? 'var(--hi)' : 'var(--muted)'} stroke={2.4} />
              {place.reason}
            </div>
            <div className="row between center" style={{ marginTop: 11 }}>
              <span className="row g6 center" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                <Icon name="shield" size={13} color="var(--muted)" />
                {pluralize(place.sources, 'source')} checked
              </span>
              <div className="row g6 center">
                <SaveButton
                  targets={targets}
                  saved={saved}
                  variant="icon"
                  onPick={(tripId, nodeId, tripName, stopLabel) =>
                    onSaveTo(place.id, tripId, nodeId, tripName, stopLabel)
                  }
                />
                <button
                  className="rc-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails(place.id);
                  }}
                  title="View details"
                >
                  <Icon name="arrow" size={15} color="var(--green-800)" />
                </button>
              </div>
            </div>
          </>
        ) : computing ? (
          <div className="row g6 center" style={{ marginTop: 13, fontSize: 12, color: 'var(--green-700)', fontWeight: 600 }}>
            <Spinner size={13} />
            Running PawSignal across sources…
          </div>
        ) : (
          <div className="row between center" style={{ marginTop: 11, gap: 10 }}>
            <button
              className="row g6 center"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(place.id);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11.5, color: 'var(--green-700)', fontWeight: 600 }}
              title="View details"
            >
              View details
              <Icon name="arrow" size={13} color="var(--green-700)" />
            </button>
            <button
              className="btn btn-orange btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRun(place.id);
              }}
            >
              <Icon name="paw" size={13} color="#fff" fill="#fff" stroke={0} />
              Run check
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
