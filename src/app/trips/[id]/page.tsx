import { notFound } from 'next/navigation';
import { getTripDetail } from '@/lib/trip-detail';
import TripDetailClient from '@/components/trip/TripDetailClient';

// DB-backed and edited in place (reorder / add / remove) — re-query per request.
export const dynamic = 'force-dynamic';

export default async function TripPage({ params }: { params: { id: string } }) {
  const trip = await getTripDetail(params.id);
  if (!trip) notFound();

  return (
    <main>
      <TripDetailClient trip={trip} />
    </main>
  );
}
