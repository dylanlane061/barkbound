# Barkbound Roadmap

A living working doc. Check items off as they land; reorder freely. The goal of the
current era is **prove the idea**: get real dog-relevant evidence flowing through
PawSignal and onto the screen so we can judge whether the confidence model is useful.

## Where we are today (be honest about it)

The skeleton is complete but **no real data flows through it yet**:

- PawSignal's `normalize` and `extract` registries are **empty** — no source adapters or
  extractors are registered anywhere, so `extract()` returns warnings for every record.
- `score()` works, but with zero signals every place computes to **0% confidence**.
- The DB schema exists but **no migrations have been generated** (`packages/app/drizzle/` is empty).
- `seed.ts` inserts **bare places only** — no `raw_records`, no `signals`.
- The UI correctly renders the empty state ("No signals collected yet").
- There is no trips schema yet — and trips are the trigger for ingestion.

Translation: we built the pipes. Nothing is in them. The first job is to land the trips
schema and the ingestion runner so one real source can flow end-to-end.

## How ingestion works

**Trip nodes are the ingestion unit.** When a user adds a node to a trip (a waypoint with
a radius — e.g. "Asheville, 25 miles"), that is the event that triggers fetching from
external sources for that area.

```
User adds trip node (lat/long + radius)
  → query DB for cached places in bbox  → return immediately (may be empty)
  → kick off area ingestion in background
      fetch bbox from OSM / NPS / etc.
      normalize → extract → persist (deduped by source + sourceEntityId)
  → UI polls or user refreshes to see results as they land
```

The wait is acceptable. What matters is that the UI explains clearly what is happening:
"Finding places nearby...", "Checking PawSignal...", "Done — 12 places found." Users
should never see a blank screen with no explanation.

**Staleness**: `trip_nodes` tracks `ingestedAt`. If null or older than 30 days, re-fetch
that area. Per-place deduplication via `(source, sourceEntityId)` on `raw_records` means
overlapping nodes (two trips both near Asheville) don't double-process the same place.

**This is not a cron job.** There is no background scheduled refresh. Ingestion only
happens when a user creates or refreshes a trip node. The DB grows from real trip
activity, not pre-population.

## Guiding sequence

```
Phase 0  Foundation        → trips schema + migrations + ingestion runner + evidence display
Phase 1  OSM               → first real source, structured dog tags, no API key
Phase 2  NPS + Rec.gov     → parks/campgrounds, free-text extraction
Phase 3  Product surfaces  → trip management UI, filtering, export
Phase 4  Hard sources      → official sites, user imports, verification loop
```

Rationale: the trip schema and ingestion runner are now foundational — they gate
everything else. OSM unlocks real scores. NPS/Rec.gov covers the actual use case
(national parks, campgrounds). Product surfaces are only worth building once scores are
meaningful.

---

## Phase 0 — Foundation

- [ ] **Trips schema**: add `trips`, `trip_nodes`, and `trip_places` tables to
      `packages/app/src/db/schema.ts`:
      - `trips` — id, name, createdAt
      - `trip_nodes` — id, tripId, label, latitude, longitude, radiusMiles, ingestedAt
      - `trip_places` — id, tripId, placeId, addedAt, notes
      Also add `last_ingested_at` to `places` for per-place staleness tracking.
- [ ] Run `db:generate` to produce the initial migration; commit `packages/app/drizzle/`.
- [ ] **Ingestion runner** — the missing glue: `fetch (source, bbox) → normalize → extract
      → persist`. Lives in `packages/app/src/ingest/` (app side, since it touches the DB;
      PawSignal stays DB-agnostic and pure). Triggered by trip node creation, not a cron.
- [ ] **Ingestion status in the UI** — when a trip node triggers ingestion, show clear
      progress messaging ("Finding places nearby...", "Checking PawSignal...", "Done").
      The wait is fine; silence is not.
- [ ] **Evidence display** — on the place page, make each signal expandable to show the
      `raw_records` behind it (source, raw value, when fetched). This is Transparent
      Scoring made literal. Currently `raw_records` is written but never surfaced.

## Phase 1 — OpenStreetMap (first real source)

Best first source: free, no API key (Overpass API), and dog-friendliness is often
**explicitly tagged**, so extraction is a near-trivial high-confidence mapping.

- [ ] Overpass API client — query by bounding box.
- [ ] `registerAdapter('osm', …)` — normalize Overpass elements into `RawRecord`s.
- [ ] `registerExtractor('osm', …)` — map OSM tags to signals:
  - `dog=yes|no|leashed|unleashed|leashed_only` → `pets_allowed` + `leash_required`
  - `pets=yes|no` → `pets_allowed`
  - `amenity=drinking_water` → `water_access`
  - `highway=path` / `route=hiking` with dog tags → `trail_access`
- [ ] Confidence policy for OSM: explicit tag = high (~0.85); inferred from element type
      = lower (~0.5). Document the rationale inline so scores stay traceable.
- [ ] Verify a real trip node near a well-tagged area (a city park, a trail) produces
      non-zero, explainable scores on the place page.

## Phase 2 — NPS & Recreation.gov

Moves from tagged points to the parks and campgrounds that are the actual use case.
Both require a **free API key** and bury pet policy in **free text** — this is where
real extraction gets built (keyword/regex rules first; revisit LLM extraction only if
rules prove too brittle, since LLM output conflicts with Transparent Scoring).

- [ ] **NPS API** (developer.nps.gov, free key) — parks + "Pets" policy articles.
      Extractor scans for leash rules, trail/building restrictions, B.A.R.K. language.
- [ ] **Recreation.gov RIDB** (free key) — facility attributes + description text.
      Mixed structured + free-text extractor.
- [ ] **Cross-source corroboration** — when OSM and NPS agree on a place, `score()`'s
      multi-source boost should kick in. Verify the evidence view shows both sources side
      by side and the aggregate confidence makes intuitive sense.

## Phase 3 — Product surfaces

With real scores from multiple sources, build the UI that makes Barkbound a research tool.

- [ ] **Trip management UI** — create/name trips, add/remove nodes with radius, view the
      places discovered per node. This is the core loop.
- [ ] **Filtering & sorting** — by signal category (off-leash allowed, water access, etc.),
      by confidence threshold, by distance from node.
- [ ] **Export** — hand off to external planners (Google Maps URL, GPX, CSV). This is the
      explicit product hand-off in the vision; only worth building once scores are trustworthy.

## Phase 4 — Hard sources & the trust loop

- [ ] **Official websites** — per-site HTML scrape + extraction. Fragile; lower base
      confidence. Defer until the rules-based extractors are mature enough to reuse.
- [ ] **User imports** — CSV / manual entry. Treat as a distinct evidence class with
      confidence that depends on subsequent verification, not source authority.
- [ ] **Verification loop** — let users confirm/dispute a signal. Every verification
      strengthens PawSignal. Design the schema for this before there is too much data to
      migrate — a `signal_verifications` table (userId, signalId, verdict, createdAt).

---

## Open decisions (resolve as we go)

1. **Ingestion on Vercel** — Vercel has no long-running workers. For now: ingestion runs
   in an API route handler (Next.js route handlers can run up to 5 minutes on Pro). When
   that becomes a constraint, move to Vercel Cron + a queue. Do not over-engineer this yet.
2. **Extraction approach for free text** — keyword/regex rules first. Only reach for LLM
   extraction if rules visibly fail, since LLM output is harder to make traceable.
3. **Assessments computed on-read or cached?** — currently computed per request in
   `score()`. Fine at small scale; revisit if it gets slow.
4. **API keys** — NPS and Rec.gov need free keys. Add to `.env.example` in Phase 2.

## Principles check (don't drift from these)

Every phase above should respect PawSignal's four principles — especially **Evidence
First** (no signal without a `raw_record` behind it) and **Transparent Scoring** (the
Phase 0 evidence display is non-negotiable, not a nice-to-have).
