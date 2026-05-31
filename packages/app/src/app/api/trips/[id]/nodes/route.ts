import '@/ingest/sources'; // registers all area fetchers and extractors
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes } from '@/db/schema';
import { geocode, radiusToBbox } from '@/ingest/geo';
import { ingestArea } from '@/ingest/runner';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const nodes = await db
    .select()
    .from(tripNodes)
    .where(eq(tripNodes.tripId, params.id))
    .orderBy(tripNodes.createdAt);
  return NextResponse.json(nodes);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { location, radiusMiles = 25, label } = (await request.json()) as {
    location: string;
    radiusMiles?: number;
    label?: string;
  };

  if (!location?.trim()) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  }

  const coords = await geocode(location.trim());
  if (!coords) {
    return NextResponse.json(
      { error: `Could not find "${location}". Try a city name or address.` },
      { status: 422 },
    );
  }

  const [node] = await db
    .insert(tripNodes)
    .values({
      tripId: params.id,
      label: label?.trim() || coords.displayName.split(',')[0].trim(),
      latitude: coords.lat,
      longitude: coords.lon,
      radiusMiles,
    })
    .returning();

  const bbox = radiusToBbox(coords.lat, coords.lon, radiusMiles);
  const ingestResult = await ingestArea(node.id, bbox);

  return NextResponse.json({ node, ingestResult }, { status: 201 });
}
