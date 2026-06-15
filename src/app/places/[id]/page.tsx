import { notFound } from 'next/navigation';
import { getPlaceDetail } from '@/lib/place-detail';
import PlaceDetailClient from '@/components/place/PlaceDetailClient';

// DB-backed; assessment is computed/refreshed on demand — always dynamic.
export const dynamic = 'force-dynamic';

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { trip?: string; node?: string };
}) {
  const data = await getPlaceDetail(params.id, {
    tripId: searchParams.trip,
    nodeId: searchParams.node,
  });
  if (!data) notFound();

  return (
    <main>
      <PlaceDetailClient data={data} />
    </main>
  );
}
