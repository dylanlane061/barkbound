'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Crumb from '@/components/kit/Crumb';
import Icon from '@/components/kit/Icon';
import Toast, { type ToastData } from '@/components/kit/Toast';
import { haversineMiles } from '@/ingest/geo';
import { driveEstimate, relativeTime } from '@/lib/format';
import type { TripDetail, StopView } from '@/lib/trip-detail';
import StopSection from './StopSection';
import AddStopPanel from './AddStopPanel';
import Leg from './Leg';

function legBetween(a: StopView, b: StopView): { miles: number; label: string } | null {
  if (a.latitude == null || b.latitude == null) return null;
  const straight = haversineMiles(a.latitude, a.longitude, b.latitude, b.longitude);
  if (!Number.isFinite(straight) || straight === 0) return null;
  return driveEstimate(straight);
}

export default function TripDetailClient({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [stops, setStops] = useState<StopView[]>(trip.stops);
  const [toast, setToast] = useState<ToastData | null>(null);

  const legs = useMemo(
    () => stops.map((s, i) => (i === 0 ? null : legBetween(stops[i - 1], s))),
    [stops],
  );

  // Hero stats recompute live from the current stops.
  const stats = useMemo(() => {
    const places = stops.reduce((n, s) => n + s.saved.length, 0);
    const miles = legs.reduce((sum, leg) => sum + (leg?.miles ?? 0), 0);
    const nights = stops.reduce((n, s) => n + s.nights, 0);
    return { stops: stops.length, places, miles, nights };
  }, [stops, legs]);

  const canRemoveStop = stops.length > 1;

  // ---- editing ops (optimistic; reconcile via router.refresh on failure) ----
  async function moveStop(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[index], next[j]] = [next[j], next[index]];
    setStops(next);
    const res = await fetch(`/api/trips/${trip.id}/nodes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((s) => s.id) }),
    });
    if (!res.ok) router.refresh();
  }

  async function removePlace(nodeId: string, placeId: string) {
    setStops((prev) =>
      prev.map((s) => (s.id === nodeId ? { ...s, saved: s.saved.filter((p) => p.id !== placeId) } : s)),
    );
    const res = await fetch(`/api/trips/${trip.id}/places`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, nodeId }),
    });
    if (!res.ok) router.refresh();
  }

  async function removeStop(nodeId: string) {
    if (!canRemoveStop) return;
    const prev = stops;
    setStops((s) => s.filter((x) => x.id !== nodeId));
    const res = await fetch(`/api/trips/${trip.id}/nodes/${nodeId}`, { method: 'DELETE' });
    if (!res.ok) {
      setStops(prev);
      setToast({ message: 'Could not remove that stop.', icon: 'x' });
    }
  }

  async function addStop(location: string) {
    const res = await fetch(`/api/trips/${trip.id}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setToast({ message: body.error ?? 'Could not add that stop.', icon: 'x' });
      return;
    }
    const { node } = (await res.json()) as {
      node: { id: string; label: string | null; latitude: number; longitude: number; nights: number; colorIndex: number };
    };
    // Reflect the new stop locally; refresh in the background so its catalog /
    // color resolve from the server source of truth.
    router.refresh();
    setToast({ message: `${node.label ?? 'Stop'} added to your trip`, icon: 'check' });
  }

  return (
    <div className="screen-anim">
      {/* hero */}
      <div style={{ borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg, var(--green-tint-2), var(--paper))' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 28px 22px' }}>
          <Crumb items={[{ label: 'Trips', href: '/trips' }, { label: trip.name }]} />
          <div className="row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 560 }}>
              {trip.status === 'active' && (
                <div className="row g8 center" style={{ marginBottom: 10 }}>
                  <span
                    className="row g6 center"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      background: 'var(--orange)',
                      padding: '4px 10px',
                      borderRadius: 999,
                    }}
                  >
                    <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    Active trip
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {relativeTime(trip.updatedAt)}</span>
                </div>
              )}
              <h1
                className="display"
                style={{ fontWeight: 800, fontSize: 33, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}
              >
                {trip.name}
              </h1>
              <div className="row g16 wrap" style={{ marginTop: 13, color: 'var(--ink-2)', fontSize: 13.5 }}>
                <span className="row g6 center">
                  <Icon name="pin" size={16} color="var(--green-700)" />
                  {stats.stops} stops
                </span>
                <span className="row g6 center">
                  <Icon name="bookmark" size={16} color="var(--green-700)" />
                  {stats.places} places saved
                </span>
                <span className="row g6 center">
                  <Icon name="route" size={16} color="var(--green-700)" />
                  {stats.miles} miles
                </span>
                <span className="row g6 center">
                  <Icon name="clock" size={16} color="var(--green-700)" />
                  {stats.nights} nights
                </span>
              </div>
            </div>
            <div className="row g10" style={{ flexShrink: 0 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setToast({ message: `Share link for “${trip.name}” copied`, icon: 'share' })}
              >
                <Icon name="share" size={16} color="var(--green-800)" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* itinerary */}
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '24px 28px 80px' }}>
        <div className="row between center" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <h2 className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)', margin: 0 }}>
            Route &amp; saved places
          </h2>
          <span className="row g6 center" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            <Icon name="sliders" size={14} color="var(--muted)" />
            Reorder with the arrows · remove on hover
          </span>
        </div>

        <div>
          {stops.map((s, i) => (
            <div key={s.id}>
              {i > 0 && (
                <div style={{ paddingLeft: 50 }}>
                  <Leg leg={legs[i]} name={s.name} />
                </div>
              )}
              <StopSection
                stop={s}
                n={i + 1}
                index={i}
                total={stops.length}
                onMoveUp={() => moveStop(i, -1)}
                onMoveDown={() => moveStop(i, 1)}
                onRemovePlace={(placeId) => removePlace(s.id, placeId)}
                onRemoveStop={canRemoveStop ? () => removeStop(s.id) : null}
              />
            </div>
          ))}
        </div>

        <AddStopPanel existingNames={stops.map((s) => s.name)} onAdd={addStop} />

        <div className="row g8 center" style={{ marginTop: 24, paddingLeft: 50, fontSize: 12, color: 'var(--muted)' }}>
          <Icon name="shield" size={14} color="var(--muted)" />
          PawSignal scores estimate dog-friendliness from public evidence — always confirm before you go.
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
