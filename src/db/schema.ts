import { sql } from 'drizzle-orm';
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const places = sqliteTable('places', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  // Canonical identity from the resolution backbone (Phase 1.5). `externalId` is the
  // Google place_id; it is the durable key we dedupe on and re-fetch by.
  canonicalSource: text('canonical_source'),
  externalId: text('external_id').unique(),
  // When evidence was last collected for this place (the on-demand assessment).
  // NULL = never assessed (distinct from "assessed, found little"). Drives the
  // 30-day refresh prompt.
  assessedAt: integer('assessed_at', { mode: 'timestamp' }),
  lastIngestedAt: integer('last_ingested_at', { mode: 'timestamp' }),
  // Display category (one of the design's CATS keys), derived from Google
  // place `types` at catalog time. Drives the per-place glyph + Discover filters.
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const rawRecords = sqliteTable('raw_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  placeId: text('place_id')
    .references(() => places.id)
    .notNull(),
  source: text('source').notNull(),
  sourceEntityId: text('source_entity_id').notNull(),
  // SQLite has no native JSON type; Drizzle's { mode: 'json' } stores as TEXT
  // and auto-serialises/deserialises on read/write.
  raw: text('raw', { mode: 'json' }).notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
});

export const signals = sqliteTable('signals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  placeId: text('place_id')
    .references(() => places.id)
    .notNull(),
  category: text('category').notNull(),
  value: text('value', { mode: 'json' }),
  confidence: real('confidence').notNull(),
  evidenceIds: text('evidence_ids', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  extractedAt: integer('extracted_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  // Lifecycle state shown as the status pill (orange/slate/muted) and the
  // segmented gallery filter. Defaults to 'planning' on create.
  status: text('status', { enum: ['active', 'planning', 'past'] })
    .notNull()
    .default('planning'),
  // Free-text region label ("Northern Arizona") shown on cards/spotlight.
  region: text('region'),
  // Cover-photo palette chosen at create time; one of the Photo tones.
  coverTone: text('cover_tone', { enum: ['green', 'sand', 'cool', 'rust', 'alpine'] })
    .notNull()
    .default('green'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  // Constant DDL default (epoch 0) so SQLite can add the column NOT NULL to
  // existing rows; the app always supplies a real value on insert ($defaultFn)
  // and bumps it on edits to reflect "last updated".
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`0`)
    .$defaultFn(() => new Date()),
});

export const tripNodes = sqliteTable('trip_nodes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tripId: text('trip_id')
    .references(() => trips.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radiusMiles: real('radius_miles').notNull().default(25),
  // Itinerary ordering + per-stop trip facts shown in Trip Detail. `sortOrder`
  // drives the timeline order (and reorder up/down); `colorIndex` selects the
  // teardrop-pin color from a rotating palette.
  sortOrder: integer('sort_order').notNull().default(0),
  nights: integer('nights').notNull().default(1),
  notes: text('notes'),
  colorIndex: integer('color_index').notNull().default(0),
  ingestedAt: integer('ingested_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const tripPlaces = sqliteTable('trip_places', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tripId: text('trip_id')
    .references(() => trips.id, { onDelete: 'cascade' })
    .notNull(),
  placeId: text('place_id')
    .references(() => places.id)
    .notNull(),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  notes: text('notes'),
});
