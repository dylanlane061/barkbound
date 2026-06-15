import { NextResponse } from 'next/server';
import { runAssessment } from '@/lib/assess-place';

// On-demand assessment for one place. Collects OSM evidence, extracts signals,
// stores the evidence chain, and returns the recomputed PawSignal score. Runs
// synchronously — assessing a single place is small enough for a request
// handler (no worker/queue), per the Phase 1.5 design.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const result = await runAssessment(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({
    score: result.score?.score ?? 0,
    tier: result.score?.tier ?? 'lo',
    reason: result.score?.reason ?? 'We looked across our sources and found little.',
    sources: result.score?.sources ?? [],
    evidenceFound: result.evidenceFound,
  });
}
