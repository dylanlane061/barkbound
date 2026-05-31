import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { score } from '@barkbound/pawsignal';
import type { Signal, SourceId } from '@barkbound/pawsignal';
import { db } from '@/db/client';
import { places, rawRecords, signals } from '@/db/schema';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import SignalList from '@/components/SignalList';

export default async function PlacePage({ params }: { params: { id: string } }) {
  const [place] = await db.select().from(places).where(eq(places.id, params.id));
  if (!place) notFound();

  const [placeSignals, placeRawRecords, sources] = await Promise.all([
    db.select().from(signals).where(eq(signals.placeId, params.id)),
    db.select().from(rawRecords).where(eq(rawRecords.placeId, params.id)),
    db
      .selectDistinct({ source: rawRecords.source })
      .from(rawRecords)
      .where(eq(rawRecords.placeId, params.id)),
  ]);

  const typedSignals: Signal[] = placeSignals.map((s) => ({
    id: s.id,
    placeId: s.placeId,
    category: s.category as Signal['category'],
    value: s.value as Signal['value'],
    confidence: s.confidence,
    evidenceIds: s.evidenceIds,
    extractedAt: s.extractedAt,
  }));

  const assessment = score(place.id, typedSignals, sources.map((s) => s.source as SourceId));

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-stone-700 mb-8 inline-block"
        >
          ← Back to search
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{place.name}</h1>
            {(place.city || place.state) && (
              <p className="text-stone-500 mt-1">
                {[place.city, place.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <ConfidenceBadge confidence={assessment.confidence} />
        </div>

        <SignalList signals={assessment.signals} rawRecords={placeRawRecords} />

        {sources.length > 0 && (
          <p className="mt-8 text-xs text-stone-400">
            Sources consulted: {sources.map((s) => s.source).join(', ')}
          </p>
        )}
      </div>
    </main>
  );
}
