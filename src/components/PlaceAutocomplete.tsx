'use client';

import { useRef } from 'react';
import { APILoader, PlacePicker } from '@googlemaps/extended-component-library/react';

export interface SelectedPlace {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Google's place-picker web component. Loaded client-only (see NodeForm's dynamic
// import) because the underlying custom elements register against `window` on import.
// It manages its own autocomplete session tokens and returns a full Place on select.
export default function PlaceAutocomplete({
  apiKey,
  onSelect,
}: {
  apiKey: string;
  onSelect: (place: SelectedPlace | null) => void;
}) {
  // The Place shape comes from the Maps JS library at runtime; keep it loose.
  const pickerRef = useRef<{ value?: PickedPlace } | null>(null);

  return (
    <>
      <APILoader apiKey={apiKey} solutionChannel="GMP_barkbound_placepicker" />
      <PlacePicker
        ref={pickerRef as never}
        placeholder="City or area..."
        className="w-full"
        onPlaceChange={() => {
          const place = pickerRef.current?.value;
          const loc = place?.location;
          if (!place?.id || !loc) {
            onSelect(null);
            return;
          }
          onSelect({
            placeId: place.id,
            name: place.displayName ?? place.formattedAddress ?? '',
            latitude: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
            longitude: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
          });
        }}
      />
    </>
  );
}

// Minimal shape of the google.maps.places.Place we read off the picker.
interface PickedPlace {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: {
    lat: number | (() => number);
    lng: number | (() => number);
  };
}
