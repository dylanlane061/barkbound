import { getDiscoverData, getTripStopsForSearch } from '@/lib/discover';
import DiscoverSearch from '@/components/discover/DiscoverSearch';
import DiscoverClient from '@/components/discover/DiscoverClient';

// DB-backed + geocodes the location + reads search params — always dynamic.
export const dynamic = 'force-dynamic';

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { location?: string; lat?: string; lon?: string; trip?: string; node?: string };
}) {
  const location = searchParams.location?.trim();

  // No location chosen → the search empty state.
  if (!location) {
    const stops = await getTripStopsForSearch();
    return (
      <main>
        <DiscoverSearch stops={stops} />
      </main>
    );
  }

  const lat = searchParams.lat ? Number(searchParams.lat) : undefined;
  const lon = searchParams.lon ? Number(searchParams.lon) : undefined;
  const data = await getDiscoverData({
    location,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
    tripId: searchParams.trip,
    nodeId: searchParams.node,
  });

  // Couldn't resolve the location → fall back to the search state.
  if (!data) {
    const stops = await getTripStopsForSearch();
    return (
      <main>
        <DiscoverSearch stops={stops} />
      </main>
    );
  }

  return (
    <main>
      <DiscoverClient data={data} />
    </main>
  );
}
