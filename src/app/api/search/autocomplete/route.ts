import { NextResponse } from 'next/server';
import { autocomplete } from '@/ingest/google';

// Typeahead for the Discover search box. Backed by Google Place Autocomplete
// (session-tokened, per the Places API New billing model). Best-effort: returns
// an empty list on any error so the UI falls back to its static suggestions.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const token = searchParams.get('token') ?? undefined;
  if (!q) return NextResponse.json([]);

  try {
    const suggestions = await autocomplete(q, {
      sessionToken: token,
      // Bias toward localities/regions/places a traveler would search.
      includedPrimaryTypes: ['locality', 'administrative_area_level_3', 'tourist_attraction'],
    });
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
