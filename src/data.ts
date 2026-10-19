/* Elaris Gardens — single documented data layer.
   ALL inventory below is fictional, deterministic, illustrative prototype data.
   216 homes (East/West wings × 6 floors × 18) + 48 commercial spaces (30 offices, 18 retail). */

export const brand = {
  name: 'Elaris Gardens',
  wordmark: 'ELARIS GARDENS',
  developer: 'Elaris Development Studio',
  district: 'Eastbank District',
  address: '24 Grove Avenue, Eastbank District',
  email: 'hello@elaris.example',
  telephone: null as string | null,
  languages: ['en', 'fr'] as const,
  defaultLocale: 'en' as const,
};
export type Locale = 'en' | 'fr';
export const isLocale = (v?: string): v is Locale => v === 'en' || v === 'fr';

export type Wing = 'east' | 'west' | 'courtyard';
export type ResCategory = 'studio' | '1bed' | '1study' | '2bed' | '3bed' | '4bed';
export type PropertyKind = 'home' | 'office' | 'retail';

export interface RoomSpec { key: string; area: number }
export interface Property {
  id: string; slug: string; kind: PropertyKind; wing: Wing; floor: number;
  area: number; category?: ResCategory; bedrooms?: number;
  balcony: boolean; garden: boolean; status: 'available' | 'sold';
  planFamily: number; meshId: string; rooms: RoomSpec[]; unitIndex: number;
}

/* ---------- deterministic RNG ---------- */
export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261019);
const pick = (min: number, max: number) => Math.round((min + rnd() * (max - min)) * 2) / 2;

/* ---------- room templates (proportions), scaled so rooms sum EXACTLY to total area ---------- */
const TEMPLATES: Record<ResCategory, [string, number][]> = {
  studio: [['entrance', 3.2], ['bathroom', 4.6], ['utility', 2.1], ['kitchen', 4.4], ['living', 22.6], ['terrace', 4.9]],
  '1bed': [['entrance', 4.1], ['bathroom', 5.2], ['utility', 2.4], ['kitchen', 6.8], ['living', 20.5], ['bedroom1', 12.8], ['terrace', 5.6]],
  '1study': [['entrance', 4.4], ['bathroom', 5.6], ['utility', 2.6], ['kitchen', 7.4], ['living', 22.2], ['bedroom1', 13.4], ['study', 7.2], ['terrace', 6.1]],
  '2bed': [['entrance', 5.0], ['bathroom', 5.8], ['ensuite', 3.9], ['utility', 2.8], ['kitchen', 8.6], ['living', 26.4], ['bedroom1', 14.6], ['bedroom2', 11.2], ['terrace', 7.4]],
  '3bed': [['entrance', 6.2], ['bathroom', 6.4], ['ensuite', 4.6], ['utility', 3.4], ['kitchen', 10.8], ['living', 33.5], ['bedroom1', 16.8], ['bedroom2', 12.6], ['bedroom3', 10.8], ['terrace', 9.2]],
  '4bed': [['entrance', 7.4], ['bathroom', 7.2], ['ensuite', 5.4], ['utility', 4.2], ['kitchen', 13.6], ['living', 42.8], ['bedroom1', 19.4], ['bedroom2', 14.2], ['bedroom3', 12.4], ['bedroom4', 11.0], ['terrace', 11.6]],
};
function buildRooms(cat: ResCategory, total: number, garden: boolean): RoomSpec[] {
  const tpl = TEMPLATES[cat].map(([k, v]) => [garden && k === 'terrace' ? 'garden' : k, v] as [string, number]);
  const sum = tpl.reduce((a, [, v]) => a + v, 0);
  const rooms = tpl.map(([key, v]) => ({ key, area: Math.round((v / sum) * total * 10) / 10 }));
  const drift = Math.round((total - rooms.reduce((a, r) => a + r.area, 0)) * 10) / 10;
  const living = rooms.find((r) => r.key === 'living')!;
  living.area = Math.round((living.area + drift) * 10) / 10;
  return rooms;
}
const AREA_RANGE: Record<ResCategory, [number, number]> = {
  studio: [36, 48], '1bed': [52, 68], '1study': [62, 78], '2bed': [78, 105], '3bed': [105, 140], '4bed': [135, 180],
};
const BEDROOMS: Record<ResCategory, number> = { studio: 0, '1bed': 1, '1study': 1, '2bed': 2, '3bed': 3, '4bed': 4 };
const FAMILY: Record<ResCategory, number[]> = {
  studio: [0, 1], '1bed': [2, 3], '1study': [4, 5], '2bed': [6, 7], '3bed': [8, 9], '4bed': [10, 11],
};

/* Category pool hits the brief totals exactly: 50 / 38 (24+14) / 78 / 30 / 20 = 216 */
const pool: ResCategory[] = [
  ...Array(50).fill('studio'), ...Array(24).fill('1bed'), ...Array(14).fill('1study'),
  ...Array(78).fill('2bed'), ...Array(30).fill('3bed'), ...Array(20).fill('4bed'),
];
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
/* Force E 1.01 to the documented studio exemplar (swap keeps totals intact). */
const firstStudio = pool.indexOf('studio'); [pool[0], pool[firstStudio]] = [pool[firstStudio], pool[0]];

export const residences: Property[] = [];
{
  let p = 0;
  for (const wing of ['east', 'west'] as Wing[]) {
    const W = wing === 'east' ? 'E' : 'W';
    for (let floor = 1; floor <= 6; floor++) {
      for (let u = 1; u <= 18; u++, p++) {
        const cat = pool[p];
        const garden = floor === 1 && u % 3 === 0;
        const balcony = !garden && u % 5 !== 0;
        const isExemplar = wing === 'east' && floor === 1 && u === 1;
        const area = isExemplar ? 41.8 : pick(...AREA_RANGE[cat]);
        const slug = `${W.toLowerCase()}-${floor}-${String(u).padStart(2, '0')}`;
        residences.push({
          id: `${W} ${floor}.${String(u).padStart(2, '0')}`, slug, kind: 'home', wing, floor, area,
          category: cat, bedrooms: BEDROOMS[cat], balcony, garden,
          status: (p * 7 + 3) % 17 === 0 ? 'sold' : 'available',
          planFamily: FAMILY[cat][u % 2], meshId: `unit-${slug}`, unitIndex: u,
          rooms: isExemplar
            ? [{ key: 'entrance', area: 3.2 }, { key: 'bathroom', area: 4.6 }, { key: 'utility', area: 2.1 }, { key: 'kitchen', area: 4.4 }, { key: 'living', area: 22.6 }, { key: 'terrace', area: 4.9 }]
            : buildRooms(cat, area, garden),
        });
      }
    }
  }
}

/* ---------- commercial: 30 offices (10/wing) + 18 ground retail ---------- */
export const commercial: Property[] = [];
{
  const officeRooms = (a: number): RoomSpec[] => [
    { key: 'openplan', area: Math.round(a * 0.62 * 10) / 10 }, { key: 'meeting', area: Math.round(a * 0.16 * 10) / 10 },
    { key: 'focus', area: Math.round(a * 0.1 * 10) / 10 }, { key: 'kitchenette', area: Math.round(a * 0.05 * 10) / 10 },
    { key: 'facilities', area: Math.round((a - Math.round(a * 0.62 * 10) / 10 - Math.round(a * 0.16 * 10) / 10 - Math.round(a * 0.1 * 10) / 10 - Math.round(a * 0.05 * 10) / 10) * 10) / 10 },
  ];
  (['east', 'west', 'courtyard'] as Wing[]).forEach((wing) => {
    const W = wing === 'east' ? 'E' : wing === 'west' ? 'W' : 'C';
    for (let i = 1; i <= 10; i++) {
      const floor = ((i - 1) % 3) + 1; const area = pick(60, 480);
      const slug = `${W.toLowerCase()}${floor}-of${i}`;
      commercial.push({
        id: `${W}${floor}.OF${i}`, slug, kind: 'office', wing, floor, area, balcony: false, garden: false,
        status: i % 9 === 0 ? 'sold' : 'available', planFamily: 12 + (i % 3), meshId: `unit-${slug}`,
        unitIndex: i, rooms: officeRooms(area),
      });
    }
  });
  (['east', 'west'] as Wing[]).forEach((wing) => {
    const W = wing === 'east' ? 'E' : 'W';
    for (let i = 1; i <= 9; i++) {
      const area = pick(42, 220); const slug = `${W.toLowerCase()}-rt${i}`;
      commercial.push({
        id: `${W}.RT${i}`, slug, kind: 'retail', wing, floor: 0, area, balcony: false, garden: false,
        status: 'available', planFamily: 15 + (i % 2), meshId: `unit-${slug}`, unitIndex: i,
        rooms: [{ key: 'sales', area: Math.round(area * 0.74 * 10) / 10 }, { key: 'store', area: Math.round(area * 0.16 * 10) / 10 }, { key: 'facilities', area: Math.round((area - Math.round(area * 0.74 * 10) / 10 - Math.round(area * 0.16 * 10) / 10) * 10) / 10 }],
      });
    }
  });
}

export const allProperties = [...residences, ...commercial];
export const bySlug = (list: Property[], slug?: string) => list.find((x) => x.slug === slug);
export const areaBounds = (list: Property[]): [number, number] => [
  Math.floor(Math.min(...list.map((x) => x.area))), Math.ceil(Math.max(...list.map((x) => x.area))),
];
export const availability = (cat: ResCategory) => residences.filter((r) => r.category === cat && r.status === 'available').length;

/* ---------- pure filter semantics (unit-tested). OR within a group, AND across groups. ---------- */
export interface HomeFilters { cats: ResCategory[]; area: [number, number]; floor: [number, number]; balcony: boolean; garden: boolean; wings: Wing[] }
export function filterHomes(f: HomeFilters): Property[] {
  return residences.filter((r) =>
    (f.cats.length === 0 || f.cats.includes(r.category!)) &&
    r.area >= f.area[0] && r.area <= f.area[1] && r.floor >= f.floor[0] && r.floor <= f.floor[1] &&
    ((!f.balcony && !f.garden) || (f.balcony && r.balcony) || (f.garden && r.garden)) &&
    (f.wings.length === 0 || f.wings.includes(r.wing)));
}
export interface CommFilters { type: 'all' | 'office' | 'retail'; area: [number, number]; floor: [number, number]; wings: Wing[] }
export function filterCommercial(f: CommFilters): Property[] {
  return commercial.filter((r) =>
    (f.type === 'all' || r.kind === f.type) &&
    r.area >= f.area[0] && r.area <= f.area[1] && r.floor >= f.floor[0] && r.floor <= f.floor[1] &&
    /* "Office wing" constraint applies to offices only; eligible retail remains included. */
    (f.wings.length === 0 || r.kind === 'retail' || f.wings.includes(r.wing)));
}

/* ---------- explorer unit placement (shared by 3D overlays + diagrams) ---------- */
export const BUILDING = { wingHalfLen: 11, wingCentreX: 14, depth: 4.2, floorH: 1.55, floors: 6 };
export function unitPosition(p: Property): { pos: [number, number, number]; w: number } {
  const { wingCentreX, depth, floorH } = BUILDING;
  if (p.kind === 'home') {
    const front = p.unitIndex <= 9; const idx = front ? p.unitIndex - 1 : p.unitIndex - 10;
    const cx = p.wing === 'east' ? wingCentreX : -wingCentreX;
    const x = cx + (idx - 4) * 2.35; const y = 0.85 + (p.floor - 1) * floorH + floorH / 2;
    return { pos: [x, y, front ? depth + 0.06 : -depth - 0.06], w: 2.1 };
  }
  if (p.kind === 'retail') {
    const cx = p.wing === 'east' ? wingCentreX : -wingCentreX;
    return { pos: [cx + (p.unitIndex - 5) * 2.35, 0.42, depth + 0.07], w: 2.1 };
  }
  const cx = p.wing === 'east' ? wingCentreX : p.wing === 'west' ? -wingCentreX : 0;
  const z = p.wing === 'courtyard' ? -depth - 2.4 : depth + 0.07;
  return { pos: [cx + ((p.unitIndex - 1) % 5 - 2) * 3.4, 0.85 + (p.floor - 1) * floorH + floorH / 2, z], w: 3.1 };
}

/* ---------- editorial / catalogue media mapping ---------- */
export const HOME_GALLERY: { cat: ResCategory | 'all'; labelKey: string; images: string[] }[] = [
  { cat: 'studio', labelKey: 'cat.studio', images: ['/images/homes/gallery-01.jpg', '/images/homes/gallery-08.jpg', '/images/homes/gallery-04.jpg'] },
  { cat: '1bed', labelKey: 'cat.1bed', images: ['/images/homes/gallery-02.jpg', '/images/homes/gallery-05.jpg'] },
  { cat: '2bed', labelKey: 'cat.2bed', images: ['/images/homes/gallery-07.jpg', '/images/homes/gallery-03.jpg', '/images/homes/gallery-11.jpg'] },
  { cat: '3bed', labelKey: 'cat.3bed', images: ['/images/homes/gallery-09.jpg', '/images/homes/gallery-12.jpg'] },
  { cat: '4bed', labelKey: 'cat.4bed', images: ['/images/homes/gallery-06.jpg', '/images/homes/gallery-10.jpg'] },
];
export const DETAIL_GALLERY_HOME = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/homes/gallery-${String(n).padStart(2, '0')}.jpg`);
export const DETAIL_GALLERY_WORK = ['/images/work/lobby.jpg', '/images/work/story-01.jpg', '/images/work/story-02.jpg', '/images/work/story-03.jpg', '/images/work/story-04.jpg', '/images/work/panorama.jpg', '/images/editorial/work.jpg', '/images/catalogue/commercial.jpg'];

export interface Place { id: string; x: number; y: number; drive: number; walk: number | null; img: string; name: Record<Locale, string>; desc: Record<Locale, string> }
export const neighbourhood: Place[] = [
  { id: 'rail', x: 0.18, y: 0.28, drive: 2, walk: 5, img: '/images/neighbourhood/01.jpg', name: { en: 'Harbour Rail Exchange', fr: 'Gare du port' }, desc: { en: 'The district interchange brings cross-city rail, tram and cycle routes together under one planted canopy, five minutes from your door. Morning coffee kiosks, a small bookshop and sheltered waiting gardens make everyday journeys feel considered from the very first step.', fr: 'Le pôle d’échange du quartier réunit train, tramway et pistes cyclables sous une canopée végétalisée, à cinq minutes de chez vous. Cafés du matin, petite librairie et jardins d’attente abrités rendent chaque trajet quotidien plus doux dès le premier pas.' } },
  { id: 'campus', x: 0.38, y: 0.70, drive: 3, walk: 7, img: '/images/neighbourhood/02.jpg', name: { en: 'Linden Learning Campus', fr: 'Campus Linden' }, desc: { en: 'A leafy campus of nurseries, schools and evening classes arranged around shared courtyards. Families value the calm walking routes and generous green play spaces, while lifelong learners find language, craft and music studios close to home.', fr: 'Un campus verdoyant de crèches, d’écoles et de cours du soir autour de cours partagées. Les familles apprécient les trajets piétons apaisés et les grands espaces de jeu, et chacun trouve près de chez soi ateliers de langue, d’artisanat et de musique.' } },
  { id: 'galleria', x: 0.62, y: 0.38, drive: 2, walk: 6, img: '/images/neighbourhood/03.jpg', name: { en: 'Eastbank Galleria', fr: 'Galerie Eastbank' }, desc: { en: 'Independent makers, everyday essentials and a light-filled market hall sit along a pedestrian arcade. Weekend flower stalls and small galleries give the Galleria a village rhythm, with everything for the weekly shop an easy stroll away.', fr: 'Artisans indépendants, commerces du quotidien et halle lumineuse bordent une arcade piétonne. Marchés aux fleurs le week-end et petites galeries donnent au lieu un rythme de village, avec toutes les courses hebdomadaires à quelques pas.' } },
  { id: 'meridian', x: 0.78, y: 0.66, drive: 4, walk: 9, img: '/images/neighbourhood/04.jpg', name: { en: 'Meridian Work Quarter', fr: 'Quartier Meridian' }, desc: { en: 'Studios, workshops and growing companies gather in the Meridian blocks, bringing lunchtime energy and evening talks to the district. For residents it means a short, pleasant commute; for businesses, a neighbourhood that is already moving.', fr: 'Studios, ateliers et entreprises en croissance animent les îlots Meridian, du déjeuner aux rencontres du soir. Pour les résidents, un trajet court et agréable ; pour les entreprises, un quartier déjà en mouvement.' } },
  { id: 'glasshouse', x: 0.55, y: 0.20, drive: 3, walk: 8, img: '/images/neighbourhood/05.jpg', name: { en: 'Glasshouse Food Hall', fr: 'Halle Glasshouse' }, desc: { en: 'Bakers, growers and small kitchens trade beneath a restored glass roof. Communal tables, seasonal menus and a terrace over the square make it the neighbourhood living room — equally suited to a quick lunch or a long Saturday morning.', fr: 'Boulangers, producteurs et petites cuisines se retrouvent sous une verrière restaurée. Tables communes, menus de saison et terrasse sur la place en font le salon du quartier, pour un déjeuner rapide comme un long samedi matin.' } },
  { id: 'terminal', x: 0.88, y: 0.18, drive: 18, walk: null, img: '/images/neighbourhood/06.jpg', name: { en: 'International Terminal', fr: 'Terminal international' }, desc: { en: 'Direct road and rail links place the international terminal around eighteen minutes away, keeping wider journeys simple while the district itself stays calm. Arrive home to gardens and quiet streets, however far the day has taken you.', fr: 'Des liaisons routières et ferroviaires directes placent le terminal international à environ dix-huit minutes, pour des voyages simples et un quartier qui reste calme. Vous rentrez vers les jardins et les rues paisibles, où que la journée vous ait mené.' } },
];

export interface Project { name: string; loc: Record<Locale, string>; img: string; desc: Record<Locale, string> }
export const portfolio: Project[] = [
  { name: 'Elaris Gardens', loc: { en: 'Eastbank District', fr: 'Quartier Eastbank' }, img: '/images/developer/project-01.jpg', desc: { en: 'Our current illustrative flagship: two garden wings of homes, workspaces and street retail around a planted courtyard. Pale stone, bronze glazing and sculpted fins give the district a calm new landmark, while roof gardens and shared rooms keep daily life close to nature.', fr: 'Notre projet illustratif actuel : deux ailes-jardins de logements, de bureaux et de commerces autour d’une cour plantée. Pierre pâle, menuiseries bronze et ailettes sculptées offrent au quartier un repère apaisé, tandis que jardins en toiture et espaces partagés rapprochent le quotidien de la nature.' } },
  { name: 'Linden Court', loc: { en: 'North Gardens', fr: 'Jardins du Nord' }, img: '/images/developer/project-02.jpg', desc: { en: 'A courtyard housing study in warm brick and timber, where every home overlooks shared planting. Deep balconies, a residents’ growing garden and a small library room explore how density can still feel personal, quiet and generously green at every level.', fr: 'Une étude d’habitat sur cour en brique chaude et bois, où chaque logement regarde des plantations partagées. Balcons profonds, jardin potager des résidents et petite bibliothèque explorent une densité personnelle, calme et généreusement verte à chaque niveau.' } },
  { name: 'Canal House', loc: { en: 'Old Wharf', fr: 'Vieux Quai' }, img: '/images/developer/project-03.jpg', desc: { en: 'Canal-side apartments imagined above restored boathouse workshops. Tall windows frame the water, while a new towpath café and moorings return the wharf to daily use. Interiors pair pale mineral surfaces with reclaimed timber details throughout.', fr: 'Des appartements au bord du canal, imaginés au-dessus d’ateliers de bateaux restaurés. De hautes fenêtres cadrent l’eau, tandis qu’un café de halage et des amarrages rendent le quai au quotidien. Les intérieurs marient surfaces minérales pâles et bois de réemploi.' } },
  { name: 'North Terrace', loc: { en: 'Hillcrest', fr: 'Colline Nord' }, img: '/images/developer/project-04.jpg', desc: { en: 'A terraced hillside neighbourhood of family homes stepping down toward a pocket park. Each terrace level gains a private garden and long views, with car-free lanes, play streets and a community hall stitched into the slope below.', fr: 'Un quartier de maisons familiales en terrasses descendant vers un petit parc. Chaque niveau profite d’un jardin privé et de vues lointaines, avec ruelles sans voitures, rues de jeu et salle commune inscrites dans la pente.' } },
  { name: 'Orchard Mews', loc: { en: 'Orchard Mile', fr: 'Allée des Vergers' }, img: '/images/developer/project-05.jpg', desc: { en: 'Intimate mews homes arranged around a retained orchard, keeping mature fruit trees at the heart of the plan. Workshops and studios line the lane at ground level, supporting makers while residents share harvests, shade and a slower street rhythm.', fr: 'Des maisons de ruelle autour d’un verger conservé, gardant les fruitiers matures au cœur du plan. Ateliers et studios bordent la voie au rez-de-chaussée, soutenant les artisans pendant que les résidents partagent récoltes, ombre et un rythme plus lent.' } },
  { name: 'Civic Hall', loc: { en: 'Market Square', fr: 'Place du Marché' }, img: '/images/developer/project-06.jpg', desc: { en: 'A civic and community building concept combining a reading room, market hall and evening performance space. A single generous roof shelters flexible rooms that open to the square, testing how public life can anchor a growing district.', fr: 'Un concept d’équipement civique et communautaire réunissant salle de lecture, halle de marché et espace de spectacles du soir. Un grand toit abrite des salles flexibles ouvertes sur la place, pour ancrer la vie publique d’un quartier en croissance.' } },
];

export const AMENITIES = [
  { id: 'sky', img: '/images/amenities/roof.jpg' }, { id: 'fitness', img: '/images/amenities/fitness.jpg' },
  { id: 'parking', img: '/images/amenities/parking.jpg' }, { id: 'dining', img: '/images/amenities/dining.jpg' },
] as const;
export const WORK_WINGS: { id: string; wing: Wing | 'street' }[] = [
  { id: 'east', wing: 'east' }, { id: 'west', wing: 'west' }, { id: 'courtyard', wing: 'courtyard' }, { id: 'street', wing: 'street' },
];
export function workWingCount(id: string): number {
  if (id === 'street') return commercial.filter((c) => c.kind === 'retail' && c.status === 'available').length;
  return commercial.filter((c) => c.kind === 'office' && c.wing === id && c.status === 'available').length;
}
export const PAYMENT = [15, 25, 25, 25, 10] as const;

/* Camera waypoints (baseline from brief, scaled to this model's bounds ×6). */
export const VIEWS: { position: [number, number, number]; lookAt: [number, number, number] }[] = [
  [2, .8, -2, .85], [4.5, .8, -1.5, 2.5], [5, .8, .1, 2.5], [4, .8, 2, 2.5], [2, .8, 2, .85], [0, 1, 2, 0],
  [-2, .8, 2, -.85], [-4, .8, 2, -2.5], [-5, .8, -.1, -2.5], [-4.5, .8, -1.5, -2.5], [-2, .8, -2, -.85], [0, 1, -2, 0],
].map(([x, y, z, lx]) => ({ position: [x * 6, y * 6 + 2, z * 6] as [number, number, number], lookAt: [lx * 6, 3.2, 0] as [number, number, number] }));
