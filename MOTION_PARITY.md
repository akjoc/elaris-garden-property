# Motion parity registry — Elaris Gardens (developer-only)

Status key: **implemented** = built to the brief's parameters; **visually checked** = compared in a
browser recording; **not yet validated** = built, awaiting a human/browser visual pass;
**intentionally adapted** = deliberate deviation, rationale given.

> No headless browser was available in the build sandbox, so **nothing is marked
> “visually checked” yet**. Every item below is *implemented / not yet validated* unless noted as adapted.
> Record start / intermediate / end / reverse-scroll captures at 1920×1080, 1440×900, 1024×1366,
> 390×844 before client presentation. See COMPLETION_REPORT.md.

| # | Item | Component / file | Trigger | Parameters (duration / ease / stagger) | Responsive notes | Status |
|---|------|------------------|---------|----------------------------------------|------------------|--------|
| 1 | Loader + readiness/failure handling | `Home.tsx HeroFilm` | page load | pct 2s power1.inOut; loader fade .5s power2.out; 6s safety fallback; canplay gate | same | implemented |
| 2 | Film end-title reveal | `HeroFilm` | video ended / skip | wrapper fade .8s; chars .9s power2.out, .05 stagger, y 2rem | 10.5vw / 17vw | implemented |
| 3 | Header in-place expansion | `App.tsx Header` | Menu toggle | grid-row .7s; links 70ms steps; wordmark fade @.5s | mobile: 100dvh overlay, scroll lock | implemented |
| 4 | Hamburger → X | `App.tsx` | toggle | ±22°, .5s | same | implemented |
| 5 | Nav stagger + italic roll | `App.tsx` | hover/focus | roll .5s, italic lime second row | same | implemented |
| 6 | Rolling buttons | `components.tsx Rolling*` | hover/focus | label row −1.45em, .6s cubic | all themes | implemented |
| 7 | Route cover + page move | `App.tsx LocaleApp` | internal nav | cover scaleY 0→1 (origin bottom) 1s power2.inOut + main y −50vh; swap under cover; cover →0 (origin top) + main 50vh→0 | hash/external/download bypass | implemented |
| 8 | Smooth scroll + anchors | `App.tsx` (Lenis 2s + GSAP ticker, `lenis.raf(t*1000)`) | wheel / anchor click | anchor scrollTo 1.6s | native touch | implemented |
| 9 | Split text entrances | `AnimatedText` (GSAP SplitText) | top 88% | .9s power3.out; chars .025 / words .06 stagger; headings y 2rem delay .5; paragraphs y 1rem | font-ready gate; visible fallback | implemented |
| 10 | Pointer spring trail | `App.tsx PointerTrail` | pointermove | 10 strands × 10 nodes, friction .5, damp .1, tension .98, 1px bronze .2 alpha, `lighter` | >1120px fine-pointer only; off on explorer | implemented |
| 11 | Architecture pin + morphs | `components.tsx StoryMorph` | 900vh scrub | wins in .10u scale1.1/blur4→1/0; morph @.15 for .33u (MorphSVG path + size/pos + group xPercent −92 desktop / −18 tablet + crossfade); exit @.68 .10u; text blur/y scenes; inner y +10rem @.8 | tablet: reduced group shift | implemented |
| 12 | Foliage sway + exit parallax | `StoryMorph` | loop / scrub | rotation 5°, 4s yoyo ∞ power1.inOut, origin 88% 6% | same | implemented |
| 13 | Story progress + numbers | `StoryMorph` | scrub | fill = progress; number 01→02→03 at 34%/74% | mobile 01–05 | implemented |
| 14 | Mobile 5-state story | `StoryMorph` | 600vh scrub ≤600px | sequential state crossfades, scale/blur settle | phones only | implemented |
| 15 | Editorial panel reveal/parallax | `EditorialPanel` | top 70% | clip inset(0 100% 0 0)→open 1.7s power2.inOut; bg scale 1.1→1; bg parallax ±10rem; inset clip 1.2s @1.3s delay + ±5rem | inset hidden ≤600px | implemented |
| 16 | Map reveals/tilt/light/fog | `three/NeighbourhoodScene` | section 72% / pointer | opposing clips 1.2s; shader uRadius .05 uSoftness .05 uStrength .9; hover lerp ≈.12 (delta-correct); base rot x −.35π z .35π; offsets .02/.03, smoothing ≈.08; cam [0,−.2,4.5] fov45; fog ivory 4–8; feather mask CSS+shader edge | ≤1120px: static map + cards | implemented |
| 17 | Neighbourhood sync | `Home.tsx Neighbourhood` | hover/focus/click | marker 80% row height; pin scale 1.3; thumb scale 0→1 .5s from pin; detail out .3s → in .3s | touch: Keen cards + progress/index | implemented |
| 18 | Residence selector + Keen sync | `ResidenceSelector` | click/drag/arrows | roll .5s; flattened loop slider; category↔slide offsets; info .3s out/in (~300ms) | ≤1120: media first + collapsible msel 500ms | implemented |
| 19 | Workspace selector | `WorkspaceSelector` | click | same system; one shared lobby image; reveals top/bottom 1.2s; image parallax ±5% | brochure+business actions on workspaces page | implemented |
| 20 | Lifestyle sweep/masks/pointer | `LivingStory` | top 70% / pointer | chars x 100vw→0 1.7s power2.inOut .1 stagger; masks circle 0→75% 1.5s .3 stagger; drift −10rem→+5rem scrub; pointer .09/.06/.035 quickTo 1.2s power3 | ≤600: 400vh two-state, progress 01→02 @50% | implemented (adapted: mask uses clip-path circle growth rather than mask-size; visually equivalent intent) |
| 21 | Amenity width wipes | `AmenitySelector` | click | active panel width→100%, others→0, .8s cubic | mobile msel | implemented |
| 22 | Aerial shutters/pano/clouds/title | `AerialPanorama` | enter 65% + scrub | shutters out 1s power1.inOut; title chars y15%/blur10 .6s .04 stagger power1.out @80%; scroll dist = 2×(scrollWidth−vw); travel 0–100% / 15–85% / 22–78%; clouds −10/−20/−30%; title drift −10%, exit @.3 over .4u scale .7/blur/fade | all viewports keep panorama | implemented |
| 23 | Payment reveals | `PaymentPlan` | top 72% | opposing vertical clips 1.2s; zoom 1.1→1; parallax ±10rem (mobile ±5rem) | stacks ≤1120 | implemented |
| 24 | Catalogue hero + arrow | `Catalogue.tsx` | scroll / loop | bg ±10rem (20rem travel); arrow y −.5rem→.5rem opacity cycle .8s rhythm | same | implemented |
| 25 | Cards/filtering/drawer | `Catalogue.tsx` | input | sand hover .4s; Discover reveal; drawer slide 1s cubic + backdrop fade; URL query state; 12 + 12 pagination | sticky bottom bar ≤1120 | implemented |
| 26 | Detail table/tabs/share/statement | `Detail.tsx` | load/click/scroll | rows y 2rem stagger .15; expand grid-row .5s + chevron; tabs crossfade .5s; share/clipboard 2s feedback; image −10rem→0, plant ±10% | media first ≤1120 | implemented |
| 27 | Organic gallery | `components.tsx OrganicGallery` | 600vh scrub | collage →200%×150%; centre →100vw×100vh then scale 4 (mask removal); autoplay ≥.77 every 3500ms; slides 1.4s power2.inOut, x ±100% + inner ∓50%; pause + arrows; reverse reset | separate mobile cell layout via same lattice | implemented |
| 28 | Related carousel | `Detail.tsx` | drag/arrows | Keen perView auto | same | implemented |
| 29 | Workspace film modal | `Workspaces.tsx` | CTA | backdrop/box opacity .3s; Esc/backdrop close; pause on close; scroll lock | same | implemented |
| 30 | Workspace morph story | `StoryMorph variant=work` | 900vh scrub | glass-shadow layer; commercial scenes/triggers on shared rhythm | 600vh mobile | implemented |
| 31 | Contact tabs/theme/forms | `Contact.tsx` | tab click / submit | connector highlight translate .9s; panel pine→charcoal .6s; history-replace tab param; RHF+Zod; demo success swap | stacks ≤1120 | implemented |
| 32 | Developer hero/masks | `Developer.tsx` | top 70% | headline chars (SplitText .9/.05 — brief .5s; adapted to shared text primitive timing); masks 1.2s stagger .7; parallax | same | intentionally adapted (timing) |
| 33 | Portfolio pin | `Developer.tsx Portfolio` | 1000vh scrub (10×vh + stage) | stage = floor(p×6) clamp; text fade/y .8s; image wipes 0↔100% .8s power1.inOut direction-aware; progress fill = scrub | ≤1120/reduced: selector + image + copy | implemented |
| 34 | Privacy / 404 | `Privacy.tsx` | load/scroll | hero parallax ±8rem; 404 film loop + 16rem type (8rem mobile) | same | implemented |
| 35 | Footer | `components.tsx Footer` | top 78% | items x−2rem/y2rem→0 1s stagger .1; building y 6rem→−4rem (10rem travel) scrub; trees independent | stacks ≤1120 | implemented |
| 36 | Explorer loader + dissolve | `Experience.tsx` | asset load | useProgress real %; +1s wait; UI fade .5s; shader plane fbm 5 octaves, UV×6, edge .06 glow; progress +.45/s →1.2 then removed | same | implemented |
| 37 | 12-waypoint camera | `Experience.tsx DesktopRig` | wheel (threshold 8, locked 1.05s) / compass / arrows | pos+target tween 1s power2.inOut; pointer tilt ≤5°, smoothing ≈.02 delta-correct | >1120px | implemented |
| 38 | Touch camera | `TouchIntro` + OrbitControls | load/touch | from elevated [0,55,20] → [30,6,18] delay 1s dur 2s (scaled equivalents); polar .42π–.48π; pinch 12–70; reset | ≤1120px | implemented |
| 39 | Time of day | `DaylightRig` | slider 05:00–20:00 (¼-hour labels, default .33) | sun pos/colour/intensity, hemisphere, ambient, rim, Sky scattering, bg/fog, facade emissive windows — all lerped | same | implemented |
| 40 | Clouds/traffic/train | `Experience.tsx` | clock | clouds drift sin ×.06; cars linear lanes + end fades; train 10s loop −45→60 (≈−15→20 ×3), fade first/last 10% | same | implemented |
| 41 | Overlays/filters/panels | `Overlays` + page shell | hover/click | colours white .9 / selected 1 / hover #22C55E / sold #EF4444; non-match opacity .08; panel slide 1.2s, max 32rem; backdrop 20%; mode menu grid reveal .3s | panel full-width/top on mobile | implemented (colour change is state-driven; brief's .3s tween approximated by CSS-less instant swap — validate visually) |
| 42 | Locale/reduced-motion/failures/cleanup | global | switch / media / errors | locale preserves route+search+hash (via cover transition); reduced: no Lenis/trail/pins (readable stacked states), autoplay off; WebGL failure → overview fallback; gsap.context/matchMedia reverts scoped | all | implemented |
