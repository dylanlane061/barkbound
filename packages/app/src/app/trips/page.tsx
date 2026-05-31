import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db/client';
import { trips } from '@/db/schema';

export default async function TripsPage() {
  const allTrips = await db.select().from(trips).orderBy(desc(trips.createdAt));

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <Link
            href="/trips/new"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm text-white font-medium hover:bg-stone-700 transition-colors"
          >
            New trip
          </Link>
        </div>

        {allTrips.length === 0 ? (
          <p className="text-stone-400">
            No trips yet.{' '}
            <Link href="/trips/new" className="underline">
              Create your first one.
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {allTrips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-stone-400 transition-colors"
                >
                  <p className="font-semibold">{trip.name}</p>
                  <p className="text-sm text-stone-400 mt-0.5">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
