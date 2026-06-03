# Handoff: Barkbound — Dog-Friendly Trip Planner

## Overview
Barkbound is a road-trip planner for people traveling with dogs. Users build multi-stop
trips, discover dog-friendly places (parks, patios, trails, breweries, campgrounds, hotels)
around each stop, and save the best ones to their itinerary. Every place carries a
**PawSignal score** — a 0–100 dog-friendliness confidence rating estimated from public
evidence (official pet policies, reviews, etc.).

This bundle contains pixel-final designs for the four core screens plus the shared shell:

1. **Trips** (gallery / home) — all of the user's trips
2. **Trip Detail** — a single trip's editable stop-by-stop itinerary
3. **Discover** (formerly two screens, "Search" + "Discover", now unified) — search for a
   location, then browse scored dog-friendly places on a list ⇄ map
4. **Place Detail** — a single place's full PawSignal evidence breakdown

> The designs target **desktop web** (max content width ~1280–1320px). Mobile is not yet
> designed — see "Open questions" at the end.

---

## About the Design Files
The files in `prototypes/` are **design references built in HTML + inline JSX (React via
Babel standalone)**. They are prototypes that demonstrate the intended look, layout, and
interactions — **not production code to copy verbatim**.

Your task is to **recreate these designs in the project's real codebase**, using its
established framework, component library, routing, and data layer. The prototypes fake all
data (in-file constants) and fake navigation (via `localStorage` + full-page redirects);
your implementation should replace those with real data fetching, real routing, and real
state management.

If the project does not yet have an established frontend environment, **React** is the
natural choice (the prototypes are already React component trees), but any modern framework
is fine — translate the patterns accordingly.

### How the prototype files are organized
Each screen is one HTML entry point that loads shared `bb-kit.jsx` plus screen-specific
component + orchestrator files:

| Screen | Entry HTML | Components | Orchestrator (state + mount) |
|---|---|---|---|
| Shell/router | `Barkbound.html` | — | redirects into the right page from `localStorage.bb_route` |
| Trips | `Trips.html` | `bb-home-final.jsx`, `bb-modals.jsx` | `bb-home-final-app.jsx` |
| Trip Detail | `Trip Detail.html` | `bb-trip-final.jsx` | `bb-trip-final-app.jsx` |
| Discover | `Stop Detail.html` | `bb-stop-final.jsx` | `bb-stop-final-app.jsx` |
| Place Detail | `Place Detail.html` | `bb-place-final.jsx` | `bb-place-final-app.jsx` |
| Shared kit | (all) | `bb-kit.jsx` | design tokens live in `brand.css` |

`bb-kit.jsx` is the shared design system in code: icon set, `TopBar`, `TerrainMap`,
`Photo` placeholder, score rings/badges, breadcrumb, and the seed data (`PLACES`, `STOPS`,
`TRIPS`, `CATS`, confidence helpers). Read it first.

---

## Fidelity
**High-fidelity (hifi).** These are pixel-final mockups with final colors, typography,
spacing, radii, shadows, and interaction states. Recreate the UI faithfully using the
codebase's component primitives. All design tokens are defined in `brand.css` (`:root`
custom properties) — port these into the target system's theme rather than hardcoding values.

---

## Design Tokens
All tokens are CSS custom properties in `prototypes/brand.css`. Port them into the
codebase's theme system.

### Color
```
/* Forest greens (primary brand) */
--green-900: #14352a     /* darkest — headings, deep accents */
--green-800: #1f4d3a     /* PRIMARY brand color — buttons, key UI */
--green-700: #2c6249
--green-600: #3d7a5c
--green-tint:  #e7efe9    /* active tab bg, soft fills */
--green-tint-2:#f0f5f1    /* very soft section bg */

/* Orange (accent — "active trip", top-pick tags, alerts) */
--orange:        #d9722f
--orange-bright: #e8865a
--orange-tint:   #fbeadd

/* Warm neutrals */
--sand: #d8c3a5   --sand-light: #ece0cb
--paper:  #faf8f3   /* app background */
--paper-2:#f4f1e8   /* secondary surfaces */
--card:   #ffffff   /* cards */

/* Ink / text */
--ink:   #20231f    /* primary text */
--ink-2: #4b4f48    /* secondary text */
--muted: #8a8d83    /* tertiary/meta text */
--line:  #e7e3d8    /* hairline borders */
--line-2:#d9d4c6    /* stronger borders */

/* PawSignal confidence states (score → color) */
--hi:  #2f7d52  --hi-bg:  #e4efe8  --hi-line:  #bfdcca   /* high  (score ≥ 80) */
--med: #b07d12  --med-bg: #f6edd6  --med-line: #e7d4a0   /* medium(score 65–79) */
--lo:  #c2502f  --lo-bg:  #f7e4da  --lo-line:  #ecc3ad   /* low   (score < 65) */
--slate:#6a7280 --slate-bg:#ecedf0 --slate-line:#d4d7dd  /* neutral/unscored/"Planning" */

/* Terrain map fills */
--terrain-sand:#ece2cb  --terrain-sand-2:#e4d6b8
--terrain-green:#dce9dc --terrain-green-2:#cfe1cf
--terrain-water:#cfe0e1
--contour: rgba(31,77,58,0.16)  --contour-soft: rgba(31,77,58,0.09)
```

**Confidence thresholds** (see `confOf()` in `bb-kit.jsx`): `score >= 80 → 'hi'`,
`score >= 65 → 'med'`, else `'lo'`. Use `CONF_VAR[conf]` to map to the color var and
`CONF_LABEL[conf]` for the label ("High"/"Medium"/"Low").

### Typography
```
--f-display: 'Bricolage Grotesque', 'Geist', system-ui, sans-serif;  /* headings, scores, numbers */
--f-body:    'Geist', system-ui, sans-serif;                          /* body, UI */
--f-mono:    'Geist Mono', ui-monospace, monospace;                   /* small numeric/meta */
```
Loaded from Google Fonts. Display weights used: 700–800. Body: 400–600.
`.display` helper sets `letter-spacing: -0.015em; line-height: 1.05`.

Type scale in use (px): hero h1 33–38 / screen h1 27–34 / section 16–21 / card title
14.5–17 / body 13–15 / meta 11–12.5 / label (uppercase, letter-spacing 0.06–0.12em) 10–11.

### Spacing, radii, shadows
```
--r-sm: 8px   --r: 12px   --r-lg: 16px   --r-xl: 22px   --pill: 999px

--sh-sm: subtle (cards at rest)
--sh:    medium (hover lift, popovers)
--sh-lg: large (floating toolbars)
--sh-pop:strong (peek cards, modals)
--focus: 0 0 0 3px rgba(31,77,58,0.16)   /* focus ring */
```
Common paddings: cards 14–16px; screen gutters 28px; control height 40px; pill buttons
`8–11px × 14–18px`. Layout gaps use flex/grid `gap` (helpers `.g4 .g6 .g8 .g10 .g12 .g14
.g16 .g20` = that many px).

### Iconography
Custom 24×24 line icons (stroke ~1.7), defined as SVG paths in the `PATHS` object at the top
of `bb-kit.jsx` and rendered by the `<Ic name size color stroke fill />` component. Names
include: `trail, trees, food, beer, hotel, camp, dog, park, search, plus, check, pin,
bookmark, chevron, chevronL, chevronD, arrow, back, sliders, globe, doc, star, paw, share,
route, clock, shield, refresh, map, x, sliders`. Replace with the codebase's icon library
(e.g. Lucide — these mirror Lucide's visual style) keeping the same names/metaphors.

### Place categories
`CATS` in `bb-kit.jsx` maps category key → `{ label, icon }`. Keys seen across the app:
`park, dogpark, trail, restaurant, brewery, cafe, hotel, campground`. Each has an icon and a
display label; categories drive the Discover filter chips and the per-place glyph.

---

## Shared Components (`bb-kit.jsx`)

### TopBar (global nav)
Sticky header, `rgba(250,248,243,0.88)` + `backdrop-filter: blur(10px)`, 64px tall,
bottom hairline. Contents left→right:
- **Logo** (paw mark + "Barkbound"), clicking → Trips.
- **Tabs**: `Trips`, `Discover`. Active tab has `--green-tint` bg, `--green-800` text,
  weight 600, radius 9px. Active logic: "Trips" highlights on `home`+`trip` screens;
  "Discover" highlights on `stop`+`place`+`search`.
- **Search box** (right, min-width 220px): pill-ish 40px field, search icon, "Search any
  place…" placeholder, `⌘K` hint chip. Clicking navigates to Discover (search empty state).
- **Avatar**: 36px green circle with initial.

> Note: the old separate **"Search" tab was removed** — Search and Discover are now the same
> screen (Discover with vs. without a chosen location). See Discover screen below.

### TerrainMap
Decorative stylized topo map (SVG contour rings, water band, route dashes) used as the
sticky map panel on Discover and as the subtle backdrop behind the Discover search empty
state. Props: `pins`, `route` (SVG path string in a 0–400 viewBox), `h`, `children`.
In production this is a placeholder for a real map (Mapbox/Google Maps/MapLibre).

### Photo (image placeholder)
Topo-textured placeholder with a centered category glyph; props `tone`
(`green|sand|cool|rust|alpine`), `cat` or `glyph`, `h/w/round`. **These stand in for real
imagery** — wherever a `Photo` appears, a real photo belongs (place photos, trip cover
photos). See "Assets".

### Score visualization
- **ScoreRing / ScoreBadge** — circular gauge showing a PawSignal score, ring color from
  the confidence tier. Used on Discover result cards and the map pins.
- Inline score chips: a number in `--f-display` weight 800, bordered in the tier color.

### Crumb (breadcrumb)
Row of clickable labels separated by chevrons; last item is the current page (non-clickable).

---

## Screens / Views

### 1) Trips (`Trips.html` → `bb-home-final.jsx` + `bb-home-final-app.jsx`)
**Purpose:** the user's home — see all trips, continue the active one, start a new one.

**Layout:** centered column, max-width 1280px, 28px gutters.
- **Header row:** eyebrow "Your adventures" + h1 "Trips" (34px/800) + subtext
  "N adventures planned · M dog-friendly places researched"; right-aligned primary
  **"New trip"** button (opens Create-Trip modal).
- **Featured spotlight** (only when an active trip exists): wide card, 2-col grid
  `minmax(280px,0.82fr) 1fr`.
  - Left: full-height **cover photo** (`Photo` placeholder, tone-varied) with an
    "Active" status pill (orange, pulsing dot) top-left and a region chip bottom-left.
  - Right: eyebrow "Continue planning" + "Updated …"; trip name (27px/800); region +
    "Next up · <first stop>"; stat row (stops / places saved / miles / nights); a
    **"Top picks so far"** list (3 places with category glyph, name, category, score in
    tier color); actions **"Open trip"** (primary) + **"Share"** (ghost). Whole card is
    clickable → Trip Detail.
- **Gallery section:** header "All trips" (or "<Filter> trips") + a **segmented filter**
  (`All · Active · Planning · Past`, each with a live count; active segment is a white pill
  with `--sh-sm`).
- **Card grid:** `repeat(auto-fill, minmax(280px, 1fr))`, 20px gap. Each **trip card**:
  - Cover photo (150px) + status pill top-right.
  - Body: trip name (17px/700), stat row (stops / places / miles), **PawSignal pick chips**
    (small tier-bordered score pills) OR "No places saved yet" if none, then a footer
    ("Updated …" + "Open ›").
  - Status pill styles: **Active** = orange solid; **Planning** = slate; **Past** = muted.
  - Hover: `card-lift` (translateY -2px + `--sh`).
  - Last grid cell is the dashed **"Start a new trip"** card (opens the modal).
- **Empty filter state:** dashed card with icon, "No <filter> trips", "Show all trips".

**Create-Trip modal** (`bb-modals.jsx`, `CreateTripModal({ onClose, onCreate })`): centered
dialog (Escape / backdrop / Cancel closes; body scroll locked while open). Collects trip
name, region, dates/when, and a **cover-photo tone** choice. On submit calls
`onCreate({ name, region, when, tone })`; the Trips screen prepends the new trip (status
"Planning", "just now", "No places saved yet"), shows a **confirmation toast** (bottom-center,
green, check icon, auto-dismiss ~3.2s), bumps the header count and the Planning filter count.
Both the header "New trip" button and the dashed grid card open this modal.

### 2) Trip Detail (`Trip Detail.html` → `bb-trip-final.jsx` + `bb-trip-final-app.jsx`)
**Purpose:** view and **edit** one trip's stop-by-stop itinerary. (There is intentionally
**no map here** — this screen is about curating stops and saved places.)

**Layout:** single centered column, max-width 900px, 28px gutters.
- **Hero** (`--green-tint-2` → `--paper` gradient, bottom hairline): breadcrumb
  `Trips › <Trip name>`; "Active trip" pill (orange) + "Updated …" when active; h1 trip name
  (33px/800); a stat row that **recomputes live** from the stops (stops / places saved /
  miles / nights · dates); actions: **"Share"** (ghost). *(An "Optimize route" button was
  removed per review — Share is the only hero action.)*
- **Section header:** "Route & saved places" + helper "Reorder with the arrows · remove on
  hover".
- **Vertical itinerary** — a timeline with a left **spine** (numbered teardrop pins, 30px,
  `border-radius: 50% 50% 50% 4px` rotated 45°, stop color fill, white number) connected by a
  dashed vertical line. For each stop, a **drive leg** connector appears above it
  ("30 mi · ~45 min drive to Sedona", from a pairwise `LEGS` lookup; shows "add drive
  details" when unknown).
  - **Stop card** (white, `--sh-sm`): header with stop name (21px/800) + state, meta
    ("N nights · dates", "M saved"), and two **reorder controls** (up/down chevron square
    buttons; disabled at ends). Optional note line. Then the **saved places** list:
    - **SavedRow**: 48px `Photo` thumbnail, name + optional orange **"Top pick"** tag (rank
      #1 by score), category glyph + "category · X mi" + summary, a square **score chip**
      (tier color), and a hover-revealed **"×" remove** button. Row click → Place Detail.
    - Empty stop → dashed "No places saved here yet" prompt.
    - Footer: dashed ghost button **"Discover more places near <Stop>"** → Discover for that
      stop.
  - **Remove-stop "×"** appears on card hover (top-right), hidden when only one stop remains.
- **Add-stop affordance:** dashed pin + **"Add another stop to this trip"**; clicking opens an
  **inline panel** with a search field + **suggested town chips** (from `SUGGESTED`, filtered
  to towns not already added). Picking one appends a new stop (1 night, a rotating color, no
  saved places yet).
- **Footer disclaimer:** shield icon + "PawSignal scores estimate dog-friendliness from
  public evidence — always confirm before you go."
- **Loading skeleton** + a dev-only **"Reset itinerary"** floating toolbar (see "Prototype
  scaffolding").

### 3) Discover (`Stop Detail.html` → `bb-stop-final.jsx` + `bb-stop-final-app.jsx`)
**Purpose:** find dog-friendly places near a location and run PawSignal on them. This screen
serves **both** "Search" and "Discover": with no location chosen it's a **search empty
state**; once a location is chosen it shows the **results** list ⇄ map.

**3a — Search empty state** (`DiscoverSearch`, shown when no location is set):
- Centered column (max 680px) over a faint `TerrainMap` backdrop with a paper gradient
  overlay (no pins — kept subtle).
- "Powered by PawSignal" eyebrow; h1 "Find dog-friendly places anywhere you're headed"
  (38px/800); supporting paragraph.
- **Large search field** (60px tall, search icon, "Search a town or city…", inline primary
  "Search" button). Typing shows a **live suggestion dropdown** (matches against trip stops
  + popular destinations); Enter / a suggestion / a card / a chip all choose a location.
- **"Jump to a stop on your trip"** — cards for the active trip's stops (teardrop number +
  name + "State · Trip" + "Discover ›"). Hover lifts the card.
- **"Popular with dog parents"** — pin chips (Flagstaff, Bend, Asheville, Moab, Lake Tahoe,
  Austin…).

**3b — Results** (shown once a location is chosen; also the direct landing when arriving from
a Trip Detail "Discover more near <Stop>"):
- **Sticky filter bar** (below the global nav): a **radius control** (dropdown, default
  25 mi) + **category toggle chips** (Trails, Restaurants, Breweries, Hotels, Parks,
  Campgrounds, Dog Parks) + **Reset**. Active chips are green-filled.
- **Two-column body** `minmax(440px,1fr) 1fr`:
  - **List column:** breadcrumb (`Discover › <Location>` when reached via search;
    `Trips › <Trip> › <Stop>` when reached from a trip); h1 "Dog-friendly near <Location>";
    count line ("N places within R mi · K scored"); a **Sort** toggle (Confidence / Distance).
    - **"Check all" banner** (appears while any place is unscored): paw icon + "N places
      haven't been checked" + an orange **"Check all"** button that runs PawSignal across all
      unscored places, staggered.
    - **Result cards** (`ResultCardX`): `Photo` thumbnail, name, category · distance · hours,
      a one-line "why" reason, "N sources checked", a **save (bookmark)** button and a
      details "→" → Place Detail. Right side shows the **ScoreRing** (tier color) once scored;
      unscored cards show a **"Check"** affordance and animate through a "computing" state
      (spinner + sources revealing one by one) before resolving to a score. Scored cards rank
      above unscored and get a numeric rank; #1 may show a "Top match"/"Most space" tag.
    - Filters-exclude-everything → `EmptyState` ("No places match those filters" + Reset).
  - **Map column (sticky):** `TerrainMap` filling the viewport height with **numbered/score
    pins** for each place. Hovering a list card highlights its pin and vice-versa; clicking a
    pin selects it and shows a **PeekCard** (mini place summary with save + details). A
    location chip ("<Location> & R mi"), zoom controls, and a legend overlay the map.
- **Save** → toast "Saved <place>" / "Added to <Location> · <Trip>" with a "View trip" action.
- Loading skeleton + dev **"Reset"/"Replay load"** toolbar.

### 4) Place Detail (`Place Detail.html` → `bb-place-final.jsx` + `bb-place-final-app.jsx`)
**Purpose:** the full PawSignal evidence breakdown for one place (why it scored what it did),
plus save-to-trip. *(This screen predates this handoff round and was already approved; read
the two files for its exact composition — hero with score, evidence/source list, policy
details, and a save action. Breadcrumb returns to Discover / the trip.)*

---

## Interactions & Behavior

### Navigation (prototype vs. production)
The prototypes fake routing: `navTo(screen, params)` in `bb-kit.jsx` writes
`localStorage.bb_route = { screen, params }` then does a **full-page redirect** to the
mapped HTML file (`PAGES = { home:'Trips.html', trip:'Trip Detail.html',
stop:'Stop Detail.html', place:'Place Detail.html' }`). `Barkbound.html` is just an entry
splash that reads `bb_route` and redirects in. **Replace this entirely with the codebase's
router** (e.g. routes `/trips`, `/trips/:id`, `/discover`, `/discover/:location`,
`/places/:id`). Route params seen:
- `trip` → trip id (Trip Detail)
- `stop` → a town/stop id (Discover results for that location; **absent → search empty state**)
- `place` → place id (Place Detail)

### Key behaviors to preserve
- **Discover = Search + results in one screen**, gated on whether a location is chosen.
- **Trip Detail editing:** reorder stops (up/down), remove a saved place (hover ×), remove a
  stop (hover ×, blocked when only one remains), add a stop (inline suggested-town picker);
  the hero stats (stops/places/miles/nights) and drive legs recompute from current stops.
- **PawSignal scoring lifecycle on Discover:** places are `scored` or `unscored` on arrival;
  the user can check one or all; "computing" reveals sources progressively then resolves to a
  score; scored places sort above unscored and gain a rank.
- **List ⇄ map linking** on Discover (hover + select sync both ways; pin click → peek card).
- **Create-trip** prepends a Planning trip + toast + count bumps.
- **Toasts**: bottom-center, auto-dismiss; save toasts offer a "View trip" action.
- **Hover-reveal controls**: remove "×" buttons appear on row/card hover (and are always
  visible on touch via `@media (hover: none)`).

### Motion
- Screen entrance: `.screen-anim` slideUp 8px, .3s, `cubic-bezier(0.22,1,0.36,1)`.
- Card hover lift: translateY(-2px) + shadow, ~.15s.
- Popover/inline-panel entrance: `popIn` (fade + small translate), ~.18s.
- Toast: `toastUp` fade + 10px rise, ~.22s.
- PawSignal "computing": spinner (0.7s linear), spinning ring arc, pulsing pin.
- All decorative/looping motion is gated behind `@media (prefers-reduced-motion: no-preference)`
  or disabled under `reduce`. Keep this.

### Per-screen CSS
Each entry HTML has a small `<style>` block with screen-specific helpers (hover-reveal
classes, slider styling, animations). These belong in the corresponding component's
stylesheet/module in production. The bulk of styling is tokens + utility classes in
`brand.css`.

---

## State Management
Per-screen local state in the orchestrator (`*-app.jsx`) files. In production, lift the
shared/persistent parts (trips, stops, saved places, scores) into the app's data layer.

- **Trips:** list of trips with status (`active|planning|past`), stops, saved-place ids,
  derived stats, cover tone/photo. Create-trip adds one.
- **Trip Detail:** ordered `stops` (each `{ uid, town, name, state, color, nights, dates,
  note, saved:[placeId] }`); ops: reorder, add, remove stop, remove saved place. Stats and
  drive legs are derived.
- **Discover:** `loc` (chosen location | null → search state), `fromTrip` (breadcrumb
  variant), filters (`cats`, `radius`), `sort`, `saved` set, per-place `status`
  (`scored|unscored|computing`) and reveal `progress`, hovered/selected pin, toast.
- **Place Detail:** the place's evidence/sources + saved state.

### Data shapes (from `bb-kit.jsx` seed data — model your API on these)
- **Place:** `{ id, name, cat, score, dist, tone, summary, ... }` + evidence/sources for
  Place Detail. `cat` ∈ `CATS`. `score` 0–100 → confidence tier via `confOf`.
- **Stop:** `{ id, name, state, color, saved:[placeId], x, y }` (x/y are map coords for the
  prototype only).
- **Trip:** `{ id, name, region, status, stops, places(count), miles, nights, picks[], … }`.
- **Drive legs:** `LEGS` is a pairwise `townA|townB → { mi, time }` lookup (prototype). In
  production, compute from a routing/distance API.

---

## Assets
- **No real images are bundled** — every photo is a generated `Photo` placeholder (topo
  texture + category glyph). Real assets needed in production:
  - **Place photos** (Discover cards, Place Detail hero, SavedRows).
  - **Trip cover photos** — the design intentionally lets the user **pick a cover when
    creating a trip**; until then show a curated set of placeholder covers (the `tone`
    values `green|sand|cool|rust|alpine` map to the placeholder palettes). Wire the
    cover-photo control in the Create-Trip modal + the "change cover" button on cards.
- **Icons:** inline SVG line set in `bb-kit.jsx` (`PATHS`); swap for the codebase's icon lib
  (Lucide matches the style) keeping names/metaphors.
- **Maps:** `TerrainMap` is a stylized placeholder; integrate a real map provider on Discover
  (pins, hover/select sync, peek card, zoom, radius circle).
- **Fonts:** Bricolage Grotesque (display), Geist (body), Geist Mono (mono) — Google Fonts.
- **Logo:** simple paw mark + wordmark (inline SVG in `bb-kit.jsx` / `Barkbound.html`).

---

## Prototype scaffolding to DROP in production
- The black floating **"Replay load" / "Reset"** pill at the bottom of each screen is a
  preview-only dev control — remove it.
- The fake **`localStorage.bb_route` + full-page redirect** navigation — replace with the
  real router.
- In-file **seed data** constants — replace with API/data layer.
- **Babel-in-the-browser + CDN React** — use the project's real build tooling.
- The artificial **load delays** (`setTimeout` skeletons) — replace with real fetch states
  (keep the skeleton designs).

---

## Files (in `prototypes/`)
- `brand.css` — design tokens + base utilities (**port tokens first**)
- `bb-kit.jsx` — shared kit: icons, TopBar, TerrainMap, Photo, score viz, Crumb, seed data,
  `navTo`/`PAGES`, `CATS`, `confOf`/`CONF_VAR`/`CONF_LABEL`
- `Barkbound.html` — entry splash/redirect (replace with router)
- `Trips.html` + `bb-home-final.jsx` + `bb-home-final-app.jsx` + `bb-modals.jsx` — Trips gallery + Create-Trip modal
- `Trip Detail.html` + `bb-trip-final.jsx` + `bb-trip-final-app.jsx` — editable itinerary
- `Stop Detail.html` + `bb-stop-final.jsx` + `bb-stop-final-app.jsx` — Discover (search + results)
- `Place Detail.html` + `bb-place-final.jsx` + `bb-place-final-app.jsx` — Place Detail

To preview any screen, open its HTML file in a browser (they load React + Babel from CDN).
Navigation between them works via the `localStorage` shim.

---

## Open questions / not yet designed
- **Mobile / responsive** layouts (current designs are desktop-first).
- **Real map** provider + interactions on Discover.
- **Cover-photo picker** UX (curated set vs. upload) for trip creation.
- **PawSignal** real scoring source/algorithm and the Place Detail evidence schema.
- **Auth / accounts**, sharing, and any collaborative editing of trips.
