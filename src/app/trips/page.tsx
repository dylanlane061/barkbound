import { getTripSummaries } from '@/lib/trip-summary';
import TripsClient from '@/components/trips/TripsClient';

// DB-backed and mutated by trip creation — re-query on every request.
export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const trips = await getTripSummaries();
  return (
    <main>
      <TripsClient initialTrips={trips} />
    </main>
  );
}
