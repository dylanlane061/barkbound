'use client';

import { useMemo, useState } from 'react';
import Icon from '@/components/kit/Icon';
import Toast, { type ToastData } from '@/components/kit/Toast';
import type { TripSummary } from '@/lib/trip-summary';
import FeaturedSpotlight from './FeaturedSpotlight';
import TripCard from './TripCard';
import NewTripCard from './NewTripCard';
import FilterTabs, { type FilterValue } from './FilterTabs';
import CreateTripModal, { type CreateTripInput } from './CreateTripModal';

export default function TripsClient({ initialTrips }: { initialTrips: TripSummary[] }) {
  const [extra, setExtra] = useState<TripSummary[]>([]);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const allTrips = useMemo(() => [...extra, ...initialTrips], [extra, initialTrips]);

  const counts: Record<FilterValue, number> = {
    All: allTrips.length,
    Active: allTrips.filter((t) => t.status === 'active').length,
    Planning: allTrips.filter((t) => t.status === 'planning').length,
    Past: allTrips.filter((t) => t.status === 'past').length,
  };

  const filtered =
    filter === 'All' ? allTrips : allTrips.filter((t) => t.status === filter.toLowerCase());
  const featured = filtered.find((t) => t.status === 'active') ?? null;
  const gridTrips = filtered.filter((t) => t !== featured);
  const totalPlaces = allTrips.reduce((s, t) => s + t.placeCount, 0);

  async function onCreate(input: CreateTripInput) {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: input.name, region: input.region, coverTone: input.tone }),
    });
    if (!res.ok) {
      setToast({ message: 'Could not create the trip — try again.', icon: 'x' });
      return;
    }
    const row = (await res.json()) as { id: string; name: string; region: string | null };
    const newTrip: TripSummary = {
      id: row.id,
      name: row.name,
      status: 'planning',
      region: row.region ?? (input.region || null),
      coverTone: input.tone,
      updatedAt: new Date(),
      stopCount: 0,
      placeCount: 0,
      miles: 0,
      nights: 0,
      firstStop: null,
      picks: [],
    };
    setExtra((prev) => [newTrip, ...prev]);
    setCreating(false);
    setFilter('All');
    setToast({ message: `“${input.name}” created — add your first stop`, icon: 'check' });
  }

  return (
    <div className="screen-anim" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 90px', width: '100%' }}>
      {/* header */}
      <div className="row between wrap" style={{ alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Your adventures
          </div>
          <h1
            className="display"
            style={{ fontWeight: 800, fontSize: 34, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}
          >
            Trips
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            {allTrips.length} adventures planned · {totalPlaces} dog-friendly places researched
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} color="#fff" stroke={2} />
          New trip
        </button>
      </div>

      {featured && <FeaturedSpotlight trip={featured} onShare={(name) => setToast({ message: `Share link for “${name}” copied`, icon: 'share' })} />}

      {/* gallery */}
      <div className="row between center wrap" style={{ marginBottom: 20, gap: 12 }}>
        <h2 className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', margin: 0 }}>
          {filter === 'All' ? 'All trips' : `${filter} trips`}
        </h2>
        <FilterTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {gridTrips.length === 0 && !featured ? (
        <div
          className="card"
          style={{ padding: '46px 28px', textAlign: 'center', borderStyle: 'dashed', background: 'var(--paper)' }}
        >
          <div
            className="row center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--paper-2)',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="route" size={26} color="var(--muted)" />
          </div>
          <div className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', marginBottom: 6 }}>
            No {filter.toLowerCase()} trips
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 auto 18px', maxWidth: 320, lineHeight: 1.5 }}>
            Switch filters or start planning a new dog-friendly adventure.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter('All')} style={{ margin: '0 auto' }}>
            Show all trips
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {gridTrips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
          <NewTripCard onClick={() => setCreating(true)} />
        </div>
      )}

      {creating && <CreateTripModal onClose={() => setCreating(false)} onCreate={onCreate} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
