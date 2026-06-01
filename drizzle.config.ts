import { existsSync } from 'node:fs';
import type { Config } from 'drizzle-kit';

// drizzle-kit doesn't load .env.local (that's a Next.js convention), so load it
// explicitly for local dev. In CI / Vercel the file doesn't exist and env vars
// come from the platform, so only load it when present (loadEnvFile throws otherwise).
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
