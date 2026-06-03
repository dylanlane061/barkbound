'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/kit/Icon';
import { relativeTime } from '@/lib/format';
import type { TripSummary } from '@/lib/trip-summary';
import StatusPill from './StatusPill';
import PickChip from './PickChip';
import TripCover from './TripCover';
import Stat from './Stat';

export default function TripCard({ trip }: { trip: TripSummary }) {
  const router = useRouter();
  const open = () => router.push(`/trips/${trip.id}`);

  return (
    <div
      className="card card-lift col"
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open();
      }}
      style={{ overflow: 'hidden', height: '100%' }}
    >
      <div style={{ position: 'relative' }}>
        <TripCover tone={trip.coverTone} region={trip.region} h={150} />
        <div style={{ position: 'absolute', right: 12, top: 12 }}>
          <StatusPill status={trip.status} />
        </div>
      </div>

      <div className="col" style={{ padding: '15px 16px 16px', flex: 1 }}>
        <h3
          className="display"
          style={{ fontWeight: 700, fontSize: 17, color: 'var(--green-900)', lineHeight: 1.2, margin: 0 }}
        >
          {trip.name}
        </h3>

        <div className="row wrap g14" style={{ marginTop: 11 }}>
          <Stat icon="pin">{trip.stopCount}</Stat>
          <Stat icon="bookmark">{trip.placeCount}</Stat>
          <Stat icon="route">{Math.round(trip.miles)} mi</Stat>
        </div>

        <div style={{ marginTop: 14 }}>
          {trip.picks.length > 0 ? (
            <div className="row wrap g6">
              {trip.picks.map((p) => (
                <PickChip key={p.id} score={p.score} tier={p.tier} category={p.category} name={p.name} />
              ))}
            </div>
          ) : (
            <span className="row center g6" style={{ fontSize: 12, color: 'var(--muted)' }}>
              <Icon name="search" size={13} color="var(--muted)" />
              No places saved yet
            </span>
          )}
        </div>

        <div className="grow" />
        <div
          className="row between center"
          style={{ marginTop: 15, paddingTop: 13, borderTop: '1px solid var(--line)' }}
        >
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {relativeTime(trip.updatedAt)}</span>
          <span className="row center g4" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green-800)' }}>
            Open
            <Icon name="chevron" size={14} color="var(--green-700)" />
          </span>
        </div>
      </div>
    </div>
  );
}
