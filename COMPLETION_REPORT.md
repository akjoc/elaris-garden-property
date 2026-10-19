# Completion report — Elaris Gardens

An honest separation of what is implemented, what is verified, what is approximated, and what remains.

## Implemented (all routes working)
- `/` → `/en`; `/:locale` home (all 13 beats H1–H13 + footer), `experience`, `residences`,
  `residences/:slug` (×216), `workspaces`, `commercial`, `commercial/:slug` (×48),
  `contact` (+ `?tab=` / `?property=`), `developer`, `privacy`, designed 404 (incl. unknown slugs).
  Anchors `/:locale#neighbourhood` and `#amenities` work same-route, cross-route, direct-load.
- **Data**: deterministic fictional inventory — 216 homes (50 studio / 38 one-bed incl. study /
  78 two-bed / 30 three-bed / 20 four-bed; E/W × 6 floors × 18) and 48 commercial (30 offices
  10/wing + 18 retail). Room areas sum exactly to totals (E 1.01 = documented 41.80 m² exemplar).
  Plans, floor diagrams and isometric cutaways are procedural SVGs generated from that data —
  12 residential plan families (mirrored variants) + office/retail families. Payment 15/25/25/25/10.
- **Filters** share one tested semantics module (OR within group, AND across; commercial
  “Office wing” never excludes retail) across catalogues *and* the 3D explorer. URL query state,
  12+12 pagination, empty/reset states, mobile drawer + sticky bar.
- **Forms**: RHF + Zod, three contact tabs (history-replace), business theme shift, property
  context, consents never pre-selected, isolated demo adapter with truthful
  “Preview only — no message was sent”, nothing stored, no external endpoints.
- **Downloads/share**: original project-guide + workspace-brochure PDFs; per-property PDF
  generated client-side (jsPDF) with correct data/metadata; `navigator.share` → clipboard
  “Link copied” (2s) → prompt fallback; AbortError ignored.
- **Explorer**: real R3F scene — procedural twin-wing development (pale stone canvas-textured
  facades, seeded emissive windows, sculpted fins, glazed connector, roof planting), context
  blocks/trees/people, cars, 10s train, 5 cloud groups, Sky + full daylight rig (05:00–20:00),
  12 GSAP camera waypoints with wheel-locking + compass + keyboard + pointer tilt, touch orbit
  intro, noise-dissolve shader reveal, per-unit overlays 1:1 with the dataset, filters + ivory
  property panel with plan tabs. WebGL-failure fallback with catalogue links.
- **i18n**: full EN + FR dictionaries; locale switch preserves route, property and query.
- **Tests**: 14 Vitest unit tests (totals, uniqueness, room sums, filter semantics, mesh mapping) — passing.
- **Build**: `npm run build` passes; explorer, map, SplitText and jsPDF are code-split.
  SPA fallbacks included (`public/_redirects`, `vercel.json`). Assets: 80/80 referenced files exist;
  zero `localhost`/external URLs in source; fonts self-hosted via Fontsource.

## Verified vs not yet validated
- **Verified mechanically**: TypeScript, unit tests, production build, asset existence,
  HTTP 200 for every route/asset class against the production preview.
- **Not visually validated**: no headless browser exists in the build sandbox, so no screenshot or
  recording comparison has been made. All motion is *implemented / not yet validated* per
  MOTION_PARITY.md. Before presenting to a client, capture recordings at 1920×1080, 1440×900,
  1024×1366, 390×844 (+ a narrow phone), a touch configuration, reduced-motion, WebGL-off and
  slow-media runs, and walk every pinned sequence forwards *and* backwards.
- The explorer is therefore **built but not yet visually validated** — treat its current framing,
  waypoint tuning and overlay legibility as a first pass to check in a real browser.

## Documented approximations
- **Typography**: PP Editorial Old was not supplied/licensed, so self-hosted **Cormorant Garamond**
  (light/regular/italic) approximates it, per the brief. Work Sans is self-hosted. Do not claim
  typographic identity.
- **Imagery**: the build turn allowed **10 image generations**; 10 original masters were generated
  (anchor exterior, story exterior/interiors, location/homes/work/amenities editorials, two home
  interiors). Remaining photographic roles are **documented crops/flops/treatments of those same
  originals** (see `src/assetManifest.ts`, `origin: 'derived-crop'`), plus procedural SVG/PNG
  graphics. Next pass should generate dedicated masters for: bedroom, kitchen/dining, true lobby,
  6 neighbourhood places, fitness, parking, true top-down aerial, office hero/corridor/portrait,
  contact passer-by, developer desk/projects 2–6, 404 scene — then re-derive crops.
- **Films**: no commissioned footage was available. The nine MP4s are original slow-push-in
  (“Ken Burns”) renders from the generated stills via `scripts/make_assets.py` — correct length/
  pacing/roles, replaceable with commissioned footage of the new building. `arrival-mobile` is
  MP4 only (no WebM encode). No audio, no branding, posters generated.
- **3D model**: procedural Three.js construction (no GLB export this pass) — see
  `public/models/README.txt`. Wing side/roof faces share the facade texture; context and figures
  are deliberately low-contrast masses.
- **Small intentional deviations** (all logged in MOTION_PARITY.md): developer headline uses the
  shared text-primitive timing; lifestyle masks grow via `clip-path: circle` rather than
  `mask-size`; explorer overlay colour swaps are state-driven rather than .3s tweened; route
  transitions scroll to top on back-navigation (anchors still restore); footer building is a
  CSS-masked render rather than an alpha cutout.
- **Reduced motion** is honoured (no Lenis/trail/pins/autoplay; stacked readable story/portfolio/
  gallery states), and **content remains visible if animation init fails** (all `fromTo` patterns,
  SplitText guarded by try/catch).

## Identity & legal posture
Identity, copy, mark, map, plans, PDFs, filenames, metadata, storage keys (none used), share
payloads and contact details are original (`hello@elaris.example`; `telephone: null` hides phone
actions; no social links configured). Nothing requests the reference host. This removes accidental
references; as the brief itself notes, it cannot guarantee a similar design is “untraceable”, and
no such promise is made. The private audit/recordings were never placed in the app.

## Run
```bash
npm install
npm run dev      # http://localhost:5173 → /en
npm test         # 14 unit tests
npm run build    # typecheck + production build to dist/
python3 scripts/make_assets.py   # regenerate films/PDFs/alpha assets (needs pillow, imageio-ffmpeg, reportlab)
```
Deploy `dist/` behind any static host with SPA fallback to `/index.html`
(`_redirects` for Netlify-style hosts, `vercel.json` rewrites included).
