import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { trips } from '@/db/schema';

export async function GET() {
  const all = await db.select().from(trips).orderBy(desc(trips.createdAt));
  return NextResponse.json(all);
}

const TONES = ['green', 'sand', 'cool', 'rust', 'alpine'] as const;
type Tone = (typeof TONES)[number];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    region?: string;
    coverTone?: string;
  };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const coverTone: Tone = TONES.includes(body.coverTone as Tone)
    ? (body.coverTone as Tone)
    : 'green';

  // New trips start in "planning"; status promotes to "active" once the user is
  // mid-trip and to "past" afterwards (out of scope here).
  const [trip] = await db
    .insert(trips)
    .values({
      name,
      region: body.region?.trim() || null,
      coverTone,
      status: 'planning',
      updatedAt: new Date(),
    })
    .returning();
  return NextResponse.json(trip, { status: 201 });
}
