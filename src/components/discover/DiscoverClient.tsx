'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Crumb from '@/components/kit/Crumb';
import Icon from '@/components/kit/Icon';
import Toast, { type ToastData } from '@/components/kit/Toast';
import { FILTERS, type CatKey } from '@/lib/design/cats';
import { pluralize } from '@/lib/format';
import type { DiscoverData, DiscoverPlace } from '@/lib/discover';
import FilterBar from './FilterBar';
import ResultCard from './ResultCard';
import EmptyState from './EmptyState';
import DiscoverMap from './DiscoverMap';
import PeekCard from './PeekCard';
import Spinner from './Spinner';
import type { LiveStatus } from './StatusRing';

const MAP_TOP = 126; // TopBar (64) + filter bar (~62)
const allCatsOn = () => Object.fromEntries(FILTERS.map(([k]) => [k, true])) as Record<CatKey, boolean>;

export default function DiscoverClient({ data }: { data: DiscoverData }) {
  const router = useRouter();
  const [places, setPlaces] = useState<DiscoverPlace[]>(data.places);
  const [status, setStatus] = useState<Record<string, LiveStatus>>(() =>
    Object.fromEntries(data.places.map((p) => [p.id, p.status])),
  );
  const [cats, setCats] = useState<Record<CatKey, boolean>>(allCatsOn);
  const [radius, setRadius] = useState(25);
  const [sort, setSort] = useState<'Confidence' | 'Distance'>('Confidence');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const checkingRef = useRef(false);

  const statusOf = (id: string): LiveStatus => status[id] ?? 'unscored';

  // filter → sort (scored above unscored)
  const list = useMemo(() => {
    const filtered = places.filter(
      (p) => (p.category == null || cats[p.category]) && p.distanceMiles <= radius,
    );
    return [...filtered].sort((a, b) => {
      const sa = statusOf(a.id) === 'scored';
      const sb = statusOf(b.id) === 'scored';
      if (sa !== sb) return sa ? -1 : 1;
      if (!sa) return a.distanceMiles - b.distanceMiles;
      return sort === 'Confidence'
        ? (b.score ?? 0) - (a.score ?? 0)
        : a.distanceMiles - b.distanceMiles;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, cats, radius, sort, status]);

  const scoredCount = list.filter((p) => statusOf(p.id) === 'scored').length;
  const unscoredIds = list.filter((p) => statusOf(p.id) === 'unscored').map((p) => p.id);
  const checkingCount = Object.values(status).filter((s) => s === 'computing').length;
  const selPlace = selected ? places.find((p) => p.id === selected) ?? null : null;

  const toggle = (k: CatKey) => setCats((c) => ({ ...c, [k]: !c[k] }));
  const reset = () => {
    setCats(allCatsOn());
    setRadius(25);
  };

  async function runCheck(id: string) {
    const place = places.find((p) => p.id === id);
    if (!place || status[id] === 'computing' || status[id] === 'scored') return;
    setStatus((s) => ({ ...s, [id]: 'computing' }));
    try {
      const res = await fetch(`/api/places/${id}/assess`, { method: 'POST' });
      if (!res.ok) throw new Error('assess failed');
      const r = (await res.json()) as {
        score: number;
        tier: DiscoverPlace['tier'];
        reason: string;
        sources: string[];
      };
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'scored', score: r.score, tier: r.tier, reason: r.reason, sources: Math.max(r.sources.length, 1) }
            : p,
        ),
      );
      setStatus((s) => ({ ...s, [id]: 'scored' }));
      setToast({
        message: `${place.name} scored ${r.score}`,
        icon: 'paw',
      });
    } catch {
      setStatus((s) => ({ ...s, [id]: 'unscored' }));
      setToast({ message: `Couldn’t check ${place.name} — try again.`, icon: 'x' });
    }
  }

  async function runAll(ids: string[]) {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      for (const id of ids) {
        // eslint-disable-next-line no-await-in-loop
        await runCheck(id);
      }
    } finally {
      checkingRef.current = false;
    }
  }

  async function onSave(id: string) {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const isSaved = saved.has(id);
    setSaved((s) => {
      const n = new Set(s);
      if (isSaved) n.delete(id);
      else n.add(id);
      return n;
    });

    if (!data.saveTarget) {
      setToast({ message: 'Create a trip first to save places.', icon: 'x' });
      return;
    }

    if (isSaved) {
      await fetch(`/api/trips/${data.saveTarget.tripId}/places`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: id, nodeId: data.saveTarget.nodeId ?? undefined }),
      });
      return;
    }

    await fetch(`/api/trips/${data.saveTarget.tripId}/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: id, nodeId: data.saveTarget.nodeId ?? undefined }),
    });
    setToast({
      message: `Saved ${place.name}`,
      icon: 'check',
      action: { label: 'View trip', onClick: () => router.push(`/trips/${data.saveTarget!.tripId}`) },
    });
  }

  const onSelect = (id: string) => setSelected((s) => (s === id ? null : id));

  // Open Place Detail, carrying the trip/stop context so its save target +
  // breadcrumb match where the user is browsing from.
  function openDetails(id: string) {
    const params = new URLSearchParams();
    if (data.saveTarget?.tripId) params.set('trip', data.saveTarget.tripId);
    if (data.saveTarget?.nodeId) params.set('node', data.saveTarget.nodeId);
    const qs = params.toString();
    router.push(`/places/${id}${qs ? `?${qs}` : ''}`);
  }

  let rank = 0;

  return (
    <div className="screen-anim">
      <FilterBar cats={cats} toggle={toggle} radius={radius} setRadius={setRadius} reset={reset} />

      <div style={{ maxWidth: 1320, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1fr) 1fr', alignItems: 'start' }}>
          {/* list */}
          <div style={{ padding: '18px 28px 60px' }}>
            <Crumb
              items={
                data.fromTrip && data.breadcrumbTrip
                  ? [
                      { label: 'Trips', href: '/trips' },
                      { label: data.breadcrumbTrip.name, href: `/trips/${data.breadcrumbTrip.id}` },
                      { label: data.location },
                    ]
                  : [{ label: 'Discover', href: '/discover' }, { label: data.location }]
              }
            />
            <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 className="display" style={{ fontWeight: 800, fontSize: 27, color: 'var(--green-900)', margin: 0 }}>
                  Dog-friendly near {data.location}
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '7px 0 0' }}>
                  <b style={{ color: 'var(--ink)' }}>{pluralize(list.length, 'place')}</b> within {radius} mi
                  {scoredCount < list.length && (
                    <span>
                      {' '}
                      · <b style={{ color: 'var(--ink)' }}>{scoredCount} scored</b>
                    </span>
                  )}
                </p>
              </div>
              <div className="row g6 center">
                <span className="label" style={{ marginRight: 2 }}>
                  Sort
                </span>
                {(['Confidence', 'Distance'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className="chip"
                    style={s === sort ? { background: 'var(--green-tint)', borderColor: 'var(--green-600)', color: 'var(--green-800)', fontWeight: 600 } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {unscoredIds.length > 0 && (
              <div
                className="card row center g12"
                style={{ padding: '12px 14px', marginBottom: 14, background: 'var(--green-tint-2)' }}
              >
                <div
                  className="row center"
                  style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--card)', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Icon name="paw" size={17} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
                </div>
                <div className="grow">
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--green-900)' }}>
                    {unscoredIds.length} {unscoredIds.length === 1 ? 'place hasn’t' : 'places haven’t'} been checked
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>
                    Run PawSignal across all of them to rank by confidence.
                  </div>
                </div>
                <button
                  className="btn btn-orange btn-sm"
                  onClick={() => runAll(unscoredIds)}
                  disabled={checkingCount > 0}
                  style={checkingCount > 0 ? { background: 'var(--green-tint)', color: 'var(--green-800)' } : undefined}
                >
                  {checkingCount > 0 ? (
                    <>
                      <Spinner size={13} />
                      Checking {checkingCount}…
                    </>
                  ) : (
                    <>
                      <Icon name="paw" size={13} color="#fff" fill="#fff" stroke={0} />
                      Check all
                    </>
                  )}
                </button>
              </div>
            )}

            {list.length === 0 ? (
              <EmptyState reset={reset} />
            ) : (
              <div className="col g14">
                {list.map((p, i) => {
                  const isScored = statusOf(p.id) === 'scored';
                  if (isScored) rank += 1;
                  return (
                    <ResultCard
                      key={p.id}
                      place={p}
                      status={statusOf(p.id)}
                      rank={isScored ? rank : null}
                      topTag={isScored && rank === 1 && sort === 'Confidence'}
                      idx={i}
                      selected={selected === p.id}
                      saved={saved.has(p.id)}
                      onHover={setHovered}
                      onSelect={onSelect}
                      onSave={onSave}
                      onRun={runCheck}
                      onOpenDetails={openDetails}
                    />
                  );
                })}
              </div>
            )}

            <div className="row g8 center" style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
              <Icon name="shield" size={14} color="var(--muted)" />
              Scores estimate dog-friendliness from public evidence — always confirm before you go.
            </div>
          </div>

          {/* map */}
          <div style={{ position: 'sticky', top: MAP_TOP, height: `calc(100vh - ${MAP_TOP}px)`, minHeight: 540 }}>
            <DiscoverMap
              center={{ lat: data.latitude, lon: data.longitude }}
              radiusMiles={radius}
              locationLabel={data.location}
              places={list}
              statusOf={statusOf}
              hoveredId={hovered}
              selectedId={selected}
              onHover={setHovered}
              onSelect={onSelect}
              onClearSelection={() => setSelected(null)}
              peek={
                selPlace && (
                  <PeekCard
                    place={selPlace}
                    status={statusOf(selPlace.id)}
                    saved={saved.has(selPlace.id)}
                    onSave={() => onSave(selPlace.id)}
                    onRun={() => runCheck(selPlace.id)}
                    onClose={() => setSelected(null)}
                    onOpenDetails={() => openDetails(selPlace.id)}
                  />
                )
              }
            />
          </div>
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
