import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { places } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  const results = q
    ? await db
        .select()
        .from(places)
        .where(or(ilike(places.name, `%${q}%`), ilike(places.city, `%${q}%`)))
        .limit(20)
    : await db.select().from(places).limit(20);

  return NextResponse.json(results);
}
