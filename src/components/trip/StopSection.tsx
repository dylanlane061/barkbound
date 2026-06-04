'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon, { type IconName } from '@/components/kit/Icon';
import { pluralize } from '@/lib/format';
import type { StopView } from '@/lib/trip-detail';
import SavedRow from './SavedRow';

function CtrlBtn({
  icon,
  rotate,
  disabled,
  onClick,
  title,
}: {
  icon: IconName;
  rotate?: number;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="row center"
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: !disabled && hover ? 'var(--green-tint-2)' : 'var(--card)',
        border: `1px solid ${!disabled && hover ? 'var(--green-600)' : 'var(--line-2)'}`,
        cursor: disabled ? 'default' : 'pointer',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'border-color .14s, background .14s',
      }}
    >
      <Icon name={icon} size={16} color="var(--ink-2)" stroke={2} style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined} />
    </button>
  );
}

// One stop: spine pin + dashed line + editable card with its saved places.
export default function StopSection({
  stop,
  n,
  index,
  total,
  tripId,
  onMoveUp,
  onMoveDown,
  onRemovePlace,
  onRemoveStop,
}: {
  stop: StopView;
  n: number;
  index: number;
  total: number;
  tripId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemovePlace: (placeId: string) => void;
  onRemoveStop: (() => void) | null;
}) {
  const last = index === total - 1;
  // Carry trip + stop + exact coords so Discover saves back to this stop and
  // skips re-geocoding.
  const discoverHref =
    `/discover?location=${encodeURIComponent(stop.name)}` +
    `&trip=${tripId}&node=${stop.id}&lat=${stop.latitude}&lon=${stop.longitude}`;

  return (
    <div className="row" style={{ alignItems: 'stretch', gap: 16 }}>
      {/* spine */}
      <div style={{ position: 'relative', width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {!last && (
          <div
            style={{ position: 'absolute', top: 30, bottom: -22, left: '50%', width: 0, borderLeft: '2px dashed var(--line-2)' }}
          />
        )}
        <div
          className="row center"
          style={{
            position: 'relative',
            zIndex: 1,
            width: 30,
            height: 30,
            borderRadius: '50% 50% 50% 4px',
            background: stop.color,
            transform: 'rotate(45deg)',
            border: '2px solid var(--paper)',
            boxShadow: 'var(--sh-sm)',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span className="display" style={{ transform: 'rotate(-45deg)', color: '#fff', fontWeight: 800, fontSize: 13 }}>
            {n}
          </span>
        </div>
      </div>

      {/* card */}
      <div className="grow" style={{ minWidth: 0, paddingBottom: last ? 0 : 26 }}>
        <div className="hover-host card" style={{ position: 'relative', padding: 16 }}>
          {onRemoveStop && (
            <button
              className="hover-reveal row center"
              title="Remove stop"
              aria-label={`Remove ${stop.name}`}
              onClick={onRemoveStop}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
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
          )}

          {/* header */}
          <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="display" style={{ fontWeight: 800, fontSize: 21, color: 'var(--green-900)', margin: 0 }}>
                {stop.name}
              </h2>
              <div className="row g10 center wrap" style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-2)' }}>
                <span className="row g6 center">
                  <Icon name="clock" size={13} color="var(--green-700)" />
                  {pluralize(stop.nights, 'night')}
                </span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span className="row g6 center">
                  <Icon name="bookmark" size={13} color="var(--green-700)" />
                  {stop.saved.length} saved
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 6, flexShrink: 0, marginRight: onRemoveStop ? 30 : 0 }}>
              <CtrlBtn icon="chevronD" rotate={180} disabled={index === 0} onClick={onMoveUp} title="Move stop earlier" />
              <CtrlBtn icon="chevronD" disabled={last} onClick={onMoveDown} title="Move stop later" />
            </div>
          </div>

          {stop.note && (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -6, marginBottom: 13 }}>{stop.note}</div>
          )}

          {/* saved places */}
          {stop.saved.length > 0 ? (
            <div className="col g8">
              {stop.saved.map((p, i) => (
                <SavedRow key={p.id} place={p} top={i === 0} onRemove={onRemovePlace} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '16px 14px',
                borderRadius: 12,
                border: '1.5px dashed var(--line-2)',
                background: 'var(--paper)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                No places saved here yet.
                <br />
                Discover dog-friendly spots nearby.
              </div>
            </div>
          )}

          {/* discover cta */}
          <Link
            href={discoverHref}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: 12, textDecoration: 'none' }}
          >
            <Icon name="search" size={15} color="var(--green-800)" />
            Discover more places near {stop.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
