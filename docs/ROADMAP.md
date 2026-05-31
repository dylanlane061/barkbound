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

Translation: we built the pipes. Nothing is in them. The first job is to push one real
source end-to-end so a place shows a non-zero, *explainable* score.

## Guiding sequence

```
Phase 0  Make data real          → migrations + ingestion plumbing + evidence display
Phase 1  First source: OSM       → structured dog tags, no API key, high confidence
Phase 2  Parks & camps: NPS + Rec.gov → free-text extraction, real coverage
Phase 3  Product features        → saved candidates, export, filtering
Phase 4  Hard sources + trust    → official sites, user imports, verification loop
```

Rationale: a feature like "export to Roadtrippers" is worthless until there's real
evidence worth exporting. Data first, then the product surfaces that show it off.

---

## Phase 0 — Make data real (foundation)

Nothing downstream matters until one source reaches the screen.

- [ ] Run `db:generate` to produce the initial migration; commit `packages/app/drizzle/`.
- [ ] Build an **ingestion runner** — the missing glue that ties the pipeline together:
      `fetch (source) → normalize → extract → persist (places, raw_records, signals)`.
      Lives in `packages/app/src/ingest/` (app side, since it touches the DB; PawSignal
      stays DB-agnostic and pure).
- [ ] Decide where ingestion runs (see Open Decisions). Start with a **manual CLI script**
      (`npm run ingest`) — simplest thing that proves the loop.
- [ ] **Evidence display**: on the place page, make each signal expandable to show the
      `raw_records` behind it (the source, the raw value, when fetched). This is the
      "Transparent Scoring" principle made literal — arguably the most important UI in the
      whole product. Right now `raw_records` is written but never surfaced.
- [ ] Replace the bare-places seed with a small set of **real ingested places** so the app
      demos with genuine evidence, not placeholders.

## Phase 1 — OpenStreetMap (first real source)

Best first source: free, no API key (Overpass API), and dog-friendliness is often
**explicitly tagged**, so extraction is a near-trivial mapping with high confidence.

- [ ] Overpass API client (query by bounding box / area).
- [ ] `registerAdapter('osm', …)` — normalize Overpass elements into `RawRecord`s.
- [ ] `registerExtractor('osm', …)` — map OSM tags to signals:
  - `dog=yes|no|leashed|unleashed|leashed_only` → `pets_allowed` + `leash_required`
  - `pets=yes|no` → `pets_allowed`
  - presence of `amenity=drinking_water` nearby → `water_access`
  - `highway=path` / `route=hiking` with dog tags → `trail_access`
- [ ] Confidence policy for OSM: explicit tag = high (~0.85); inferred = lower. Document
      the rationale inline so scores stay traceable.

## Phase 2 — NPS & Recreation.gov

Moves us from "tagged points" to the parks/campgrounds that are the actual use case.
Both require a **free API key** and both bury pet policy in **free text**, so this is
where we build real extraction (keyword rules first; revisit LLM extraction only if
rules prove too brittle).

- [ ] **NPS API** (developer.nps.gov, free key). Parks + their "Pets" articles /
      `thingstodo`. Pet policy is usually unstructured prose → extractor scans for leash
      rules, B.A.R.K. ranger language, trail/building restrictions.
- [ ] **Recreation.gov RIDB** (free key). Facility attributes sometimes include "Pets
      Allowed"; otherwise it's in the description text. Mixed structured + free-text extractor.
- [ ] **Cross-source corroboration check**: when OSM and NPS agree on a place, `score()`'s
      multi-source boost should kick in. Verify this produces sensible aggregate confidence
      and that the evidence view shows both sources side by side.

## Phase 3 — Product features (surface the evidence)

With real scores, build the surfaces that make Barkbound a *research* tool.

- [ ] **Saved candidates / scouting list** — let a user collect places they're evaluating.
      New table; the core "research before you commit" loop.
- [ ] **Export** to external planners (Roadtrippers, Google Maps) — the explicit hand-off
      in the product vision. Likely Google Maps URL / GPX / CSV to start.
- [ ] **Filtering & sorting** — by signal (e.g. "off-leash allowed"), by confidence
      threshold, by distance.
- [ ] **Geographic search** — lat/long radius using the coords already in the `places`
      schema (currently unused by the search route).

## Phase 4 — Harder sources & the trust loop

- [ ] **Official websites** — HTML scrape + extraction. Fragile and per-site; lower base
      confidence. Defer until the rules-based extractors are mature enough to reuse.
- [ ] **User imports** — CSV / manual entry. Treat user-asserted facts as a distinct
      evidence class (confidence depends on verification, not source authority).
- [ ] **Verification loop** — let users confirm/dispute a signal. Per the vision, "every
      user verification strengthens PawSignal." This is what compounds the evidence graph
      over time; design the schema for it before we have lots of data to migrate.

---

## Open decisions (resolve as we go)

1. **Where does ingestion run on Vercel?** Vercel has no long-running workers. Options:
   (a) manual CLI now → Vercel Cron later for scheduled refresh; (b) on-demand fetch at
   search time with caching. Recommendation: start with (a), it's the least magic.
2. **Extraction approach for free text** — start with keyword/regex rules (cheap, fully
   transparent, no API cost). Only reach for LLM extraction if rules visibly fail, since
   LLM output is harder to make traceable (conflicts with Transparent Scoring).
3. **Are assessments computed on-read or cached?** Currently computed per request in
   `score()`. Fine at small scale; revisit if it gets slow.
4. **API keys** — NPS and Rec.gov both need free keys. Add to `.env.example` when we
   reach Phase 2.

## Principles check (don't drift from these)

Every phase above should respect PawSignal's four principles — especially **Evidence
First** (no signal without a `raw_record` behind it) and **Transparent Scoring** (the
Phase 0 evidence display is non-negotiable, not a nice-to-have).
