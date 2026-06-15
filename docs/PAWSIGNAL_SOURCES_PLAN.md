# PawSignal Sources — Enhancement Plan

A focused plan for making the confidence score richer and more trustworthy while
staying cheap (personal-scale, free tiers + Claude where it clearly pays off).
Companion to `ROADMAP.md`; this drills into the *intelligence layer* specifically.

## What we have today (accurate as of this doc)

The `runAssessment()` pipeline in `src/lib/assess-place.ts` already runs **three
sources** per place, on demand:

1. **OSM (structured tags)** — Overpass query in a 0.6mi bbox, conflated to the place
   by ~0.12mi distance or name match. `osmExtractor` maps `dog=*`, `leisure=dog_park`,
   `pets=yes`, `amenity=drinking_water`, fee tags → signals (0.60–0.90 confidence).
2. **Google `allowsDogs`** — one live Place Details read; the derived boolean is stored
   as a refreshable signal (0.75), not as permanent Google data.
3. **Website (regex)** — `fetchWebsiteText()` pulls the homepage + up to 2 policy-ish
   subpages, strips HTML to text, and `matchPetPolicy()` (pure regex rules in
   `pawsignal/extract/website.ts`) extracts at most one claim per category, each with a
   verbatim quote.

`score()` combines them with an additive evidence model: category weights × per-source
trust (`website 1.6 > nps/recgov 1.3 > google 1.2 > osm 1.0 > reviews 0.8`) × polarity ×
confidence, with diminishing returns and a PRIOR that keeps thin evidence modest.

**The honest gaps:**
- Website extraction is **English regex only** — misses paraphrases, tables, exact
  numbers (size/weight limits, fee amounts, max # of dogs), breed rules, patio-vs-indoor
  nuance, and anything on a JS-rendered page (we fetch raw HTML, no render).
- **Google reviews are untouched** — `google_reviews` exists in the type union and in
  `SOURCE_TRUST` (0.8) but no code produces it. Reviews are the best real-world ground
  truth ("they had a water bowl out front", "got turned away with our dog").
- **No parks/campgrounds source** — NPS and Rec.gov are exactly where dog travel happens
  and where Google/OSM are weakest. Roadmap Phase 2, not yet built.
- The model's confidences are hand-tuned with **no real multi-source data** to calibrate
  against yet.

## The core idea: one quote-grounded text extractor, many sources

The highest-leverage move is **not** another bespoke regex file per source. It's a single
robust free-text extractor that every text source points at: website pages, Google
reviews, NPS pet articles, Rec.gov descriptions. Build it once, reuse it four times.

That extractor should be **LLM-backed (Claude Haiku) with a verbatim-quote contract**:

- Claude receives cleaned page/review text and returns a JSON array of claims. Every
  claim **must** include a `quote` copied verbatim from the input, plus `category`,
  `value`, `confidence`.
- We **programmatically verify** each quote actually appears in the source text and drop
  any that don't. Claude *proposes*; the quote *proves*.
- The verified quote becomes the stored evidence — identical shape to today's regex
  claims, so the DB, the evidence display, and `score()` are unchanged.

This is the explicit resolution to the roadmap's worry that "LLM output conflicts with
Transparent Scoring." It doesn't, as long as the quote (not the model) is the evidence.
PawSignal's pure core stays deterministic and framework-free; the LLM lives in the `src/`
IO layer next to `fetchWebsiteText()`, exactly where the network already lives. Keep the
existing regex matcher as a zero-cost fallback when no API key is set and as a cheap
cross-check.

**Cost:** Haiku on a few KB of text is fractions of a cent; assessment is on-demand and
per-place; cache by `url + content-hash` so re-assessing an unchanged page is free.

## Phased plan (each phase ships independently)

### Phase A — Claude website extractor (biggest single win) — ✅ IMPLEMENTED
Directly upgrades the source we already have. Replace/augment `matchPetPolicy` with the
quote-grounded Claude extractor described above.

**Shipped:** `src/lib/content/extract-llm.ts` (`extractClaims` + pure, tested helpers
`quoteIsGrounded` / `parseClaims` / `groundClaims`, and the `extractPolicyClaims`
orchestrator). `website.ts` now calls `extractPolicyClaims`, which uses Claude when
`ANTHROPIC_API_KEY` is set and falls back to the regex matcher (also filling category
gaps the LLM missed). Plain `fetch` to the Anthropic API — no new dependency. Verify with
`npm run eval:website` (pure checks always run; a live regex-vs-Claude comparison runs when
the key is set). Remaining nice-to-haves: response caching by `url + content-hash`, and a
render step for JS-only pages.
- New module `src/lib/content/extract-llm.ts`: `extractClaims(text, sourceHint)` → verified
  `PolicyClaim[]`. Reuses the existing `PolicyClaim` shape.
- `fetchWebsiteText()` calls the LLM extractor when `ANTHROPIC_API_KEY` is set, else falls
  back to `matchPetPolicy`. No change to `assess-place.ts`'s storage path.
- Richer claims: capture exact size/weight limits, fee amounts, max dog count, breed
  restrictions, off-leash vs leashed, patio-only — as structured `value`s on the existing
  categories (extend `SignalValue` usage, not the schema).
- Verification step: unit-test the quote-presence check; eval the extractor on ~10 real
  dog-policy pages vs the regex baseline (recall/precision).

### Phase B — Google reviews mining (`google_reviews`) — ✅ IMPLEMENTED
Reuses Phase A's extractor; only the data plumbing is new.

**Shipped:** `getPlaceDetails(placeId, { includeReviews })` adds `reviews` to the FieldMask
only when opted in (the Enterprise-SKU bump). The extractor gained a `reviews` mode
(`extractReviewClaims`) with a review-specific prompt and a lower confidence ceiling (0.7).
`runAssessment` runs review text through it and stores claims under a `google_reviews`
raw_record — so `assessPlaces` stamps those signals with the `google_reviews` source and
its 0.8 trust weight automatically (no schema change). Gated behind
`PAWSIGNAL_GOOGLE_REVIEWS=1` (and requires `ANTHROPIC_API_KEY`); off by default, so cost is
opt-in. ToS-safe: reviews are a live read, re-fetched each assessment, and only the
extracted claim + its verbatim snippet are stored — never Google's review payload.
- Add `reviews` to the Place Details fieldMask. This bumps that call to the
  **Enterprise + Atmosphere SKU** — free up to **1,000 calls/month**, far beyond personal
  use. Gate it behind a flag so cost is opt-in.
- Run the (up to 5) returned review snippets through `extractClaims` with a
  reviews-specific hint (reviews assert *experience*, not *policy* → lower confidence; the
  0.8 trust weight already encodes this).
- ToS-safe storage: treat reviews like `allowsDogs` — a refreshable live read, re-fetched
  on assessment, never persisted as a permanent Google dataset. Store only the extracted
  claim + its verbatim snippet as evidence.

### Phase C — NPS + Recreation.gov (the actual use case)
Parks and campgrounds are central to dog travel and where the other sources are thinnest.
Both are **free API keys**.
- **NPS** (`developer.nps.gov`): pull the park's "Pets"/Things-to-Do articles; run the
  free-text through `extractClaims`. High trust (official agency, ~0.85+). Looks for leash
  rules, trail/building restrictions, B.A.R.K. language.
- **Rec.gov RIDB**: facility pet attributes (structured) + description text (free-text via
  the extractor). Mixed extractor.
- Conflate to the Google-catalogued place by name + geo + category, same pattern as OSM.
- Cross-source corroboration: when NPS and a review agree, the additive model's
  multi-source accumulation should visibly lift confidence — verify the evidence view
  shows both side by side.

### Phase D — Model calibration & freshness (once real multi-source data exists)
Cheap, code-only, no new data — but only meaningful *after* A–C produce real signals.
- **Freshness decay**: down-weight stale live signals (Google attribute, reviews) as they
  age; surface "assessed N days ago" already planned in roadmap 1.5d.
- **Conflict surfacing**: expose source disagreement explicitly in `ScoreBreakdown` (e.g.
  website says yes, a review says turned away) so it's visible, not silently averaged.
- **Recalibrate** the hand-tuned confidences/weights against the first real dataset.

## Sources considered and deprioritized
- **Yelp Fusion** — has moved toward a paid data-licensing model; the previously-free
  `dogs_allowed` attribute is no longer reliably free. Revisit only if a usable free key is
  confirmed.
- **BringFido** — the most dog-specific dataset, but no public API. Scraping is fragile and
  ToS-risky; skip.
- **Foursquare Places** — possible free tier but heavily overlaps Google; low marginal
  value for the effort.

## Recommended sequence
A → B → C → D. A upgrades an existing source and builds the reusable extractor that B and
C both depend on, so the leverage compounds. Every phase respects PawSignal's four
principles — most importantly **Evidence First** (the verbatim quote is the evidence) and
**Transparent Scoring** (the LLM proposes, the quote proves; nothing becomes a black box).
