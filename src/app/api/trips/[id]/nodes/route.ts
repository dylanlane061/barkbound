import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes } from '@/db/schema';
import { geocode } from '@/ingest/geo';
import { getPlaceDetails } from '@/ingest/google';
import { catalogArea } from '@/ingest/catalog';
import { tagsToIncludedTypes, type PlaceTag } from '@/lib/place-tags';
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
  const {
    placeId,
    latitude,
    longitude,
    name,
    location,
    radiusMiles = 25,
    label,
    tags = [],
  } = (await request.json()) as {
    placeId?: string;
    latitude?: number; // resolved client-side by the place picker
    longitude?: number;
    name?: string;
    location?: string; // free-text fallback (geocoded server-side)
    radiusMiles?: number;
    label?: string;
    tags?: PlaceTag[];
  };

  const run = startRun(`Add stop: "${name ?? location ?? placeId ?? ''}" (${radiusMiles}mi)`);

  // Resolve the node center. The place picker already gives us lat/lng + name, so use
  // those directly; fall back to Google Details (place_id only) or Nominatim (free text).
  let center: { lat: number; lon: number };
  let displayName: string;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    center = { lat: latitude, lon: longitude };
    displayName = name?.trim() || 'Selected place';
    run.step('geocode', `Using picked place: ${displayName}`, center);
  } else if (placeId) {
    try {
      const details = await getPlaceDetails(placeId);
      center = { lat: details.latitude, lon: details.longitude };
      displayName = details.name;
      run.step('geocode', `Resolved place ${details.name}`, center);
    } catch (err) {
      run.error('Google place details failed', err);
      return NextResponse.json({ error: 'Could not resolve that place.' }, { status: 422 });
    }
  } else if (location?.trim()) {
    const coords = await geocode(location.trim());
    if (!coords) {
      run.warn(`Geocode failed for "${location.trim()}"`);
      return NextResponse.json(
        { error: `Could not find "${location}". Try a city name or address.` },
        { status: 422 },
      );
    }
    center = { lat: coords.lat, lon: coords.lon };
    displayName = coords.displayName;
    run.step('geocode', `Resolved to ${coords.displayName}`, center);
  } else {
    return NextResponse.json({ error: 'A place is required' }, { status: 400 });
  }

  const [node] = await db
    .insert(tripNodes)
    .values({
      tripId: params.id,
      label: label?.trim() || displayName.split(',')[0].trim(),
      latitude: center.lat,
      longitude: center.lon,
      radiusMiles,
    })
    .returning();

  // Catalog phase: pull candidate places from Google. No scoring yet (Phase 1.5c).
  const includedTypes = tagsToIncludedTypes(tags);
  const catalog = await catalogArea(
    { latitude: center.lat, longitude: center.lon, radiusMiles, includedTypes },
    run,
  );

  await db.update(tripNodes).set({ ingestedAt: new Date() }).where(eq(tripNodes.id, node.id));

  run.done('Stop catalogued', { catalogued: catalog.catalogued });

  return NextResponse.json({ node, catalog }, { status: 201 });
}
