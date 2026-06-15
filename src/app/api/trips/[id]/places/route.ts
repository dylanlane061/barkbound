import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripPlaces, trips } from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const saved = await db
    .select()
    .from(tripPlaces)
    .where(eq(tripPlaces.tripId, params.id));
  return NextResponse.json(saved);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { placeId, nodeId, notes } = (await request.json()) as {
    placeId: string;
    nodeId?: string;
    notes?: string;
  };
  const [tp] = await db
    .insert(tripPlaces)
    .values({ tripId: params.id, placeId, nodeId: nodeId ?? null, notes })
    .onConflictDoNothing()
    .returning();
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, params.id));
  return NextResponse.json(tp, { status: 201 });
}

// Remove a saved place from a stop (or the trip). Matches on trip + place, and
// node when provided so the same place can stay saved under another stop.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { placeId, nodeId } = (await request.json()) as { placeId: string; nodeId?: string };
  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  }
  await db
    .delete(tripPlaces)
    .where(
      and(
        eq(tripPlaces.tripId, params.id),
        eq(tripPlaces.placeId, placeId),
        ...(nodeId ? [eq(tripPlaces.nodeId, nodeId)] : []),
      ),
    );
  await db.update(trips).set({ updatedAt: new Date() }).where(eq(trips.id, params.id));
  return NextResponse.json({ ok: true });
}
