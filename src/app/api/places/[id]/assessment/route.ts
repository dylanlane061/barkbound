import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { places, rawRecords, signals } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { score } from '@pawsignal';
import type { Signal, SourceId } from '@pawsignal';
import { startRun } from '@/lib/pipeline';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const run = startRun(`Assess place ${params.id} (api)`);
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
  run.step('score', `${Math.round(assessment.confidence * 100)}% confidence`, {
    base: assessment.breakdown.base,
    sourceBoost: assessment.breakdown.sourceBoost,
    signals: assessment.breakdown.signalCount,
    topCategories: assessment.breakdown.contributions
      .slice(0, 3)
      .map((c) => `${c.category} ${Math.round(c.contribution * 100)}%`),
    sources: sources.map((s) => s.source),
  });
  run.done(place.name);
  return NextResponse.json({ place, assessment });
}
