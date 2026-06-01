'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const trip = await res.json();
    router.push(`/trips/${trip.id}`);
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link href="/trips" className="text-sm text-stone-500 hover:text-stone-700 mb-8 inline-block">
          ← Trips
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-8">New trip</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Trip name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pacific Northwest Road Trip"
              className="w-full rounded-lg border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg bg-stone-900 px-6 py-3 text-white font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create trip'}
          </button>
        </form>
      </div>
    </main>
  );
}
