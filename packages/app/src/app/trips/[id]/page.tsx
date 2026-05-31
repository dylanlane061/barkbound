import { and, eq, gte, isNotNull, lte } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db/client';
import { places, tripNodes, tripPlaces, trips } from '@/db/schema';
import { radiusToBbox } from '@/ingest/geo';
import NodeForm from '@/components/NodeForm';
import AddToTripButton from '@/components/AddToTripButton';

export default async function TripPage({ params }: { params: { id: string } }) {
  const [trip] = await db.select().from(trips).where(eq(trips.id, params.id));
  if (!trip) notFound();

  const nodes = await db
    .select()
    .from(tripNodes)
    .where(eq(tripNodes.tripId, params.id))
    .orderBy(tripNodes.createdAt);

  const nodeResults = await Promise.all(
    nodes.map(async (node) => {
      const bbox = radiusToBbox(node.latitude, node.longitude, node.radiusMiles);
      const nodePlaces = await db
        .select()
        .from(places)
        .where(
          and(
            isNotNull(places.latitude),
            isNotNull(places.longitude),
            gte(places.latitude, bbox.minLat),
            lte(places.latitude, bbox.maxLat),
            gte(places.longitude, bbox.minLon),
            lte(places.longitude, bbox.maxLon),
          ),
        )
        .limit(50);
      return { node, places: nodePlaces };
    }),
  );

  const itinerary = await db
    .select({
      id: tripPlaces.id,
      placeId: tripPlaces.placeId,
      name: places.name,
      city: places.city,
      state: places.state,
    })
    .from(tripPlaces)
    .innerJoin(places, eq(tripPlaces.placeId, places.id))
    .where(eq(tripPlaces.tripId, params.id));

  const savedIds = new Set(itinerary.map((i) => i.placeId));

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link
          href="/trips"
          className="text-sm text-stone-500 hover:text-stone-700 mb-8 inline-block"
        >
          ← All trips
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-10">{trip.name}</h1>

        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">
            Add a stop
          </h2>
          <NodeForm tripId={params.id} />
        </section>

        {nodeResults.map(({ node, places: nodePlaces }) => (
          <section key={node.id} className="mb-10">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="font-semibold">{node.label}</h2>
              <span className="text-sm text-stone-400">{node.radiusMiles} mi radius</span>
              {node.ingestedAt && (
                <span className="text-xs text-stone-400">
                  · checked {new Date(node.ingestedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {nodePlaces.length === 0 ? (
              <p className="text-sm text-stone-400">
                {node.ingestedAt
                  ? 'No places found in this area.'
                  : 'Gathering evidence...'}
              </p>
            ) : (
              <ul className="space-y-2">
                {nodePlaces.map((place) => (
                  <li
                    key={place.id}
                    className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/places/${place.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {place.name}
                      </Link>
                      {(place.city || place.state) && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {[place.city, place.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {savedIds.has(place.id) ? (
                      <span className="text-xs text-stone-400 shrink-0">Added</span>
                    ) : (
                      <AddToTripButton tripId={params.id} placeId={place.id} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {itinerary.length > 0 && (
          <section className="border-t border-stone-200 pt-8 mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">
              Itinerary
            </h2>
            <ul className="space-y-2">
              {itinerary.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/places/${item.placeId}`}
                    className="text-sm hover:underline font-medium"
                  >
                    {item.name}
                  </Link>
                  {(item.city || item.state) && (
                    <span className="text-xs text-stone-400 ml-2">
                      {[item.city, item.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
