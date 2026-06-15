import { NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db/client';
import { trips } from '@/db/schema';

// Delete a trip. trip_nodes and trip_places cascade away via their FKs.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const [deleted] = await db.delete(trips).where(eq(trips.id, params.id)).returning({ id: trips.id });
  if (!deleted) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Update a trip's status / name. Setting status to 'active' demotes any other
// active trip to 'planning' so there is at most one active trip.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = (await request.json()) as {
    status?: 'active' | 'planning' | 'past';
    name?: string;
  };

  const patch: { status?: 'active' | 'planning' | 'past'; name?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (body.status) patch.status = body.status;
  if (body.name?.trim()) patch.name = body.name.trim();

  if (body.status === 'active') {
    // Demote the current active trip(s) first.
    await db
      .update(trips)
      .set({ status: 'planning' })
      .where(and(eq(trips.status, 'active'), ne(trips.id, params.id)));
  }

  const [updated] = await db.update(trips).set(patch).where(eq(trips.id, params.id)).returning();
  if (!updated) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  return NextResponse.json(updated);
}
