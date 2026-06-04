import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { tripNodes, trips } from '@/db/schema';
import type { TripStatus } from '@/lib/trip-summary';

export type SaveTargetTrip = {
  tripId: string;
  tripName: string;
  status: TripStatus;
  stops: { id: string; label: string }[];
};

// The "current" trip used as the default save target: the active trip if one is
// set, otherwise the most recently updated trip. Returns null when there are no
// trips at all.
export async function resolveCurrentTrip(): Promise<{ id: string; name: string } | null> {
  const [active] = await db
    .select()
    .from(trips)
    .where(eq(trips.status, 'active'))
    .orderBy(desc(trips.updatedAt))
    .limit(1);
  if (active) return { id: active.id, name: active.name };

  const [recent] = await db.select().from(trips).orderBy(desc(trips.updatedAt)).limit(1);
  return recent ? { id: recent.id, name: recent.name } : null;
}

// All trips with their ordered stops — feeds the "Save to… (trip ▸ stop)"
// picker. Active/most-recent first.
export async function getSaveTargets(): Promise<SaveTargetTrip[]> {
  const tripRows = await db.select().from(trips).orderBy(desc(trips.updatedAt));
  if (tripRows.length === 0) return [];

  const nodes = await db
    .select({ id: tripNodes.id, tripId: tripNodes.tripId, label: tripNodes.label, sortOrder: tripNodes.sortOrder })
    .from(tripNodes)
    .where(inArray(tripNodes.tripId, tripRows.map((t) => t.id)))
    .orderBy(tripNodes.sortOrder);

  const byTrip = new Map<string, { id: string; label: string }[]>();
  for (const n of nodes) {
    const list = byTrip.get(n.tripId) ?? [];
    list.push({ id: n.id, label: n.label ?? 'Stop' });
    byTrip.set(n.tripId, list);
  }

  // Active trip first, then by recency (already the query order).
  const ordered = [...tripRows].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return 0;
  });

  return ordered.map((t) => ({
    tripId: t.id,
    tripName: t.name,
    status: t.status as TripStatus,
    stops: byTrip.get(t.id) ?? [],
  }));
}
