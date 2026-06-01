import type { RawRecord, Signal, SignalCategory } from '../types';

type SignalPartial = Omit<Signal, 'id' | 'placeId' | 'extractedAt' | 'evidenceIds'>;

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

// Confidence rationale:
//   0.90 — element type unambiguously implies the signal (e.g. leisure=dog_park)
//   0.85 — explicit, specific tag (e.g. dog=leashed)
//   0.70 — generic tag that applies to all pets, not just dogs (e.g. pets=yes)
//   0.60 — inferred from context; the tag is consistent but not definitive

export function osmExtractor(record: RawRecord): SignalPartial[] {
  const element = record.raw as unknown as OverpassElement;
  const tags = element.tags ?? {};
  const results: SignalPartial[] = [];

  function push(category: SignalCategory, value: Signal['value'], confidence: number) {
    results.push({ category, value, confidence });
  }

  // dog= — the most explicit OSM dog-policy tag
  const dog = tags.dog;
  if (dog === 'yes') {
    push('pets_allowed', true, 0.85);
  } else if (dog === 'no') {
    push('pets_allowed', false, 0.85);
  } else if (dog === 'leashed' || dog === 'leashed_only') {
    push('pets_allowed', true, 0.85);
    push('leash_required', true, 0.85);
  } else if (dog === 'unleashed') {
    push('pets_allowed', true, 0.85);
    push('leash_required', false, 0.85);
  }

  // pets= — less dog-specific, lower confidence; only used when dog= is absent
  if (!dog) {
    if (tags.pets === 'yes') push('pets_allowed', true, 0.70);
    else if (tags.pets === 'no') push('pets_allowed', false, 0.70);
  }

  // leisure=dog_park — element type alone is strong evidence
  if (tags.leisure === 'dog_park') {
    if (!dog && !tags.pets) push('pets_allowed', true, 0.90);
    push('designated_area', 'dog park', 0.90);
    // Dog parks are typically off-leash, but not universally — inferred, not stated
    if (!dog) push('leash_required', false, 0.60);
  }

  // amenity=drinking_water — directly signals water access
  if (tags.amenity === 'drinking_water') {
    push('water_access', true, 0.85);
  }

  // Pet fee tags
  const feeValue = tags['fee:dog'] ?? tags['dog:fee'] ?? tags['pet:fee'];
  if (feeValue) push('pet_fee', feeValue, 0.80);

  return results;
}
