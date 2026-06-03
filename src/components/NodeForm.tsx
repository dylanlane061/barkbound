'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { PLACE_TAG_LABELS, type PlaceTag } from '@/lib/place-tags';
import type { SelectedPlace } from './PlaceAutocomplete';

// Client-only: the place-picker web components touch `window` on import.
const PlaceAutocomplete = dynamic(() => import('./PlaceAutocomplete'), {
  ssr: false,
  loading: () => (
    <div className="h-11 w-full rounded-lg border border-stone-200 bg-stone-100 animate-pulse" />
  ),
});

const RADIUS_OPTIONS = [10, 25, 50, 100];
const TAGS = Object.keys(PLACE_TAG_LABELS) as PlaceTag[];

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function NodeForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [place, setPlace] = useState<SelectedPlace | null>(null);
  const [radius, setRadius] = useState(25);
  const [tags, setTags] = useState<Set<PlaceTag>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  function toggleTag(tag: PlaceTag) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return;

    setStatus('loading');
    setMessage('Finding places nearby…');

    try {
      const res = await fetch(`/api/trips/${tripId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.placeId,
          latitude: place.latitude,
          longitude: place.longitude,
          name: place.name,
          radiusMiles: radius,
          tags: [...tags],
        }),
      });

      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus('error');
        setMessage(error ?? 'Something went wrong.');
        return;
      }

      const { catalog } = (await res.json()) as { catalog: { catalogued: number } };
      setStatus('done');
      setMessage(
        catalog.catalogued > 0
          ? `Found ${catalog.catalogued} place${catalog.catalogued === 1 ? '' : 's'} nearby.`
          : 'No places found for those filters in this area.',
      );
      setPlace(null);
      router.refresh();
    } catch {
      setStatus('error');
      setMessage('Network error — please try again.');
    }
  }

  if (!apiKey) {
    return (
      <p className="text-sm text-red-600">
        Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code> to enable
        place search.
      </p>
    );
  }

  const isLoading = status === 'loading';

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap items-start">
          <div className="flex-1 min-w-48">
            <PlaceAutocomplete apiKey={apiKey} onSelect={setPlace} />
          </div>

          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            disabled={isLoading}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} miles
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isLoading || !place}
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm text-white font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Find places'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = tags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                disabled={isLoading}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                {PLACE_TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-stone-400">
          {tags.size === 0
            ? 'No filter — searching common place types.'
            : `${tags.size} type${tags.size === 1 ? '' : 's'} selected.`}
        </p>
      </form>

      {status !== 'idle' && (
        <p
          className={`mt-3 text-sm ${
            status === 'error'
              ? 'text-red-600'
              : status === 'done'
                ? 'text-stone-600'
                : 'text-stone-400'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
