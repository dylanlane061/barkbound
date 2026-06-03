/**
 * Google Places API (New) client — Barkbound's canonical place catalog / identity spine.
 *
 * Responsibilities (Phase 1.5a):
 *   - autocomplete()      typeahead for the search box (cities + places)
 *   - searchNearby()      places within a radius, filtered by type tags
 *   - getPlaceDetails()   hydrate one place_id (incl. the live `allowsDogs` attribute)
 *
 * Design constraints baked in here:
 *   - Places API (New) REQUIRES an `X-Goog-FieldMask` on Nearby/Details calls. We only
 *     request the fields we use — this is also how billing is controlled.
 *   - Autocomplete is billed per session; pass a `sessionToken` (generated client-side,
 *     reused across keystrokes, then once on the resulting details call).
 *   - We store the returned `place_id` durably and treat other fields as a refreshable
 *     cache — Google's terms don't allow persisting their place data as a dataset.
 *
 * Docs:
 *   - Overview:     https://developers.google.com/maps/documentation/places/web-service/op-overview
 *   - Nearby:       https://developers.google.com/maps/documentation/places/web-service/nearby-search
 *   - Autocomplete: https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 *   - Place types:  https://developers.google.com/maps/documentation/places/web-service/place-types
 */

const BASE_URL = 'https://places.googleapis.com/v1';
const METERS_PER_MILE = 1609.344;
const MAX_RADIUS_METERS = 50_000; // Google Nearby Search hard limit
const MAX_RESULTS = 20; // Google Nearby Search hard limit per call

// User-facing tags → Google place types live in '@/lib/place-tags' (client-safe).

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText?: string;
}

// A canonical place as returned by the catalog (Nearby Search).
export interface CanonicalPlace {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  types: string[];
}

// Place Details adds the live, read-time dog signal (not persisted as evidence).
export interface PlaceDetails extends CanonicalPlace {
  allowsDogs: boolean | null;
}

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set — add it to .env.local');
  }
  return key;
}

async function googleFetch<T>(
  path: string,
  init: { method: 'GET' | 'POST'; fieldMask: string; body?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    'X-Goog-Api-Key': apiKey(),
    'X-Goog-FieldMask': init.fieldMask,
  };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    // Google returns a JSON error body with a useful message; surface a snippet.
    const text = await res.text().catch(() => '');
    throw new Error(
      `Google Places ${path} returned ${res.status} ${res.statusText}` +
        (text ? ` — ${text.replace(/\s+/g, ' ').trim().slice(0, 300)}` : ''),
    );
  }

  return (await res.json()) as T;
}

// --- Raw response shapes (only the fields we request) ---------------------------------

interface RawLatLng {
  latitude: number;
  longitude: number;
}
interface RawPlace {
  id: string;
  displayName?: { text: string };
  location?: RawLatLng;
  formattedAddress?: string;
  types?: string[];
  allowsDogs?: boolean;
}

function toCanonical(p: RawPlace): CanonicalPlace {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? '(unnamed place)',
    latitude: p.location?.latitude ?? 0,
    longitude: p.location?.longitude ?? 0,
    address: p.formattedAddress,
    types: p.types ?? [],
  };
}

// --- Public API -----------------------------------------------------------------------

/**
 * Typeahead suggestions for the search box. Pass a stable `sessionToken` across the
 * keystrokes of one search to be billed per session rather than per request.
 * `includedPrimaryTypes` can narrow results (e.g. `['locality']` for cities only).
 */
export async function autocomplete(
  input: string,
  opts: {
    sessionToken?: string;
    includedPrimaryTypes?: string[];
    locationBias?: { latitude: number; longitude: number; radiusMiles: number };
  } = {},
): Promise<PlaceSuggestion[]> {
  if (!input.trim()) return [];

  const body: Record<string, unknown> = { input: input.trim() };
  if (opts.sessionToken) body.sessionToken = opts.sessionToken;
  if (opts.includedPrimaryTypes?.length) body.includedPrimaryTypes = opts.includedPrimaryTypes;
  if (opts.locationBias) {
    body.locationBias = {
      circle: {
        center: { latitude: opts.locationBias.latitude, longitude: opts.locationBias.longitude },
        radius: Math.min(opts.locationBias.radiusMiles * METERS_PER_MILE, MAX_RADIUS_METERS),
      },
    };
  }

  const data = await googleFetch<{
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
        text?: { text: string };
      };
    }>;
  }>('/places:autocomplete', {
    method: 'POST',
    // Autocomplete uses a request-scoped mask, not the `places.` prefix.
    fieldMask:
      'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    body,
  });

  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.placeId))
    .map((p) => ({
      placeId: p.placeId,
      primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondaryText: p.structuredFormat?.secondaryText?.text,
    }));
}

/** Places within `radiusMiles` of a point, filtered to `includedTypes`. */
export async function searchNearby(params: {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  includedTypes: string[];
  maxResultCount?: number;
}): Promise<CanonicalPlace[]> {
  const data = await googleFetch<{ places?: RawPlace[] }>('/places:searchNearby', {
    method: 'POST',
    fieldMask: 'places.id,places.displayName,places.location,places.formattedAddress,places.types',
    body: {
      includedTypes: params.includedTypes,
      maxResultCount: Math.min(params.maxResultCount ?? MAX_RESULTS, MAX_RESULTS),
      locationRestriction: {
        circle: {
          center: { latitude: params.latitude, longitude: params.longitude },
          radius: Math.min(params.radiusMiles * METERS_PER_MILE, MAX_RADIUS_METERS),
        },
      },
    },
  });

  return (data.places ?? []).map(toCanonical);
}

/** Hydrate a single place by id, including the live `allowsDogs` attribute. */
export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetails> {
  const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  const p = await googleFetch<RawPlace>(`/places/${encodeURIComponent(placeId)}${query}`, {
    method: 'GET',
    fieldMask: 'id,displayName,location,formattedAddress,types,allowsDogs',
  });

  return { ...toCanonical(p), allowsDogs: p.allowsDogs ?? null };
}
