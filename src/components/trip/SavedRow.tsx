'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/kit/Icon';
import { CATS } from '@/lib/design/cats';
import { CONF_VAR } from '@/lib/design/confidence';
import type { SavedPlaceView } from '@/lib/trip-detail';

function fmtDist(d: number | null): string | null {
  if (d == null) return null;
  return d < 10 ? `${d.toFixed(1)} mi` : `${Math.round(d)} mi`;
}

// One saved place inside a stop. Row click → Place Detail; the × removes it.
export default function SavedRow({
  place,
  top,
  onRemove,
}: {
  place: SavedPlaceView;
  top: boolean;
  onRemove: (placeId: string) => void;
}) {
  const router = useRouter();
  const col = CONF_VAR[place.tier];
  const dist = fmtDist(place.distanceMiles);

  return (
    <div
      className="stop-pick hover-host row g12 center"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/places/${place.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/places/${place.id}`);
      }}
      style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 9, background: 'var(--card)' }}
    >
      <span
        className="row center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: 'var(--green-tint-2)',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={place.category ? CATS[place.category].icon : 'paw'} size={20} color="var(--green-700)" />
      </span>

      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row g8 center">
          <span
            className="display"
            style={{
              fontWeight: 700,
              fontSize: 14.5,
              color: 'var(--green-900)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {place.name}
          </span>
          {top && place.score != null && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'var(--orange)',
                padding: '2px 6px',
                borderRadius: 999,
              }}
            >
              Top pick
            </span>
          )}
        </div>
        <div className="row g6 center" style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 3 }}>
          {place.category && (
            <Icon name={CATS[place.category].icon} size={12} color="var(--green-700)" style={{ flexShrink: 0 }} />
          )}
          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {place.category ? CATS[place.category].label : 'Place'}
            {dist ? ` · ${dist}` : ''}
          </span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.summary}</span>
        </div>
      </div>

      {place.score != null ? (
        <div
          className="row center"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--card)',
            border: `1.5px solid ${col}`,
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span className="display" style={{ fontWeight: 800, fontSize: 15, color: col, lineHeight: 1 }}>
            {place.score}
          </span>
        </div>
      ) : (
        <div
          className="row center"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--slate-bg)',
            border: '1.5px dashed var(--slate-line)',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--slate)',
            fontSize: 16,
            fontWeight: 700,
          }}
          title="Not assessed yet"
        >
          ?
        </div>
      )}

      <button
        className="hover-reveal row center"
        title="Remove from stop"
        aria-label={`Remove ${place.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(place.id);
        }}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          justifyContent: 'center',
        }}
      >
        <Icon name="x" size={15} color="var(--muted)" />
      </button>
    </div>
  );
}
