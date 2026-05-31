import { pgTable, uuid, text, real, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const places = pgTable('places', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rawRecords = pgTable('raw_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').references(() => places.id).notNull(),
  source: text('source').notNull(),
  sourceEntityId: text('source_entity_id').notNull(),
  raw: jsonb('raw').notNull(),
  fetchedAt: timestamp('fetched_at').notNull(),
});

export const signals = pgTable('signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: uuid('place_id').references(() => places.id).notNull(),
  category: text('category').notNull(),
  value: jsonb('value'),
  confidence: real('confidence').notNull(),
  evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull().default([]),
  extractedAt: timestamp('extracted_at').defaultNow().notNull(),
});
