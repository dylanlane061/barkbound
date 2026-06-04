import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes, trips } from '@/db/schema';

// Remove a stop. trip_places rows for this node cascade away via the
// node_id FK. Blocked when it's the trip's only stop.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; nodeId: string } },
) {
  const nodes = await db
    .select({ id: tripNodes.id })
    .from(tripNodes)
    .where(eq(tripNodes.tripId, params.id));

  if (nodes.length <= 1) {
    return NextResponse.json({ error: 'A trip needs at least one stop' }, { status: 409 });
  }

  await db
    .delete(tripNodes)
    .where(and(eq(tripNodes.id, params.nodeId), eq(tripNodes.tripId, params.id)));
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, params.id));

  return NextResponse.json({ ok: true });
}

// Edit a stop's facts (nights / notes).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; nodeId: string } },
) {
  const body = (await request.json()) as { nights?: number; notes?: string };
  const patch: { nights?: number; notes?: string | null } = {};
  if (typeof body.nights === 'number') patch.nights = Math.max(0, Math.round(body.nights));
  if (body.notes !== undefined) patch.notes = body.notes.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  await db
    .update(tripNodes)
    .set(patch)
    .where(and(eq(tripNodes.id, params.nodeId), eq(tripNodes.tripId, params.id)));
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, params.id));

  return NextResponse.json({ ok: true });
}
