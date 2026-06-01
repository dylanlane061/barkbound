import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection pool size.
//   - On Vercel's serverless runtime each instance is short-lived, so we keep it
//     small to avoid exhausting connections across many concurrent lambdas.
//   - Locally (and anywhere non-serverless) a larger pool lets parallel queries
//     (Promise.all) actually run concurrently instead of serializing over one
//     connection — the main cause of stacked round-trips to a remote DB.
// Override explicitly with DB_POOL_MAX if needed.
const poolMax = process.env.DB_POOL_MAX
  ? Number(process.env.DB_POOL_MAX)
  : process.env.VERCEL
    ? 1
    : 10;

const client = postgres(process.env.DATABASE_URL!, { max: poolMax });
export const db = drizzle(client, { schema });
