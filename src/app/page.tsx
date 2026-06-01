import Link from 'next/link';
import { db } from '@/db/client';
import { places } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';
import SearchForm from '@/components/SearchForm';
import PlaceCard from '@/components/PlaceCard';

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const results = q
    ? await db
        .select()
        .from(places)
        .where(or(ilike(places.name, `%${q}%`), ilike(places.city, `%${q}%`)))
        .limit(20)
    : [];

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <header className="mb-10">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-tight">Barkbound</h1>
            <Link href="/trips" className="text-sm text-stone-500 hover:text-stone-700">
              My trips
            </Link>
          </div>
          <p className="mt-2 text-stone-500">Build better adventures with your dogs.</p>
        </header>

        <SearchForm defaultValue={q} />

        {q && results.length === 0 && (
          <p className="mt-8 text-stone-400">No places found for &ldquo;{q}&rdquo;.</p>
        )}

        {results.length > 0 && (
          <ul className="mt-6 space-y-3">
            {results.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </ul>
        )}

        {!q && (
          <p className="mt-8 text-stone-400">Search for a destination to get started.</p>
        )}
      </div>
    </main>
  );
}
