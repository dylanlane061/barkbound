'use client';

import Photo from '@/components/kit/Photo';
import Icon from '@/components/kit/Icon';
import type { CoverTone } from '@/lib/trip-summary';

// Trip cover image (placeholder until real photos are wired). Carries the region
// chip and a "change cover" affordance — the latter is a stub for the future
// cover-photo picker; it just swallows the click so it doesn't open the trip.
export default function TripCover({
  tone,
  region,
  h = 150,
  big = false,
}: {
  tone: CoverTone;
  region: string | null;
  h?: number | string;
  big?: boolean;
}) {
  return (
    <div style={{ position: 'relative', height: h, overflow: 'hidden' }}>
      <Photo h="100%" tone={tone} glyph="route" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(20,53,42,0.04), rgba(20,53,42,0.16))',
        }}
      />
      {region && (
        <div
          className="row center g6"
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(3px)',
            borderRadius: 8,
            padding: '5px 9px',
          }}
        >
          <Icon name="pin" size={13} color="var(--green-700)" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>{region}</span>
        </div>
      )}
      <button
        title="Change cover photo"
        aria-label="Change cover photo"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          width: big ? 34 : 30,
          height: big ? 34 : 30,
          borderRadius: 9,
          border: 'none',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--sh-sm)',
        }}
      >
        <Icon name="map" size={big ? 17 : 15} color="var(--green-800)" />
      </button>
    </div>
  );
}
