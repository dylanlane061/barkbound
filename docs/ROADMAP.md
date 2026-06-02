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

## How ingestion works (revised in Phase 1.5 — on-demand, per place)

Ingestion is now **two phases split in time**, anchored on Google Places as the
canonical catalog:

**1. Catalog (cheap, eager).** Searching within a radius (a trip node) calls Google
Nearby Search with the user's type tags (restaurants, lodging, parks, breweries…).
Results are upserted as canonical places keyed by Google `place_id`. No evidence and
no score yet — just a fast, browsable list.

**2. Assess (expensive, on demand).** On a place with no score, the user *requests* an
assessment. Only then do we run the full collection for that ONE place: each
enrichment source (OSM today; NPS/Rec.gov later) is queried near the place, conflated
to it by name + geo + category, extracted into signals, and stored. `places.assessed_at`
is set; the score is computed on read from the stored signals.

```
User searches radius + tags
  → Google Nearby → upsert canonical places (place_id)     [fast, no score]
User opens a place, clicks "Request assessment"
  → for each enrichment source: find candidate near place → conflate → extract
  → store raw_records + signals, set assessed_at
  → score() on read from stored signals
After 30 days → place shows "Refresh" → re-run collection, bump assessed_at
```

**Why on-demand:** scoring every place in a radius wastes API calls and conflation
effort on places the user never opens. Per-place assessment is also small enough to run
synchronously in the request — no background worker or queue needed on Vercel.

**Unassessed vs. empty:** `assessed_at IS NULL` means "never assessed" (show "Request
assessment"); a non-null timestamp with a low score means "we looked across all sources
and found little" — an honest, different statement.

**Dedup & staleness:** raw_records remain keyed by `(source, source_entity_id)`, so
refreshes upsert rather than duplicate. `assessed_at` (per place) drives the 30-day
refresh; `trip_nodes.ingested_at` now marks when an area was last *catalogued*.

## Guiding sequence

```
Phase 0   Foundation        → trips schema + migrations + ingestion runner + evidence display
Phase 1   OSM               → first real source, structured dog tags, no API key
Phase 1.5 Google backbone   → canonical catalog + autocomplete + on-demand per-place assessment
Phase 2   NPS + Rec.gov     → parks/campgrounds, free-text extraction
Phase 3   Product surfaces  → trip management UI, filtering, export
Phase 4   Hard sources      → official sites, user imports, verification loop
```

Rationale: the trip schema and ingestion runner are now foundational — they gate
everything else. OSM unlocks real scores. NPS/Rec.gov covers the actual use case
(national parks, campgrounds). Product surfaces are only worth building once scores are
meaningful.

---

## Phase 0 — Foundation

- [x] **Trips schema**: `trips`, `trip_nodes`, `trip_places` added to schema.
      `last_ingested_at` added to `places`.
- [ ] Run `db:generate` and `db:migrate` against a real database to apply the schema.
- [x] **Ingestion runner** — `packages/app/src/ingest/runner.ts`. `registerAreaFetcher()`
      is the hook for Phase 1 sources. `ingestArea()` is called by the nodes API route.
- [x] **Ingestion status in the UI** — `NodeForm` shows "Finding location and checking
      PawSignal... this may take a moment." while the request is in flight.
- [x] **Evidence display** — `SignalList` now accepts `rawRecords` and uses
      `<details>/<summary>` to show the raw source data behind each signal inline.

## Phase 1 — OpenStreetMap (first real source)

Best first source: free, no API key (Overpass API), and dog-friendliness is often
**explicitly tagged**, so extraction is a near-trivial high-confidence mapping.

- [x] Overpass API client — `packages/app/src/ingest/sources/osm.ts`, queries by bbox
      using `out center` so ways return a usable lat/lon.
- [x] `registerExtractor('osm', osmExtractor)` — maps OSM tags to signals:
  - `dog=yes|no|leashed|unleashed` → `pets_allowed` + `leash_required` (0.85)
  - `pets=yes|no` (no `dog=` tag present) → `pets_allowed` (0.70, less specific)
  - `leisure=dog_park` → `pets_allowed` + `designated_area` (0.90), inferred `leash_required=false` (0.60)
  - `amenity=drinking_water` → `water_access` (0.85)
  - `fee:dog` / `dog:fee` / `pet:fee` → `pet_fee` (0.80)
- [x] Confidence rationale documented inline in `packages/pawsignal/src/extract/osm.ts`.
- [ ] **Verify end-to-end**: run the app against a live DB, add a stop near a city with
      good OSM coverage (Asheville NC, Portland OR, Denver CO), confirm places appear
      with non-zero confidence and expandable signal evidence.

## Phase 1.5 — Google Places backbone + on-demand assessment

OSM is a good *enrichment* source but a poor *catalog* (sparse businesses, thin
dog-policy density). Google Places becomes the canonical catalog/identity spine, and
PawSignal's job sharpens to "build defensible confidence about places Google
catalogued." Scoring shifts to user-initiated, per place (see "How ingestion works",
revised above). PawSignal's `extract()`/`score()` are unchanged — this is an
orchestration + persistence shift in the app layer.

Compliance shapes the design: store Google `place_id` durably; treat Google display
fields as a refreshable cache; do NOT persist Google attributes as permanent evidence.
**Google = spine + a live read-time signal; OSM/NPS/etc = stored evidence.** Every call
uses a FieldMask (Places API New requires it; it also controls cost) and autocomplete
uses session tokens. "Anchor" is a *role* — Google fills it now, but the engine never
*requires* Google (preserves Source Agnostic).

### 1.5a — Schema + Google client
- [ ] `places`: add `external_id` (unique — the Google place_id), `canonical_source`,
      `assessed_at`. Generate + apply migration.
- [ ] `SourceId` gains `'google'` in PawSignal types.
- [ ] Google client (`src/ingest/google.ts`): `autocomplete()`, `searchNearby()`,
      `getPlaceDetails()` — typed, FieldMasked, reads `GOOGLE_MAPS_API_KEY`.

### 1.5b — Catalog (search → fast, scoreless list)
- [ ] `/api/search/autocomplete` → typeahead in the search box (cities + places).
- [ ] Nearby Search with user type tags (restaurants, lodging, parks, breweries…) →
      upsert canonical places by `external_id`. No scores yet.
- [ ] Define the Google `includedTypes` allowlist (fixes the fountains/no-restaurants
      problem at the source).

### 1.5c — On-demand assessment (per place)
- [ ] Enrichment sources implement `findEvidence(place)` (per-place — replaces the bbox
      area fetch). Conflate one known place by name + geo + category.
- [ ] `POST /api/places/[id]/assess` runs enrichment → conflate → extract → store
      signals/raw_records → set `assessed_at`. Runs synchronously (one place is small).
- [ ] Place detail "Request assessment" button; recompute score on read from signals.

### 1.5d — Staleness + live Google signal
- [ ] Show "assessed N days ago" and a "Refresh" action past 30 days (re-collect, bump
      `assessed_at`).
- [ ] Optional: fetch Google `allowsDogs` live at read time as an additional signal,
      clearly marked as live (not a stored raw_record).

**Known gap (deliberate defer):** Google's type coverage is weak for trails and dog
parks — central to dog travel, and where OSM is actually stronger. For now accept a
commercial-POI-heavy catalog; revisit letting OSM contribute trail/park *catalog*
entries (not just enrichment) once the Google path is proven.

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

1. **Ingestion on Vercel** — Largely resolved by Phase 1.5's on-demand model: assessing
   one place at a time is small enough to run synchronously in an API route handler, so no
   background worker or queue is needed yet. The area catalog (Google Nearby) is a single
   fast call. Revisit only if batch / refresh-all features arrive.
2. **Extraction approach for free text** — keyword/regex rules first. Only reach for LLM
   extraction if rules visibly fail, since LLM output is harder to make traceable.
3. **Assessments computed on-read or cached?** — Settled in Phase 1.5: store the
   expensive part (evidence — raw_records + signals) when an assessment is requested, and
   recompute the cheap `score()` on read from stored signals. Tuning weights re-scores
   without re-collecting. `assessed_at` marks when collection last ran.
4. **API keys** — Google Places (`GOOGLE_MAPS_API_KEY`) in Phase 1.5; NPS and Rec.gov in
   Phase 2. Add to `.env.example` as each is introduced.

## Principles check (don't drift from these)

Every phase above should respect PawSignal's four principles — especially **Evidence
First** (no signal without a `raw_record` behind it) and **Transparent Scoring** (the
Phase 0 evidence display is non-negotiable, not a nice-to-have).
