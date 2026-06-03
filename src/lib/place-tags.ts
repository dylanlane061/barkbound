/**
 * User-facing place tags → Google place types. Client-safe (pure data + a pure
 * mapping fn), so both the search UI and the server can import it without pulling
 * in the Google HTTP client.
 *
 * Google's type vocabulary is commercial-POI-heavy (great for these). Trails and
 * dog parks are weak in Google and better served by OSM enrichment — see the
 * Phase 1.5 "Known gap" in docs/ROADMAP.md.
 * Reference: https://developers.google.com/maps/documentation/places/web-service/place-types
 */

export const PLACE_TAGS = {
  restaurants: ['restaurant'],
  cafes: ['cafe', 'coffee_shop'],
  breweries: ['bar', 'pub'],
  hotels: ['lodging'],
  parks: ['park'],
  campgrounds: ['campground', 'rv_park'],
  attractions: ['tourist_attraction'],
} as const;

export type PlaceTag = keyof typeof PLACE_TAGS;

export const PLACE_TAG_LABELS: Record<PlaceTag, string> = {
  restaurants: 'Restaurants',
  cafes: 'Cafés',
  breweries: 'Bars & breweries',
  hotels: 'Hotels',
  parks: 'Parks',
  campgrounds: 'Campgrounds',
  attractions: 'Attractions',
};

// Used when the user hasn't picked any tags.
export const DEFAULT_INCLUDED_TYPES: string[] = [
  'restaurant',
  'cafe',
  'lodging',
  'park',
  'campground',
  'tourist_attraction',
];

/** Map user-facing tags to a de-duplicated list of Google `includedTypes`. */
export function tagsToIncludedTypes(tags: PlaceTag[]): string[] {
  if (tags.length === 0) return DEFAULT_INCLUDED_TYPES;
  return [...new Set(tags.flatMap((t) => PLACE_TAGS[t] ?? []))];
}
