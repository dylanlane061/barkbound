# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Barkbound** is a dog-travel scouting and research platform. The core question it answers is: *"Is this place actually worth visiting with my dogs?"* It is not a route planner — users export candidates to tools like Roadtrippers or Google Maps after doing research here.

## Two-Layer Architecture

### Barkbound (Product Layer) — `packages/app`
Next.js 14 application (App Router). Responsible for discovery, scouting reports, candidate evaluation, and trip research. Deployed to Vercel.

### PawSignal (Intelligence Layer) — `packages/pawsignal`
Pure TypeScript library with no framework dependencies. Consumed by the Next.js app via npm workspaces (`@barkbound/pawsignal`). Responsible for:
- Normalizing raw data across heterogeneous sources
- Extracting dog-relevant signals (pet policies, size restrictions, leash rules, amenities)
- Producing transparent confidence scores with visible evidence chains

`transpilePackages: ['@barkbound/pawsignal']` in `next.config.ts` lets Next.js compile PawSignal's TypeScript source directly — no separate build step needed during development.

**Every recommendation in Barkbound is powered by PawSignal.**

### Data Flow

```
Data Sources → PawSignal (normalize → extract → score) → Next.js API routes → React pages
```

## Tech Stack

- **Framework**: Next.js 14 (App Router, React Server Components)
- **Language**: TypeScript throughout
- **Database**: PostgreSQL via Drizzle ORM + `postgres` driver
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (set Root Directory to `packages/app` in project settings)

## Commands

All commands run from the repo root unless noted.

```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run typecheck    # Type-check all packages
npm run lint         # Lint all packages
```

Database (run from `packages/app`):
```bash
npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:migrate   # Apply migrations to the database
npm run db:seed      # Seed initial place data
```

## PawSignal Design Principles

These guide all decisions in the intelligence layer:

- **Evidence First** — every conclusion must be backed by evidence; no fabricated scores
- **Source Agnostic** — no single data source is required; sources can be added/removed/replaced without breaking the system
- **Transparent Scoring** — users can always trace why a score exists; avoid black-box outputs
- **Confidence Over Certainty** — the system estimates confidence from available evidence; it does not claim to know the ground truth

## PawSignal Extension Points

To add a new data source:
1. Register a **normalizer** in `packages/pawsignal/src/normalize/index.ts` via `registerAdapter(sourceId, fn)`
2. Register an **extractor** in `packages/pawsignal/src/extract/index.ts` via `registerExtractor(sourceId, fn)`

The extractor maps raw source data to typed `Signal` objects. The `score()` function in `packages/pawsignal/src/score/index.ts` aggregates signals into a `PlaceAssessment` automatically — no changes needed there for new sources.

## Database Schema

Three core tables in `packages/app/src/db/schema.ts`:
- `places` — the canonical place entity
- `raw_records` — raw data fetched from external sources, keyed by `(source, sourceEntityId)`
- `signals` — normalized dog-relevant signals extracted from raw records, linked to a place

The evidence chain is: `places ← signals ← raw_records`. A `PlaceAssessment` is computed at request time from the signals, not stored.

## Key Distinction

PawSignal is not a recommendation engine in the traditional sense. It evaluates the *quality and consistency of evidence* that a place is dog-friendly. The long-term asset is the **evidence graph** — not the UI layer.
