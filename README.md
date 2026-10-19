# Elaris Gardens

A complete React + TypeScript + Vite presentation prototype for the fictional **Elaris Gardens**
mixed-use development (Eastbank District): immersive editorial homepage, working residential and
commercial catalogues (216 homes / 48 spaces), data-driven detail pages, a real Three.js spatial
explorer, EN/FR locales, demo-safe forms, original generated imagery, films, plans and PDFs.

This is an illustrative prototype. All inventory, plans, prices-by-implication and payment stages
are fictional demo data in `src/data.ts`; forms run through an isolated demo adapter and send nothing.

## Quick start
```bash
npm install
npm run dev        # dev server on 0.0.0.0:5173 (→ /en)
npm test           # Vitest: data integrity + filter semantics (14 tests)
npm run build      # tsc --noEmit + vite build → dist/ (SPA, needs /index.html fallback)
npm run preview    # serve the production build
```

## Where things live
| Path | Contents |
|---|---|
| `src/data.ts` | Brand config, deterministic inventory, filters, explorer placement, waypoints |
| `src/i18n.tsx` | EN + FR dictionaries, locale context, `lp()` path helper |
| `src/components.tsx` | Rolling buttons, SplitText, editorial panels, morph story, organic gallery, procedural plan/floor/cutaway SVGs, footer |
| `src/pages/` | Home, Catalogue, Detail, Workspaces, Contact, Developer, Privacy/404, Experience (lazy) |
| `src/three/` | Neighbourhood WebGL map (shader-lit) |
| `src/assetManifest.ts` | Every asset: role, focal point, alt, origin |
| `scripts/make_assets.py` | Regenerates films (ffmpeg), PDFs (reportlab), alpha graphics (Pillow) |
| `MOTION_PARITY.md` | Developer-only motion registry with per-item status |
| `COMPLETION_REPORT.md` | What is implemented / verified / approximated / blocked |

## Rebranding
Change `brand` in `src/data.ts` (name, developer, address, email, locales), swap the symbol in
`public/favicon.svg` + `src/components.tsx` (`Symbol`), and regenerate imagery per the manifest.
Set `brand.telephone` only to a client-approved real number; `null` hides phone actions.

## Notes
- Fonts: Cormorant Garamond (documented approximation of the licensed display face) + Work Sans,
  self-hosted via Fontsource.
- Motion: GSAP (ScrollTrigger, SplitText, MorphSVG — included in current gsap npm releases),
  Lenis, Keen Slider; WebGL: Three.js + React Three Fiber + Drei.
- No trackers, no external requests; everything is served same-origin.
