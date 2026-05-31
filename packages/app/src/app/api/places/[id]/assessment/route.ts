import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { places, rawRecords, signals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { score } from '@barkbound/pawsignal';
import type { Signal, SourceId } from '@barkbound/pawsignal';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const [place] = await db.select().from(places).where(eq(places.id, params.id));
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [placeSignals, sources] = await Promise.all([
    db.select().from(signals).where(eq(signals.placeId, params.id)),
    db.selectDistinct({ source: rawRecords.source }).from(rawRecords).where(eq(rawRecords.placeId, params.id)),
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

  const assessment = score(params.id, typedSignals, sources.map((s) => s.source as SourceId));
  return NextResponse.json({ place, assessment });
}
