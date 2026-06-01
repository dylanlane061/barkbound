import '@/ingest/sources'; // registers all area fetchers and extractors
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes } from '@/db/schema';
import { geocode, radiusToBbox } from '@/ingest/geo';
import { ingestArea } from '@/ingest/runner';
import { startRun } from '@/lib/pipeline';

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

  const run = startRun(`Add stop: "${location.trim()}" (${radiusMiles}mi)`);

  const coords = await geocode(location.trim());
  if (!coords) {
    run.warn(`Geocode failed for "${location.trim()}"`);
    return NextResponse.json(
      { error: `Could not find "${location}". Try a city name or address.` },
      { status: 422 },
    );
  }
  run.step('geocode', `Resolved to ${coords.displayName}`, { lat: coords.lat, lon: coords.lon });

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
  run.step('bbox', `Computed ${radiusMiles}mi bounding box`, { ...bbox });

  const ingestResult = await ingestArea(node.id, bbox, run);

  run.done('Stop added', {
    places: ingestResult.placesUpserted,
    signals: ingestResult.signalsExtracted,
    warnings: ingestResult.warnings.length,
  });

  return NextResponse.json({ node, ingestResult }, { status: 201 });
}
