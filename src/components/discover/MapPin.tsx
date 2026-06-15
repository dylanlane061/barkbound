'use client';

import Icon from '@/components/kit/Icon';
import { CATS } from '@/lib/design/cats';
import { CONF_VAR } from '@/lib/design/confidence';
import type { DiscoverPlace } from '@/lib/discover';
import type { LiveStatus } from './StatusRing';
import Spinner from './Spinner';

// Content rendered inside a Google AdvancedMarker. Mirrors the prototype's
// custom pin: score chip when scored, spinner while computing, dashed paw when
// unscored; a hover label and active scale/shadow.
export default function MapPin({
  place,
  status,
  state,
  onEnter,
  onLeave,
  onClick,
}: {
  place: DiscoverPlace;
  status: LiveStatus;
  state: 'idle' | 'hover' | 'sel';
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const scored = status === 'scored' && place.score != null;
  const computing = status === 'computing';
  const col = scored ? CONF_VAR[place.tier] : 'var(--muted)';
  const active = state === 'hover' || state === 'sel';
  const selFill = state === 'sel' && scored;

  return (
    // AdvancedMarker anchors content by its bottom-center, so no extra transform
    // is needed — the stem points at the place's coordinates.
    <div
      style={{ cursor: 'pointer', position: 'relative' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'calc(100% + 4px)',
          transform: active ? 'translate(-50%,0)' : 'translate(-50%,4px)',
          opacity: active ? 1 : 0,
          transition: 'opacity .16s, transform .16s',
          whiteSpace: 'nowrap',
          background: 'var(--ink)',
          color: '#fff',
          fontSize: 11.5,
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: 7,
          pointerEvents: 'none',
          boxShadow: 'var(--sh)',
        }}
      >
        {place.name}
      </div>
      <div
        className={computing ? 'pin-pulse' : ''}
        style={{
          background: selFill ? col : 'var(--card)',
          border: `1.5px solid ${scored ? col : 'var(--line-2)'}`,
          borderStyle: scored || computing ? 'solid' : 'dashed',
          borderRadius: 11,
          padding: '4px 9px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          boxShadow: active ? 'var(--sh-lg)' : 'var(--sh)',
          transform: active ? 'scale(1.14)' : 'none',
          transition: 'transform .16s, box-shadow .16s, background .16s',
        }}
      >
        {scored ? (
          <>
            {place.category && (
              <Icon name={CATS[place.category].icon} size={13} color={selFill ? '#fff' : col} stroke={2} />
            )}
            <span className="display" style={{ fontWeight: 800, fontSize: 14, color: selFill ? '#fff' : col, lineHeight: 1 }}>
              {place.score}
            </span>
          </>
        ) : computing ? (
          <Spinner size={13} />
        ) : (
          <Icon name="paw" size={14} color="var(--muted)" fill="var(--muted)" stroke={0} />
        )}
      </div>
      <div style={{ width: 2, height: 9, background: scored ? col : 'var(--line-2)', margin: '0 auto', opacity: 0.75 }} />
    </div>
  );
}
