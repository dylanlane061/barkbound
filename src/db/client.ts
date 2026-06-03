import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Local SQLite database. File is created automatically on first run.
// No connection pooling needed — SQLite is in-process and synchronous.
const sqlite = new Database('./local.db');

// SQLite disables foreign key enforcement by default; turn it on.
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
