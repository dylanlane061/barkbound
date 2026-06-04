import { db } from './client';
import { places, rawRecords, signals, trips, tripNodes, tripPlaces } from './schema';
import type { CatKey } from '@/lib/design/cats';

// Dev seed. Builds a small but complete world so every screen has content:
// - places with categories + coordinates; some assessed (real PawSignal
//   evidence → a score), some left unassessed (assessed_at NULL) to exercise
//   Discover's "Request assessment / Check" flow.
// - trips with varied status/region/cover, ordered stops (trip_nodes), and
//   saved places (trip_places).
// Idempotent for local use: clears the tables it owns, then re-inserts.

type Sig = { category: string; value: unknown; confidence: number };

type PlaceSeed = {
  key: string;
  name: string;
  category: CatKey;
  city: string;
  state: string;
  lat: number;
  lon: number;
  address: string;
  // When present, the place is "assessed": we write a raw_record + these
  // signals so score() yields a real confidence. Absent → unassessed.
  evidence?: { source: string; raw: Record<string, unknown>; signals: Sig[] };
};

const PLACES: PlaceSeed[] = [
  {
    key: 'dsb',
    name: 'Dark Sky Brewing',
    category: 'brewery',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.1983,
    lon: -111.6513,
    address: '117 W Aspen Ave',
    evidence: {
      source: 'osm',
      raw: { tags: { dog: 'yes', amenity: 'pub', outdoor_seating: 'yes' } },
      signals: [
        { category: 'pets_allowed', value: true, confidence: 0.92 },
        { category: 'designated_area', value: 'patio', confidence: 0.85 },
        { category: 'water_access', value: true, confidence: 0.8 },
      ],
    },
  },
  {
    key: 'buffalo',
    name: 'Buffalo Park',
    category: 'park',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.2316,
    lon: -111.6206,
    address: '2400 N Gemini Rd',
    evidence: {
      source: 'osm',
      raw: { tags: { dog: 'leashed', leisure: 'park' } },
      signals: [
        { category: 'pets_allowed', value: true, confidence: 0.9 },
        { category: 'leash_required', value: true, confidence: 0.85 },
        { category: 'trail_access', value: true, confidence: 0.8 },
      ],
    },
  },
  {
    key: 'fatmans',
    name: 'Fatmans Loop Trail',
    category: 'trail',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.2606,
    lon: -111.6019,
    address: 'Mount Elden Trailhead',
    evidence: {
      source: 'osm',
      raw: { tags: { dog: 'leashed', highway: 'path' } },
      signals: [
        { category: 'pets_allowed', value: true, confidence: 0.85 },
        { category: 'leash_required', value: true, confidence: 0.8 },
      ],
    },
  },
  {
    key: 'aspen',
    name: 'Aspen Corner Campground',
    category: 'campground',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.3286,
    lon: -111.7102,
    address: 'Snowbowl Rd',
    evidence: {
      source: 'osm',
      raw: { tags: { dog: 'leashed', tourism: 'camp_site' } },
      signals: [
        { category: 'pets_allowed', value: true, confidence: 0.72 },
        { category: 'leash_required', value: true, confidence: 0.7 },
      ],
    },
  },
  {
    key: 'tourist',
    name: 'Tourist Home Café',
    category: 'cafe',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.1979,
    lon: -111.6533,
    address: '52 S San Francisco St',
    evidence: {
      source: 'osm',
      raw: { tags: { dog: 'outside', amenity: 'cafe' } },
      signals: [{ category: 'pets_allowed', value: 'patio_only', confidence: 0.55 }],
    },
  },
  {
    key: 'little',
    name: 'Little America Hotel',
    category: 'hotel',
    city: 'Flagstaff',
    state: 'AZ',
    lat: 35.1797,
    lon: -111.6,
    address: '2515 E Butler Ave',
    evidence: {
      source: 'osm',
      raw: { tags: { 'fee:dog': 'yes', tourism: 'hotel' } },
      signals: [{ category: 'pet_fee', value: true, confidence: 0.5 }],
    },
  },
  // Unassessed — exercise Discover's "Check" / Place Detail "Request assessment".
  {
    key: 'oak',
    name: 'Oak Creek Brewery',
    category: 'brewery',
    city: 'Sedona',
    state: 'AZ',
    lat: 34.8642,
    lon: -111.7983,
    address: '2050 Yavapai Dr',
  },
  {
    key: 'bell',
    name: 'Bell Rock Pathway',
    category: 'trail',
    city: 'Sedona',
    state: 'AZ',
    lat: 34.8,
    lon: -111.7665,
    address: 'AZ-179',
  },
  {
    key: 'dog-sedona',
    name: 'Sedona Dog Park',
    category: 'dogpark',
    city: 'Sedona',
    state: 'AZ',
    lat: 34.8697,
    lon: -111.7891,
    address: '525 Posse Ground Rd',
  },
  {
    key: 'whole',
    name: "Wholesum Cafe",
    category: 'cafe',
    city: 'Sedona',
    state: 'AZ',
    lat: 34.8689,
    lon: -111.7607,
    address: '1370 W State Route 89A',
  },
];

type StopSeed = {
  label: string;
  state: string;
  lat: number;
  lon: number;
  nights: number;
  saved: string[]; // place keys
};

type TripSeed = {
  name: string;
  status: 'active' | 'planning' | 'past';
  region: string;
  coverTone: 'green' | 'sand' | 'cool' | 'rust' | 'alpine';
  updatedDaysAgo: number;
  stops: StopSeed[];
};

const TRIPS: TripSeed[] = [
  {
    name: 'Sedona Fall Road Trip',
    status: 'active',
    region: 'Northern Arizona',
    coverTone: 'sand',
    updatedDaysAgo: 2,
    stops: [
      { label: 'Flagstaff', state: 'AZ', lat: 35.1983, lon: -111.6513, nights: 2, saved: ['dsb', 'buffalo', 'aspen'] },
      { label: 'Sedona', state: 'AZ', lat: 34.8697, lon: -111.761, nights: 2, saved: ['oak', 'bell', 'dog-sedona'] },
      { label: 'Moab', state: 'UT', lat: 38.5733, lon: -109.5498, nights: 1, saved: ['fatmans'] },
    ],
  },
  {
    name: 'Colorado Mountains Weekend',
    status: 'planning',
    region: 'Front Range, Colorado',
    coverTone: 'green',
    updatedDaysAgo: 6,
    stops: [
      { label: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903, nights: 1, saved: [] },
      { label: 'Estes Park', state: 'CO', lat: 40.3772, lon: -105.5217, nights: 2, saved: [] },
    ],
  },
  {
    name: 'Pacific Northwest Adventure',
    status: 'planning',
    region: 'Central Oregon',
    coverTone: 'cool',
    updatedDaysAgo: 12,
    stops: [{ label: 'Bend', state: 'OR', lat: 44.0582, lon: -121.3153, nights: 3, saved: [] }],
  },
  {
    name: 'Moab Desert Loop',
    status: 'past',
    region: 'Southern Utah',
    coverTone: 'rust',
    updatedDaysAgo: 65,
    stops: [
      { label: 'Moab', state: 'UT', lat: 38.5733, lon: -109.5498, nights: 2, saved: ['fatmans', 'aspen'] },
      { label: 'Monticello', state: 'UT', lat: 37.8714, lon: -109.3429, nights: 1, saved: [] },
    ],
  },
];

async function run() {
  // Clear in FK-safe order.
  await db.delete(tripPlaces);
  await db.delete(tripNodes);
  await db.delete(signals);
  await db.delete(rawRecords);
  await db.delete(trips);
  await db.delete(places);

  // Places (+ evidence for the assessed ones).
  const idByKey = new Map<string, string>();
  for (const p of PLACES) {
    const assessed = Boolean(p.evidence);
    const [row] = await db
      .insert(places)
      .values({
        name: p.name,
        category: p.category,
        city: p.city,
        state: p.state,
        latitude: p.lat,
        longitude: p.lon,
        address: p.address,
        canonicalSource: 'google',
        externalId: `seed_${p.key}`,
        assessedAt: assessed ? new Date() : null,
      })
      .returning({ id: places.id });
    idByKey.set(p.key, row.id);

    if (p.evidence) {
      const [raw] = await db
        .insert(rawRecords)
        .values({
          placeId: row.id,
          source: p.evidence.source,
          sourceEntityId: `seed_${p.key}`,
          raw: p.evidence.raw,
          fetchedAt: new Date(),
        })
        .returning({ id: rawRecords.id });

      for (const s of p.evidence.signals) {
        await db.insert(signals).values({
          placeId: row.id,
          category: s.category,
          value: s.value as never,
          confidence: s.confidence,
          evidenceIds: [raw.id],
        });
      }
    }
  }

  // Trips → stops → saved places.
  for (const t of TRIPS) {
    const [trip] = await db
      .insert(trips)
      .values({
        name: t.name,
        status: t.status,
        region: t.region,
        coverTone: t.coverTone,
        updatedAt: new Date(Date.now() - t.updatedDaysAgo * 86_400_000),
      })
      .returning({ id: trips.id });

    for (let i = 0; i < t.stops.length; i++) {
      const stop = t.stops[i];
      const [node] = await db
        .insert(tripNodes)
        .values({
          tripId: trip.id,
          label: stop.label,
          latitude: stop.lat,
          longitude: stop.lon,
          radiusMiles: 25,
          sortOrder: i,
          nights: stop.nights,
          colorIndex: i % 5,
          ingestedAt: new Date(),
        })
        .returning({ id: tripNodes.id });

      // Saved places attach to the stop they were discovered under.
      for (const key of [...new Set(stop.saved)]) {
        const placeId = idByKey.get(key);
        if (placeId) {
          await db.insert(tripPlaces).values({ tripId: trip.id, nodeId: node.id, placeId });
        }
      }
    }
  }

  const placeCount = PLACES.length;
  const tripCount = TRIPS.length;
  console.log(`Seeded ${placeCount} places and ${tripCount} trips`);
  process.exit(0);
}

run();
