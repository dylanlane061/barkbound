import type { IconName } from '@/components/kit/Icon';

// Place categories drive the Discover filter chips and the per-place glyph.
// Keys match the design handoff's `CATS`. `category` is persisted on places
// (derived from Google place `types` at catalog time — see categoryFromTypes).
export type CatKey =
  | 'park'
  | 'dogpark'
  | 'trail'
  | 'restaurant'
  | 'brewery'
  | 'cafe'
  | 'hotel'
  | 'campground';

export const CATS: Record<CatKey, { icon: IconName; label: string }> = {
  brewery: { icon: 'beer', label: 'Brewery' },
  trail: { icon: 'trail', label: 'Trail' },
  park: { icon: 'park', label: 'Park' },
  restaurant: { icon: 'food', label: 'Restaurant' },
  cafe: { icon: 'food', label: 'Café' },
  hotel: { icon: 'hotel', label: 'Hotel' },
  campground: { icon: 'camp', label: 'Campground' },
  dogpark: { icon: 'dog', label: 'Dog Park' },
};

// Discover filter toggles, in display order. [catKey, label].
export const FILTERS: [CatKey, string][] = [
  ['trail', 'Trails'],
  ['restaurant', 'Restaurants'],
  ['brewery', 'Breweries'],
  ['hotel', 'Hotels'],
  ['park', 'Parks'],
  ['campground', 'Campgrounds'],
  ['dogpark', 'Dog Parks'],
];

// Classify a single Google type string into our category. Pattern-based,
// because Google's primaryType is often a specific subtype
// (hamburger_restaurant, steak_house, american_restaurant, ski_resort…) that an
// exact-match table would miss. Order matters: more specific / disambiguating
// rules first. Returns null when nothing matches.
function classifyType(type: string): CatKey | null {
  const t = type.toLowerCase();
  if (t.includes('dog_park')) return 'dogpark';
  if (t.includes('rv_park') || t.includes('camp')) return 'campground'; // campground, rv_park, camping
  if (
    t.includes('hiking') ||
    t.includes('trail') ||
    t.includes('national_park') ||
    t.includes('state_park') ||
    t.includes('nature') ||
    t.includes('wilderness')
  )
    return 'trail';
  // Food before drink so "american_restaurant" (which may also carry a bar tag)
  // doesn't fall into brewery.
  if (
    t === 'restaurant' ||
    t.endsWith('_restaurant') ||
    t.includes('restaurant') ||
    ['steak_house', 'bakery', 'diner', 'meal_takeaway', 'meal_delivery', 'food_court', 'sandwich_shop', 'deli'].includes(t)
  )
    return 'restaurant';
  if (t.includes('coffee') || t.includes('cafe') || t === 'tea_house') return 'cafe';
  if (t.includes('bar') || t.includes('pub') || t.includes('brew') || t.includes('wine') || t.includes('taproom'))
    return 'brewery';
  if (
    t.includes('lodging') ||
    t.includes('hotel') ||
    t.includes('motel') ||
    t.includes('resort') ||
    t.includes('inn') ||
    t.includes('hostel') ||
    t.includes('guest_house') ||
    t.includes('bed_and_breakfast') ||
    t.includes('cottage')
  )
    return 'hotel';
  if (t.includes('park') || t.includes('tourist_attraction') || t.includes('garden') || t.includes('plaza'))
    return 'park';
  return null;
}

// Prefer Google's single `primaryType` (a place's main type) — it disambiguates
// e.g. a restaurant that also tags `bar`. Falls back to scanning `types`, then
// to 'park'.
export function categoryFromTypes(
  types: string[] | null | undefined,
  primaryType?: string | null,
): CatKey {
  if (primaryType) {
    const c = classifyType(primaryType);
    if (c) return c;
  }
  if (types) {
    for (const type of types) {
      const c = classifyType(type);
      if (c) return c;
    }
  }
  return 'park';
}
