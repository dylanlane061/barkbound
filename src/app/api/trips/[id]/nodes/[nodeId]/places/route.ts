import { NextResponse } from 'next/server';
import { and, eq, gte, isNotNull, lte } from 'drizzle-orm';
import { db } from '@/db/client';
import { places, tripNodes } from '@/db/schema';
import { radiusToBbox } from '@/ingest/geo';

export async function GET(
  _request: Request,
  { params }: { params: { id: string; nodeId: string } },
) {
  const [node] = await db
    .select()
    .from(tripNodes)
    .where(eq(tripNodes.id, params.nodeId))
    .limit(1);

  if (!node) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const bbox = radiusToBbox(node.latitude, node.longitude, node.radiusMiles);

  const nodePlaces = await db
    .select()
    .from(places)
    .where(
      and(
        isNotNull(places.latitude),
        isNotNull(places.longitude),
        gte(places.latitude, bbox.minLat),
        lte(places.latitude, bbox.maxLat),
        gte(places.longitude, bbox.minLon),
        lte(places.longitude, bbox.maxLon),
      ),
    )
    .limit(50);

  return NextResponse.json(nodePlaces);
}
