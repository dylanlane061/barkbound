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

// Google place `types` → our category. First match wins; order matters
// (more specific types before generic ones). Falls back to 'park'.
const TYPE_TO_CAT: [string, CatKey][] = [
  ['dog_park', 'dogpark'],
  ['campground', 'campground'],
  ['rv_park', 'campground'],
  ['lodging', 'hotel'],
  ['hotel', 'hotel'],
  ['bar', 'brewery'],
  ['pub', 'brewery'],
  ['cafe', 'cafe'],
  ['coffee_shop', 'cafe'],
  ['restaurant', 'restaurant'],
  ['hiking_area', 'trail'],
  ['national_park', 'trail'],
  ['park', 'park'],
  ['tourist_attraction', 'park'],
];

export function categoryFromTypes(types: string[] | null | undefined): CatKey {
  if (types) {
    for (const [type, cat] of TYPE_TO_CAT) {
      if (types.includes(type)) return cat;
    }
  }
  return 'park';
}
