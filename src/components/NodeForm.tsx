'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RADIUS_OPTIONS = [10, 25, 50, 100];

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function NodeForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(25);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;

    setStatus('loading');
    setMessage('Finding location and checking PawSignal... this may take a moment.');

    const res = await fetch(`/api/trips/${tripId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: location.trim(), radiusMiles: radius }),
    });

    if (!res.ok) {
      const { error } = (await res.json()) as { error: string };
      setStatus('error');
      setMessage(error ?? 'Something went wrong.');
      return;
    }

    const { ingestResult } = (await res.json()) as {
      ingestResult: { placesUpserted: number; warnings: string[] };
    };

    setStatus('done');
    setMessage(
      ingestResult.placesUpserted > 0
        ? `Done — found ${ingestResult.placesUpserted} new place${ingestResult.placesUpserted === 1 ? '' : 's'}.`
        : 'Done — no new places found in this area yet.',
    );
    setLocation('');
    router.refresh();
  }

  const isLoading = status === 'loading';

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, park, or address..."
          disabled={isLoading}
          className="flex-1 min-w-48 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
        />
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
          disabled={isLoading || !location.trim()}
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm text-white font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Find places'}
        </button>
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
