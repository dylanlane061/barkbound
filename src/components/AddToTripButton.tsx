'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddToTripButton({
  tripId,
  placeId,
}: {
  tripId: string;
  placeId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    await fetch(`/api/trips/${tripId}/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="shrink-0 rounded border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:border-stone-400 transition-colors disabled:opacity-50"
    >
      {loading ? 'Adding...' : 'Add to trip'}
    </button>
  );
}
