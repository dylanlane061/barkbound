'use client';

import Photo from '@/components/kit/Photo';
import Icon from '@/components/kit/Icon';
import { Conf } from '@/components/kit/Score';
import { CATS } from '@/lib/design/cats';
import { pluralize } from '@/lib/format';
import type { DiscoverPlace } from '@/lib/discover';
import StatusRing, { type LiveStatus } from './StatusRing';
import Spinner from './Spinner';

function fmtDist(d: number): string {
  return d < 10 ? `${d.toFixed(1)} mi` : `${Math.round(d)} mi`;
}

// Floating mini place card shown when a map pin is selected.
export default function PeekCard({
  place,
  status,
  saved,
  onSave,
  onRun,
  onClose,
  onOpenDetails,
}: {
  place: DiscoverPlace;
  status: LiveStatus;
  saved: boolean;
  onSave: () => void;
  onRun: () => void;
  onClose: () => void;
  onOpenDetails: () => void;
}) {
  const scored = status === 'scored' && place.score != null;
  const computing = status === 'computing';
  const cat = place.category;

  return (
    <div
      className="card"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 14,
        zIndex: 8,
        padding: 13,
        display: 'flex',
        gap: 13,
        alignItems: 'center',
        boxShadow: 'var(--sh-lg)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Photo h={70} w={70} cat={cat ?? undefined} tone="green" round={11} style={{ flexShrink: 0 }} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row g8 center" style={{ marginBottom: 3 }}>
          <span className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>
            {place.name}
          </span>
          {scored ? (
            <Conf level={place.tier} small />
          ) : (
            <span className="conf conf-slate" style={{ fontSize: 10, padding: '3px 7px 3px 6px' }}>
              {computing ? 'Checking' : 'No score'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
          {cat ? CATS[cat].label : 'Place'} · {fmtDist(place.distanceMiles)}
        </div>
        <div className="row g6 center" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
          {scored ? (
            <>
              <Icon name="check" size={12} color="var(--hi)" stroke={2.4} />
              {place.reason}
            </>
          ) : computing ? (
            <>
              <Spinner size={12} />
              Running PawSignal…
            </>
          ) : (
            <>
              <Icon name="shield" size={12} color="var(--muted)" />
              Not checked yet
            </>
          )}
        </div>
      </div>
      <StatusRing status={status} score={place.score} size={56} />
      <div className="col g8" style={{ flexShrink: 0 }}>
        {scored ? (
          <>
            <button className="btn btn-orange btn-sm" onClick={onOpenDetails}>
              Details
              <Icon name="arrow" size={14} color="#fff" />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onSave}
              style={saved ? { color: 'var(--hi)', borderColor: 'var(--hi-line)', background: 'var(--hi-bg)' } : undefined}
            >
              <Icon name={saved ? 'check' : 'bookmark'} size={14} color={saved ? 'var(--hi)' : 'var(--green-800)'} stroke={saved ? 2.4 : 1.7} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-orange btn-sm"
              onClick={onRun}
              disabled={computing}
              style={computing ? { background: 'var(--green-tint)', color: 'var(--green-800)' } : undefined}
            >
              {computing ? (
                <>
                  <Spinner size={13} />
                  Checking…
                </>
              ) : (
                <>
                  <Icon name="paw" size={14} color="#fff" fill="#fff" stroke={0} />
                  Run check
                </>
              )}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onOpenDetails}>
              <Icon name="doc" size={14} color="var(--green-800)" />
              Details
            </button>
          </>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{ position: 'absolute', top: 9, right: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)' }}
      >
        <Icon name="x" size={15} color="var(--muted)" />
      </button>
    </div>
  );
}
