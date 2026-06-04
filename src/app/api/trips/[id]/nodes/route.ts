import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes, trips } from '@/db/schema';
import { geocode } from '@/ingest/geo';
import { getPlaceDetails } from '@/ingest/google';
import { catalogArea } from '@/ingest/catalog';
import { tagsToIncludedTypes, type PlaceTag } from '@/lib/place-tags';
import { startRun } from '@/lib/pipeline';

function touchTrip(tripId: string) {
  return db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, tripId));
}

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

  // New stops append to the end of the itinerary; color rotates through the pin
  // palette by position.
  const existing = await db
    .select({ id: tripNodes.id })
    .from(tripNodes)
    .where(eq(tripNodes.tripId, params.id));
  const position = existing.length;

  const [node] = await db
    .insert(tripNodes)
    .values({
      tripId: params.id,
      label: label?.trim() || displayName.split(',')[0].trim(),
      latitude: center.lat,
      longitude: center.lon,
      radiusMiles,
      sortOrder: position,
      colorIndex: position % 5,
    })
    .returning();

  // Catalog phase: pull candidate places from Google. Best-effort — adding the
  // stop must succeed even without a Google key (cataloguing can run later when
  // the user opens Discover for this stop).
  const includedTypes = tagsToIncludedTypes(tags);
  let catalog = { catalogued: 0, created: 0, updated: 0 };
  try {
    catalog = await catalogArea(
      { latitude: center.lat, longitude: center.lon, radiusMiles, includedTypes },
      run,
    );
    await db.update(tripNodes).set({ ingestedAt: new Date() }).where(eq(tripNodes.id, node.id));
  } catch (err) {
    run.warn(`Catalog skipped: ${err instanceof Error ? err.message : 'unknown error'}`);
  }

  await touchTrip(params.id);
  run.done('Stop added', { catalogued: catalog.catalogued });

  return NextResponse.json({ node, catalog }, { status: 201 });
}

// Reorder stops: body { order: nodeId[] } sets sort_order to each id's index.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { order } = (await request.json()) as { order?: string[] };
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'order[] is required' }, { status: 400 });
  }

  // Only reorder nodes that actually belong to this trip.
  const owned = await db
    .select({ id: tripNodes.id })
    .from(tripNodes)
    .where(eq(tripNodes.tripId, params.id));
  const ownedIds = new Set(owned.map((n) => n.id));

  await Promise.all(
    order
      .filter((id) => ownedIds.has(id))
      .map((id, index) =>
        db.update(tripNodes).set({ sortOrder: index }).where(eq(tripNodes.id, id)),
      ),
  );
  await touchTrip(params.id);

  return NextResponse.json({ ok: true });
}
