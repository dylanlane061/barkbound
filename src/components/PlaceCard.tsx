import Link from 'next/link';

type Place = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
};

export default function PlaceCard({ place }: { place: Place }) {
  return (
    <li>
      <Link
        href={`/places/${place.id}`}
        className="block rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-stone-400 transition-colors"
      >
        <p className="font-semibold">{place.name}</p>
        {(place.city || place.state) && (
          <p className="text-sm text-stone-500 mt-0.5">
            {[place.city, place.state].filter(Boolean).join(', ')}
          </p>
        )}
      </Link>
    </li>
  );
}
