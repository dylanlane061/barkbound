import { and, eq, inArray } from 'drizzle-orm';
import { osmExtractor } from '@pawsignal';
import type { RawRecord } from '@pawsignal';
import { db } from '@/db/client';
import { places, rawRecords, signals } from '@/db/schema';
import { haversineMiles, radiusToBbox, type BoundingBox } from '@/ingest/geo';
import { getPlaceDetails } from '@/ingest/google';
import { fetchWebsiteText } from '@/lib/content/website';
import { assessPlaces, type PlaceScore } from '@/lib/assess';

// On-demand per-place assessment (ROADMAP Phase 1.5c). Collects real OSM
// evidence near the place, conflates it, extracts signals via PawSignal, stores
// the evidence chain, marks the place assessed, and returns the recomputed
// score. Idempotent: re-running replaces this place's OSM evidence (a refresh).
//
// Honest by design — if no dog-relevant OSM features conflate to the place, it
// is still marked assessed and returns a low/zero score ("we looked and found
// little"), which is a different statement from "never assessed".

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Conflation radius: OSM features within ~190m (or a name match) are treated as
// describing this point-of-interest.
const CONFLATE_MILES = 0.12;

// Same dog-relevant tag set as the area fetcher (src/ingest/sources/osm.ts).
function buildQuery({ minLat: S, minLon: W, maxLat: N, maxLon: E }: BoundingBox): string {
  return `[out:json][timeout:25];
(
  node["dog"](${S},${W},${N},${E});
  way["dog"](${S},${W},${N},${E});
  node["leisure"="dog_park"](${S},${W},${N},${E});
  way["leisure"="dog_park"](${S},${W},${N},${E});
  node["pets"="yes"](${S},${W},${N},${E});
  way["pets"="yes"](${S},${W},${N},${E});
  node["amenity"="drinking_water"]["dog"!="no"](${S},${W},${N},${E});
);
out center;`;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function nameMatches(placeName: string, tagName?: string): boolean {
  if (!tagName) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const a = norm(placeName);
  const b = norm(tagName);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

export type AssessResult =
  | { ok: true; score: PlaceScore | null; evidenceFound: number }
  | { ok: false; error: string };

export async function runAssessment(placeId: string): Promise<AssessResult> {
  const [place] = await db.select().from(places).where(eq(places.id, placeId));
  if (!place) return { ok: false, error: 'Place not found' };

  // Replace any prior enrichment evidence for this place so re-runs don't
  // duplicate (OSM area features + the live Google attribute).
  await db.delete(signals).where(eq(signals.placeId, placeId));
  await db
    .delete(rawRecords)
    .where(
      and(eq(rawRecords.placeId, placeId), inArray(rawRecords.source, ['osm', 'google', 'website'])),
    );

  let evidenceFound = 0;

  if (place.latitude != null && place.longitude != null) {
    const bbox = radiusToBbox(place.latitude, place.longitude, 0.6);
    let elements: OverpassElement[] = [];
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Barkbound/0.1 (dog-travel-research)',
        },
        body: `data=${encodeURIComponent(buildQuery(bbox))}`,
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { elements?: OverpassElement[] };
        elements = data.elements ?? [];
      }
    } catch {
      // Network/timeout — treat as no evidence found (still mark assessed below).
    }

    const matches = elements.filter((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null || !el.tags) return false;
      const dist = haversineMiles(place.latitude!, place.longitude!, lat, lon);
      return dist <= CONFLATE_MILES || nameMatches(place.name, el.tags.name);
    });

    for (const el of matches) {
      const sourceEntityId = `${el.type}/${el.id}`;
      const [raw] = await db
        .insert(rawRecords)
        .values({
          placeId,
          source: 'osm',
          sourceEntityId,
          raw: el as unknown as Record<string, unknown>,
          fetchedAt: new Date(),
        })
        .returning({ id: rawRecords.id });

      const pawRecord: RawRecord = {
        id: raw.id,
        source: 'osm',
        sourceEntityId,
        fetchedAt: new Date(),
        raw: el as unknown as Record<string, unknown>,
      };

      const partials = osmExtractor(pawRecord);
      if (partials.length > 0) {
        await db.insert(signals).values(
          partials.map((p) => ({
            placeId,
            category: p.category,
            value: p.value,
            confidence: p.confidence,
            evidenceIds: [raw.id],
          })),
        );
        evidenceFound += partials.length;
      }
    }
  }

  // Google-backed sources: the live allowsDogs attribute, plus the place's
  // official website (mined for an authoritative pet policy). Both hang off the
  // canonical Google place_id stored in external_id. One Details call serves both.
  if (place.externalId && place.canonicalSource === 'google') {
    let details: Awaited<ReturnType<typeof getPlaceDetails>> | null = null;
    try {
      details = await getPlaceDetails(place.externalId);
    } catch {
      // Missing/invalid place_id or API error — skip the Google-backed sources.
    }

    // (a) Google allowsDogs attribute. score() is polarity-aware, so we persist
    // both the positive and negative cases (a confident "no dogs" lowers the
    // score). We store only the derived boolean, not Google's full payload.
    if (details && (details.allowsDogs === true || details.allowsDogs === false)) {
      const allowed = details.allowsDogs;
      const [raw] = await db
        .insert(rawRecords)
        .values({
          placeId,
          source: 'google',
          sourceEntityId: place.externalId,
          raw: { allowsDogs: allowed, note: 'Google Place attribute (derived, live read)' },
          fetchedAt: new Date(),
        })
        .returning({ id: rawRecords.id });
      await db.insert(signals).values({
        placeId,
        category: 'pets_allowed',
        value: allowed,
        confidence: 0.75,
        evidenceIds: [raw.id],
      });
      evidenceFound += 1;
    }

    // (b) Official website: the most authoritative statement of a place's pet
    // policy (weighted highest in score()). We fetch + clean in src/, then let
    // PawSignal's pure matcher extract claims — each stored with its verbatim
    // quote so the evidence chain stays traceable. No claims ⇒ no signal.
    if (details?.websiteUri) {
      try {
        const digest = await fetchWebsiteText(details.websiteUri);
        if (digest && digest.claims.length > 0) {
          const [raw] = await db
            .insert(rawRecords)
            .values({
              placeId,
              source: 'website',
              sourceEntityId: digest.url,
              raw: {
                url: digest.url,
                pagesFetched: digest.pagesFetched,
                claims: digest.claims,
                note: 'Pet-policy claims mined from the official website',
              },
              fetchedAt: new Date(),
            })
            .returning({ id: rawRecords.id });
          await db.insert(signals).values(
            digest.claims.map((c) => ({
              placeId,
              category: c.category,
              value: c.value,
              confidence: c.confidence,
              evidenceIds: [raw.id],
            })),
          );
          evidenceFound += digest.claims.length;
        }
      } catch {
        // Network/parse failure — skip the website signal, keep the assessment.
      }
    }
  }

  await db
    .update(places)
    .set({ assessedAt: new Date(), lastIngestedAt: new Date() })
    .where(eq(places.id, placeId));

  const scores = await assessPlaces([placeId]);
  return { ok: true, score: scores.get(placeId) ?? null, evidenceFound };
}
