import { registerExtractor, osmExtractor } from '@barkbound/pawsignal';
import { registerAreaFetcher } from '../runner';
import type { BoundingBox } from '../geo';

registerExtractor('osm', osmExtractor);

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Overpass bbox order is south,west,north,east
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

registerAreaFetcher(async (bbox: BoundingBox) => {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(buildQuery(bbox))}`,
  });

  if (!res.ok) throw new Error(`Overpass API returned ${res.status}`);

  const data = (await res.json()) as { elements: OverpassElement[] };

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
          raw: el as Record<string, unknown>,
        },
      ];
    });

  return { source: 'osm' as const, items };
});
