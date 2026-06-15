# Barkbound

Barkbound is a dog-travel scouting and research tool. The core question it answers
is: **"Is this place actually worth visiting with my dogs?"**

It is not a route planner. You use Barkbound to research and shortlist places —
restaurants, lodging, parks, breweries, and more — and then export the winners to
tools like Roadtrippers or Google Maps to actually build your route.

## Purpose

Pet-friendliness info online is scattered, inconsistent, and often wrong. Barkbound
pulls together evidence from multiple sources (official websites, OpenStreetMap,
Google Places, reviews, etc.) about a place's dog policies — leash rules, size
restrictions, pet fees, outdoor seating, off-leash areas — and turns that evidence
into a transparent confidence score, with a visible trail of *why* the score is what
it is. No black-box ratings, no guessing.

## How it works

Barkbound has two layers:

### Barkbound (product layer) — `src/`
A Next.js 14 app (App Router) that handles discovery, trip planning, place pages,
and scouting reports. This is what you interact with in the browser.

### PawSignal (intelligence layer) — `pawsignal/`
A framework-free TypeScript module (imported via the `@pawsignal` alias) that does
the actual evidence work:

- **Normalize** — turns raw data from each source into a common shape
- **Extract** — pulls dog-relevant signals out of that data (pet policies, size
  limits, leash rules, amenities, etc.)
- **Score** — aggregates signals into a `PlaceAssessment`: a confidence score with
  a full evidence chain back to its sources

Every recommendation shown in Barkbound is powered by PawSignal — the UI never
fabricates a score.

### Data flow

```
Data sources → PawSignal (normalize → extract → score) → Next.js API routes → React pages
```

### Ingestion model (on-demand, per place)

1. **Catalog (cheap, eager)** — searching a radius with type tags (restaurants,
   lodging, parks, breweries...) hits Google Nearby Search and upserts canonical
   places. Fast, no scoring yet.
2. **Assess (expensive, on demand)** — opening an unscored place and requesting an
   assessment runs the full per-source collection for that place, conflates results,
   extracts signals, and stores them. The score is then computed on read from the
   stored signals, and can be refreshed later.

## Components

- **`src/app`** — Next.js routes: discovery, places, trips, and API endpoints
- **`src/components`** — UI components (discover, place pages, trips, kit)
- **`src/db`** — Drizzle ORM schema and seed script
- **`src/ingest`** — source registration and the ingestion runner
- **`pawsignal`** — the intelligence layer: `normalize/`, `extract/`, `score/`,
  shared `types.ts`

The database has three core tables (`src/db/schema.ts`):

- `places` — the canonical place entity
- `raw_records` — raw data fetched from external sources
- `signals` — normalized dog-relevant signals extracted from raw records

The evidence chain is `places ← signals ← raw_records`. A `PlaceAssessment` is
computed at request time from the signals, not stored.

For the current state of the project and what's being built next, see
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `DATABASE_URL` — Postgres connection string (used in production; local dev uses
  SQLite via `local.db` by default, see `drizzle.config.ts`)
- `GOOGLE_MAPS_API_KEY` — server-side key for Google Places (New) Nearby Search +
  Details
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser key for the place picker search box
  (restrict with HTTP referrer rules)
- `ANTHROPIC_API_KEY` — optional, enables Claude-backed website pet-policy
  extraction (falls back to a regex matcher if unset)

### Set up the database

```bash
npm run db:generate   # generate Drizzle migrations from the schema
npm run db:migrate     # apply migrations
npm run db:seed        # seed initial place data
```

### Run the app

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm run build      # production build
npm run typecheck  # type-check the project
npm run lint       # lint the project
```
