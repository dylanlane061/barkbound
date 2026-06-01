import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripPlaces } from '@/db/schema';

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
  const { placeId, notes } = (await request.json()) as {
    placeId: string;
    notes?: string;
  };
  const [tp] = await db
    .insert(tripPlaces)
    .values({ tripId: params.id, placeId, notes })
    .onConflictDoNothing()
    .returning();
  return NextResponse.json(tp, { status: 201 });
}
