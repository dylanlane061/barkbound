import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { trips } from '@/db/schema';

export async function GET() {
  const all = await db.select().from(trips).orderBy(desc(trips.createdAt));
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const { name } = (await request.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const [trip] = await db.insert(trips).values({ name: name.trim() }).returning();
  return NextResponse.json(trip, { status: 201 });
}
