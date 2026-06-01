/**
 * OpenStreetMap (OSM) data source, fetched via the Overpass API.
 *
 * WHAT THIS IS
 * OSM is a crowd-sourced map of the world. Overpass is a read-only query service
 * over OSM data: you POST a query written in "Overpass QL" and it returns the
 * matching map elements as JSON. We use it to find dog-relevant places inside a
 * bounding box around a trip stop.
 *   - Overpass API overview:  https://wiki.openstreetmap.org/wiki/Overpass_API
 *   - Overpass QL language:   https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 *   - overpass-turbo (tester): https://overpass-turbo.eu  ← paste a query here to iterate visually
 *
 * HOW THE QUERY BELOW WORKS
 *   [out:json][timeout:25];          // settings: return JSON, give up after 25s
 *   (                                // a UNION — collect everything matching any line inside
 *     node["dog"](S,W,N,E);          //   every NODE carrying a `dog` tag, within the bbox
 *     way ["dog"](S,W,N,E);          //   every WAY  carrying a `dog` tag, within the bbox
 *     ...
 *   );
 *   out center;                      // emit results; for ways, collapse to a single center point
 *
 * OSM data primitives:
 *   - node     = a single point (e.g. a drinking fountain, a small dog-park marker)
 *   - way      = an ordered list of nodes (a trail, or a closed loop forming an area like a park)
 *   - relation = a group of nodes/ways (we don't query these yet)
 * `out center;` lets us treat ways as points by giving each one a representative lat/lon.
 *
 * Bounding-box filter order is (south, west, north, east) = (minLat, minLon, maxLat, maxLon).
 *
 * THE TAGS — AND HOW TO DISCOVER MORE
 * OSM has NO fixed schema. Tags are key=value pairs the community adopts by
 * convention, so the list we query below is a CURATED, EVOLVABLE set, not an
 * exhaustive one — and no single source (human or AI) holds the complete list.
 * To find what tags actually exist in the data, with real usage counts:
 *   - taginfo (ground truth):   https://taginfo.openstreetmap.org/search?q=dog
 *   - Map Features (curated):   https://wiki.openstreetmap.org/wiki/Map_features
 *   - `dog` key documentation:  https://wiki.openstreetmap.org/wiki/Key:dog
 * When adding a tag, prefer ones with meaningful usage on taginfo and note the
 * intent here so the next reader knows why it's included.
 *
 * Tags we currently query:
 *   dog=*                     explicit dog policy (yes / no / leashed / unleashed / outside)
 *   leisure=dog_park          a dedicated (usually off-leash) dog park
 *   pets=yes                  general "pets allowed" — broader than dogs, so lower confidence
 *   amenity=drinking_water    water sources, excluding any explicitly tagged dog=no
 */
import { registerExtractor, osmExtractor } from '@pawsignal';
import { registerAreaFetcher } from '../runner';
import type { BoundingBox } from '../geo';

registerExtractor('osm', osmExtractor);

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bbox order required by Overpass is (south, west, north, east); see file header.
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

registerAreaFetcher(async (bbox: BoundingBox, run) => {
  run.step('fetch', 'Querying Overpass API', { url: OVERPASS_URL, bbox });

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Public Overpass instances return 406 Not Acceptable without a User-Agent.
      'User-Agent': 'Barkbound/0.1 (dog-travel-research)',
    },
    body: `data=${encodeURIComponent(buildQuery(bbox))}`,
  });

  if (!res.ok) {
    // Include a snippet of the body — Overpass returns useful text for 429 (rate
    // limit), 504 (timeout), etc. so the logged error is actionable, not opaque.
    const body = await res.text().catch(() => '');
    throw new Error(
      `Overpass API returned ${res.status} ${res.statusText}` +
        (body ? ` — ${body.replace(/\s+/g, ' ').trim().slice(0, 200)}` : ''),
    );
  }

  const data = (await res.json()) as { elements: OverpassElement[] };
  run.step('fetch', `Overpass returned ${data.elements.length} elements`);

  const items = data.elements
    .filter((el) => el.tags && Object.keys(el.tags).length > 0)
    .flatMap((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat === undefined || lon === undefined) return [];

      const tags = el.tags!;
      const name =
        tags.name ??
        tags['name:en'] ??
        (tags.leisure === 'dog_park' ? 'Dog Park' : undefined) ??
        (tags.amenity === 'drinking_water' ? 'Drinking Water' : undefined) ??
        `OSM ${el.type} ${el.id}`;

      return [
        {
          sourceEntityId: `${el.type}/${el.id}`,
          name,
          latitude: lat,
          longitude: lon,
          raw: el as unknown as Record<string, unknown>,
        },
      ];
    });

  run.step('parse', `Mapped ${items.length} place candidates`, {
    dropped: data.elements.length - items.length,
  });

  return { source: 'osm' as const, items };
});
