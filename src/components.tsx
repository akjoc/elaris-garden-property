import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import * as Slider from '@radix-ui/react-slider';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useI18n, fmtArea } from './i18n';
import {
  brand, type Property, type ResCategory, type Wing, areaBounds, residences, commercial,
} from './data';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);
export { gsap, ScrollTrigger };

export const REDUCED = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}
/** Isolated demo submission adapter — never contacts a server. */
export const demoSubmit = () => new Promise<void>((r) => setTimeout(r, 700));

export function Symbol({ color = '#A68150' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <path d="M22 62V34a18 18 0 0 1 36 0v28" fill="none" stroke={color} strokeWidth="2.4" />
      <path d="M30 36h20M30 45h15M30 54h20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Rolling button ---------------- */
export function RollLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="roll">
      <span>{children}<i className="arrow" aria-hidden="true">→</i></span>
      <span aria-hidden="true">{children}<i className="arrow">→</i></span>
    </span>
  );
}
export function RollingLink({ to, children, theme = 'onLight', className = '', download, onClick }: {
  to: string; children: React.ReactNode; theme?: string; className?: string; download?: boolean; onClick?: () => void;
}) {
  const cls = `rbtn ${theme} ${className}`;
  if (download || to.startsWith('/documents') || to.startsWith('http'))
    return <a className={cls} href={to} download={download} onClick={onClick}><RollLabel>{children}</RollLabel></a>;
  return <Link className={cls} to={to} onClick={onClick}><RollLabel>{children}</RollLabel></Link>;
}
export function RollingButton({ children, theme = 'onLight', className = '', type = 'button', disabled, onClick }: {
  children: React.ReactNode; theme?: string; className?: string; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void;
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`rbtn ${theme} ${className}`}><RollLabel>{children}</RollLabel></button>;
}

/* ---------------- Split / animated text ---------------- */
export function AnimatedText({ text, as: Tag = 'h2', className = '', split = 'words', delay = 0.5, y = '2rem' }: {
  text: string; as?: any; className?: string; split?: 'words' | 'chars'; delay?: number; y?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    let splitInst: any; let tween: gsap.core.Tween | undefined; let cancelled = false;
    document.fonts?.ready.then(async () => {
      if (cancelled || !ref.current) return;
      try {
        const { SplitText } = await import('gsap/SplitText');
        gsap.registerPlugin(SplitText);
        splitInst = new (SplitText as any)(el, { type: split === 'chars' ? 'chars' : 'words', aria: 'auto' });
        const parts = split === 'chars' ? splitInst.chars : splitInst.words;
        tween = gsap.fromTo(parts, { y, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay,
          stagger: split === 'chars' ? 0.025 : 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      } catch { /* content remains visible */ }
    });
    return () => { cancelled = true; tween?.scrollTrigger?.kill(); tween?.kill(); splitInst?.revert?.(); };
  }, [text, split, delay, y]);
  return <Tag ref={ref} className={className}>{text}</Tag>;
}
export function RevealPara({ text, className = '' }: { text: string; className?: string }) {
  return <AnimatedText text={text} as="p" className={className} split="words" delay={0.15} y="1rem" />;
}

/* ---------------- Lazy video (pauses offscreen / hidden tab) ---------------- */
export function LazyVideo({ src, poster, className, once = false, onEnded, controls = false, label }: {
  src: string; poster?: string; className?: string; once?: boolean; onEnded?: () => void; controls?: boolean; label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      setNear(e.isIntersecting);
      if (!controls) { if (e.isIntersecting && !document.hidden) v.play().catch(() => {}); else v.pause(); }
    }, { rootMargin: '300px' });
    io.observe(v);
    const vis = () => { if (document.hidden) v.pause(); };
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [controls]);
  return (
    <video ref={ref} className={className} muted={!controls} loop={!once && !controls} playsInline preload={near ? 'auto' : 'none'}
      poster={poster} src={near || once ? src : undefined} onEnded={onEnded} controls={controls} aria-label={label} />
  );
}

/* ---------------- Editorial full-screen panel (H3/H5/H7/H10 shared) ---------------- */
export function EditorialPanel({ id, bg, bgPos = 'center', kicker, title, body, inset, insetPos = 'pos-ur', tone = '', bodySide = '', children }: {
  id?: string; bg: string; bgPos?: string; kicker: string; title: string; body: string;
  inset?: string; insetPos?: string; tone?: string; bodySide?: string; children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      const clip = el.querySelector('.ed-clip'); const bgel = el.querySelector('.ed-bg'); const ins = el.querySelector('.ed-inset');
      gsap.fromTo(clip, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.7, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 70%' } });
      gsap.fromTo(bgel, { scale: 1.1 }, { scale: 1, duration: 1.7, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 70%' } });
      gsap.fromTo(bgel, { y: '-10rem' }, { y: '10rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      if (ins) {
        gsap.fromTo(ins, { clipPath: 'inset(0 100% 0 0)', scale: 1.1 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: 1.2, delay: 1.3, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 70%' } });
        gsap.fromTo(ins, { y: '-5rem' }, { y: '5rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} id={id} className="edpanel">
      <div className="ed-clip"><div className="ed-bg" style={{ backgroundImage: `url(${bg})`, backgroundPosition: bgPos }} /></div>
      <div className="ed-shade" />
      {inset && <div className={`ed-inset ${insetPos}`}><LazyVideo src={inset} label="" /></div>}
      <div className={`ed-content ${tone}`}>
        <p className="kicker lime">{kicker}</p>
        <AnimatedText text={title} split="words" />
        <div style={{ display: 'flex', marginTop: '2rem' }}>
          <div className={`ed-body ${bodySide}`}><RevealPara text={body} />{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Procedural plan / floor / cutaway SVGs ---------------- */
const PLAN_COLORS = ['#F4F0DB', '#EFE7CB', '#FBF8EC', '#E7EBD9', '#F7F1DE', '#EDF0E2'];
export function PlanSVG({ p, showLabels = true }: { p: Property; showLabels?: boolean }) {
  const { t } = useI18n();
  const Wd = 420, Ht = 330, pad = 14;
  const rooms = p.rooms.filter((r) => r.key !== 'terrace' && r.key !== 'garden');
  const outdoor = p.rooms.find((r) => r.key === 'terrace' || r.key === 'garden');
  const innerW = Wd - pad * 2, innerH = Ht - pad * 2 - (outdoor ? 44 : 0);
  /* simple 2-row treemap, widths ∝ sqrt(area) for legibility */
  const half = Math.ceil(rooms.length / 2);
  const rows = [rooms.slice(0, half), rooms.slice(half)];
  const rects: { x: number; y: number; w: number; h: number; r: typeof rooms[0]; i: number }[] = [];
  rows.forEach((row, ri) => {
    const tot = row.reduce((a, r) => a + Math.sqrt(r.area), 0); let x = pad;
    const h = innerH / 2; const y = pad + ri * h;
    row.forEach((r) => { const w = (Math.sqrt(r.area) / tot) * innerW; rects.push({ x, y, w, h, r, i: rects.length }); x += w; });
  });
  const flip = p.planFamily % 2 === 1;
  return (
    <svg viewBox={`0 0 ${Wd} ${Ht}`} role="img" aria-label={`${p.id} ${t('p.layout')}`} style={{ width: '100%', height: 'auto', transform: flip ? 'scaleX(-1)' : undefined }}>
      <rect x="4" y="4" width={Wd - 8} height={Ht - 8} rx="10" fill="#fffef8" stroke="#A68150" strokeWidth="2.5" />
      {rects.map(({ x, y, w, h, r, i }) => (
        <g key={i}>
          <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} fill={PLAN_COLORS[i % PLAN_COLORS.length]} stroke="#8a7a52" strokeWidth="1.6" />
          <path d={`M ${x + w - 4} ${y + h - 26} A 22 22 0 0 1 ${x + w - 26} ${y + h - 4}`} fill="none" stroke="#A68150" strokeWidth="1.2" />
          <line x1={x + 8} y1={y + 5} x2={x + Math.min(w - 8, 52)} y2={y + 5} stroke="#314759" strokeWidth="3.4" />
          {showLabels && w > 52 && (
            <g style={{ transform: flip ? 'scaleX(-1)' : undefined, transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}>
              <text x={x + w / 2} y={y + h / 2 - 3} textAnchor="middle" fontSize="11.5" fill="#2E3A26" fontFamily="Work Sans,sans-serif">{t(`room.${r.key}`)}</text>
              <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize="10.5" fill="#A68150" fontStyle="italic" fontFamily="Georgia,serif">{r.area.toFixed(1)} m²</text>
            </g>
          )}
        </g>
      ))}
      {outdoor && (
        <g>
          <rect x={pad} y={pad + innerH + 6} width={innerW} height="36" fill="#dfe8cc" stroke="#60735C" strokeWidth="1.6" />
          <text x={Wd / 2} y={pad + innerH + 29} textAnchor="middle" fontSize="11.5" fill="#2E3A26" style={{ transform: flip ? 'scaleX(-1)' : undefined, transformOrigin: `${Wd / 2}px ${pad + innerH + 24}px` }}>{t(`room.${outdoor.key}`)} · {outdoor.area.toFixed(1)} m²</text>
        </g>
      )}
    </svg>
  );
}
export function FloorDiagram({ p }: { p: Property }) {
  const { t } = useI18n();
  const wingX = p.wing === 'east' ? 250 : p.wing === 'west' ? 30 : 160;
  const wingW = p.wing === 'courtyard' ? 110 : 200;
  const perRow = 9; const idx = (p.unitIndex - 1) % perRow; const row = p.unitIndex > 9 ? 1 : 0;
  const cw = wingW / perRow;
  const cells = [];
  for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < perRow; i++)
    cells.push(<rect key={`${r2}-${i}`} x={30 + i * (200 / perRow)} y={70 + r2 * 34} width={200 / perRow - 3} height="30" fill="#efe9d2" stroke="#cbbd93" />);
  const cellsE = [];
  for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < perRow; i++)
    cellsE.push(<rect key={`e${r2}-${i}`} x={250 + i * (200 / perRow)} y={70 + r2 * 34} width={200 / perRow - 3} height="30" fill="#efe9d2" stroke="#cbbd93" />);
  return (
    <svg viewBox="0 0 480 240" role="img" aria-label={`${p.id} — ${t('p.floor')} ${p.floor}`} style={{ width: '100%', height: 'auto' }}>
      <rect x="24" y="58" width="212" height="92" rx="8" fill="#fbf8ec" stroke="#A68150" strokeWidth="2" />
      <rect x="244" y="58" width="212" height="92" rx="8" fill="#fbf8ec" stroke="#A68150" strokeWidth="2" />
      <rect x="228" y="86" width="24" height="36" fill="#dfe8cc" stroke="#60735C" />
      {cells}{cellsE}
      <rect x={wingX + idx * cw} y={70 + row * 34} width={cw - 3} height="30" fill="#2E3A26" />
      <text x="130" y="40" textAnchor="middle" fontSize="13" fill="#60735C" fontFamily="Georgia,serif" fontStyle="italic">{t('wing.west')}</text>
      <text x="350" y="40" textAnchor="middle" fontSize="13" fill="#60735C" fontFamily="Georgia,serif" fontStyle="italic">{t('wing.east')}</text>
      <text x="240" y="196" textAnchor="middle" fontSize="14" fill="#2E3A26" fontFamily="Georgia,serif">{p.id} · {t('p.floor')} {p.floor}</text>
      <text x="240" y="216" textAnchor="middle" fontSize="10.5" fill="#A68150">Grove Avenue ↓</text>
    </svg>
  );
}
export function Cutaway({ p }: { p: Property }) {
  /* Original isometric cutaway derived from the same room data (no baked text). */
  const rooms = p.rooms.filter((r) => r.key !== 'terrace' && r.key !== 'garden');
  const iso = (x: number, y: number, z = 0): [number, number] => [210 + (x - y) * 26, 90 + (x + y) * 13 - z * 30];
  const cols = 3; const cells: React.ReactNode[] = [];
  rooms.slice(0, 9).forEach((r, i) => {
    const cx = i % cols, cy = Math.floor(i / cols); const s = 0.92;
    const pts = [iso(cx, cy), iso(cx + s, cy), iso(cx + s, cy + s), iso(cx, cy + s)].map((q) => q.join(',')).join(' ');
    const top = [iso(cx, cy, 1), iso(cx + s, cy, 1), iso(cx + s, cy + s, 1), iso(cx, cy + s, 1)].map((q) => q.join(',')).join(' ');
    cells.push(
      <g key={i}>
        <polygon points={pts} fill={PLAN_COLORS[i % PLAN_COLORS.length]} stroke="#A68150" strokeWidth="1.4" />
        <polygon points={`${iso(cx, cy + s).join(',')} ${iso(cx + s, cy + s).join(',')} ${iso(cx + s, cy + s, 1).join(',')} ${iso(cx, cy + s, 1).join(',')}`} fill="#e8dfc2" stroke="#A68150" />
        <polygon points={`${iso(cx + s, cy).join(',')} ${iso(cx + s, cy + s).join(',')} ${iso(cx + s, cy + s, 1).join(',')} ${iso(cx + s, cy, 1).join(',')}`} fill="#f4eed6" stroke="#A68150" />
        <polygon points={top} fill="none" stroke="#A68150" strokeDasharray="3 4" opacity=".55" />
      </g>);
  });
  return (
    <svg viewBox="0 0 420 300" role="img" aria-label={`${p.id} 3D`} style={{ width: '100%', height: 'auto' }}>
      <ellipse cx="210" cy="262" rx="150" ry="20" fill="#000" opacity=".07" />{cells}
    </svg>
  );
}

/* ---------------- Property card ---------------- */
export function PropertyCard({ p, base }: { p: Property; base: string }) {
  const { t, lp, locale } = useI18n();
  return (
    <Link className="pcard" to={lp(`${base}/${p.slug}`)} aria-label={`${p.id} — ${fmtArea(p.area, locale)}`}>
      {p.status === 'sold' && <span className="sold">{t('p.sold')}</span>}
      <div className="planbox"><PlanSVG p={p} showLabels={false} /></div>
      <div className="pid">{p.id}</div>
      <div className="meta">
        <span>{fmtArea(p.area, locale)}</span>
        <span>{t('p.floor')} {p.floor}</span>
        {p.kind === 'home' ? <span>{p.bedrooms === 0 ? t('cat.studio') : `${p.bedrooms} ${p.bedrooms! > 1 ? t('p.beds') : t('p.bed')}`}</span>
          : <span>{p.kind === 'office' ? t('p.office') : t('p.retail')}</span>}
        <span>{t(`wing.${p.wing}`)}</span>
      </div>
      <div className="ficons">
        {p.balcony && <span>▭ {t('f.balcony')}</span>}{p.garden && <span>❀ {t('f.garden')}</span>}
      </div>
      <span className="disc">{t('cta.discover')} →</span>
    </Link>
  );
}

/* ---------------- Dual range (Radix) ---------------- */
export function DualRange({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; format?: (n: number) => string;
}) {
  const f = format ?? ((n: number) => String(n));
  return (
    <div className="rng">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '.9rem' }}>{label}</span><span className="rng-val">{f(value[0])} – {f(value[1])}</span>
      </div>
      <Slider.Root className="RadixSlider" min={min} max={max} step={1} value={[value[0], value[1]]}
        onValueChange={(v) => onChange([v[0], v[1]])} aria-label={label}>
        <Slider.Track className="track"><Slider.Range className="range" /></Slider.Track>
        <Slider.Thumb className="thumb" aria-label={`${label} min`} /><Slider.Thumb className="thumb" aria-label={`${label} max`} />
      </Slider.Root>
    </div>
  );
}
export const RES_BOUNDS = areaBounds(residences);
export const COM_BOUNDS = areaBounds(commercial);
export const CAT_CHIPS: { id: ResCategory; key: string }[] = [
  { id: 'studio', key: 'cat.studio' }, { id: '1bed', key: 'cat.1bedShort' }, { id: '1study', key: 'cat.1study' },
  { id: '2bed', key: 'cat.2bedShort' }, { id: '3bed', key: 'cat.3bedShort' }, { id: '4bed', key: 'cat.4bedShort' },
];

/* ---------------- Share + PDF ---------------- */
export async function shareProperty(p: Property, t: (k: string) => string, setCopied: (b: boolean) => void) {
  const url = window.location.href;
  const payload = { title: `Elaris Gardens — ${p.id}`, text: `${p.id} · ${p.area.toFixed(1)} m² · ${brand.address}`, url };
  try {
    if (navigator.share) { await navigator.share(payload); return; }
    throw new Error('noshare');
  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt(t('cta.share'), url); }
  }
}
export async function downloadPropertyPdf(p: Property, t: (k: string) => string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.setProperties({ title: `Elaris Gardens — ${p.id}`, author: brand.developer });
  doc.setFillColor(46, 58, 38); doc.rect(0, 0, 210, 42, 'F');
  doc.setTextColor(253, 251, 239); doc.setFont('times', 'normal'); doc.setFontSize(26);
  doc.text(`ELARIS GARDENS`, 16, 20); doc.setFontSize(12); doc.text(`${brand.address} · ${brand.email}`, 16, 30);
  doc.setTextColor(166, 129, 80); doc.setFontSize(44); doc.text(p.id, 16, 66);
  doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  doc.text(`${t('p.area')}: ${p.area.toFixed(1)} m²    ${t('p.floor')}: ${p.floor}    ${t(`wing.${p.wing}`)}`, 16, 78);
  let y = 94;
  p.rooms.forEach((r) => { doc.text(t(`room.${r.key}`), 16, y); doc.text(`${r.area.toFixed(1)} m²`, 170, y); doc.line(16, y + 2, 194, y + 2); y += 10; });
  doc.setFontSize(8.5); doc.setTextColor(96, 115, 92);
  doc.text('Illustrative prototype data. Layouts and areas illustrate a design concept, subject to an approved specification.', 16, 278);
  doc.save(`elaris-${p.slug}.pdf`);
}

/* ---------------- Pinned morph story (home + workspaces) ---------------- */
const SHAPE_A = 'M30,10 C180,-10 340,30 380,90 C420,160 400,320 370,420 C340,500 180,540 90,500 C10,465 -20,300 5,180 C15,90 10,30 30,10 Z';
const SHAPE_B = 'M60,40 C200,10 330,60 360,140 C390,230 350,380 300,460 C250,535 120,520 60,450 C5,385 10,220 35,130 C45,80 40,55 60,40 Z';
export function StoryMorph({ variant }: { variant: 'home' | 'work' }) {
  const { t, lp } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[:]/g, '');
  const [scene, setScene] = useState(1);
  const home = variant === 'home';
  const imgs = home
    ? { a1: '/images/story/exterior-01.jpg', a2: '/images/story/interior-01.jpg', b1: '/images/story/exterior-02.jpg', b2: '/images/story/interior-02.jpg' }
    : { a1: '/images/work/story-01.jpg', a2: '/images/work/story-02.jpg', b1: '/images/work/story-03.jpg', b2: '/images/work/story-04.jpg' };
  const s1 = home ? t('arch.s1') : t('ws.s1'); const s2 = home ? t('arch.s2') : t('ws.s2');
  const fin = home ? t('arch.final') : t('ws.final'); const fbody = home ? t('arch.body') : t('ws.fbody');
  const cta1 = home ? lp('/experience') : lp('/commercial'); const ctaF = home ? lp('/residences') : lp('/commercial');

  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (REDUCED()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 601px)', () => {
      const q = (s: string) => el.querySelector(s); const qa = (s: string) => el.querySelectorAll(s);
      gsap.set(qa('.sc2, .sc3'), { opacity: 0, y: '2rem', filter: 'blur(4px)' });
      gsap.set(qa('.win-img-b'), { opacity: 0 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (st) => {
          const p = st.progress; setScene(p < 0.34 ? 1 : p < 0.74 ? 2 : 3);
          gsap.set(q('.story-fill'), { scaleX: p });
        } },
      });
      tl.fromTo(qa('.story-win'), { scale: 1.1, filter: 'blur(4px)', opacity: 0 }, { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.10 }, 0);
      /* central morph 0.15 → 0.48 */
      qa('.morph-path').forEach((path: any) => tl.to(path, { morphSVG: SHAPE_B, duration: 0.33 }, 0.15));
      tl.to(q('.story-wins'), { xPercent: window.innerWidth > 1120 ? -92 : -18, duration: 0.33 }, 0.15)
        .to(q('.win-a'), { width: '54%', height: '60%', top: '20%', duration: 0.33 }, 0.15)
        .to(q('.win-b'), { width: '48%', height: '50%', top: '42%', duration: 0.33 }, 0.15)
        .to(qa('.win-img-a'), { opacity: 0, duration: 0.2 }, 0.2)
        .to(qa('.win-img-b'), { opacity: 1, duration: 0.2 }, 0.28)
        .to(q('.sc1'), { opacity: 0, y: '-2rem', filter: 'blur(4px)', duration: 0.12 }, 0.16)
        .to(q('.sc2'), { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.12 }, 0.34)
        .to(q('.sc2'), { opacity: 0, y: '-2rem', filter: 'blur(4px)', duration: 0.12 }, 0.6)
        .to(qa('.story-win'), { scale: 1.1, filter: 'blur(4px)', opacity: 0, duration: 0.10 }, 0.68)
        .to(q('.sc3'), { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.14 }, 0.76)
        .to(q('.story-inner'), { y: '10rem', duration: 0.2 }, 0.8);
      const sway = gsap.to(q('.story-canopy'), { rotation: 5, duration: 4, yoyo: true, repeat: -1, ease: 'power1.inOut' });
      return () => { sway.kill(); };
    });
    mm.add('(max-width: 600px)', () => {
      const states = el.querySelectorAll('.story-mstate');
      gsap.set(states, { opacity: 0 }); gsap.set(states[0], { opacity: 1 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5, onUpdate: (st) => {
        setScene(Math.min(5, Math.floor(st.progress * 5) + 1));
        gsap.set(el.querySelector('.story-fill'), { scaleX: st.progress });
      } } });
      states.forEach((s, i) => { if (i === 0) return; tl.to(states[i - 1], { opacity: 0, duration: 0.35 }, i).fromTo(s, { opacity: 0, scale: 1.04, filter: 'blur(3px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.35 }, i); });
    });
    return () => mm.revert();
  }, [variant]);

  const win = (cls: string, a: string, b: string, n: number) => (
    <div className={`story-win ${cls}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs><clipPath id={`cp-${uid}-${n}`} clipPathUnits="objectBoundingBox">
          <path className="morph-path" d={SHAPE_A} transform="scale(0.0024,0.00185)" />
        </clipPath></defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, clipPath: `url(#cp-${uid}-${n})` }}>
        <img className="win-img-a" src={a} alt="" /><img className="win-img-b" src={b} alt="" />
      </div>
    </div>
  );
  const isMobileState = (n: number) => scene === n;
  return (
    <div ref={ref} className="story" style={{ height: REDUCED() ? undefined : '900vh' }}>
      <div className={`story-stage ${home ? '' : 'charcoal'}`}>
        <div className={`story-canopy ${home ? '' : 'glass'}`} />
        {/* desktop / tablet composition */}
        <div className="story-inner desk">
          <div className={`story-scene sc1 left ${scene === 1 ? 'on' : ''}`}>
            <p className="kicker lime">{home ? t('arch.kicker') : t('ws.kicker')}</p>
            <h2 className="serif">{s1}</h2>
            <div><RollingLink to={cta1} theme="onDark">{home ? t('cta.explore3d') : t('cta.browseWork')}</RollingLink></div>
          </div>
          <div className={`story-scene sc2 right ${scene === 2 ? 'on' : ''}`} aria-hidden={scene !== 2}>
            <h2 className="serif">{s2}</h2>
            <div><RollingLink to={cta1} theme="onDark">{home ? t('cta.explore3d') : t('cta.browseWork')}</RollingLink></div>
          </div>
          <div className={`story-final sc3 ${scene === 3 ? 'on' : ''}`} aria-hidden={scene !== 3}>
            <h2 className="serif">{fin}</h2>
            <div className="fb"><p>{fbody}</p><RollingLink to={ctaF} theme="onDark">{home ? t('cta.browseHomes') : t('cta.viewWork')}</RollingLink></div>
          </div>
          <div className="story-wins">{win('win-a', imgs.a1, imgs.b1, 1)}{win('win-b', imgs.a2, imgs.b2, 2)}</div>
        </div>
        {/* mobile five-state composition */}
        <div className="story-mstates">
          <div className={`story-mstate ${isMobileState(1) ? 'on' : ''}`}><p className="kicker lime">{home ? t('arch.kicker') : t('ws.kicker')}</p><h2 className="serif" style={{ fontSize: '2.3rem' }}>{s1}</h2><div><RollingLink to={cta1} theme="onDark">{home ? t('cta.explore3d') : t('cta.browseWork')}</RollingLink></div></div>
          <div className={`story-mstate ${isMobileState(2) ? 'on' : ''}`}><div className="mimgs">{win('win-a', imgs.a1, imgs.a1, 3)}{win('win-b', imgs.a2, imgs.a2, 4)}</div></div>
          <div className={`story-mstate ${isMobileState(3) ? 'on' : ''}`}><h2 className="serif" style={{ fontSize: '2.3rem' }}>{s2}</h2><div><RollingLink to={cta1} theme="onDark">{home ? t('cta.explore3d') : t('cta.browseWork')}</RollingLink></div></div>
          <div className={`story-mstate ${isMobileState(4) ? 'on' : ''}`}><div className="mimgs">{win('win-a', imgs.b1, imgs.b1, 5)}{win('win-b', imgs.b2, imgs.b2, 6)}</div></div>
          <div className={`story-mstate ${isMobileState(5) ? 'on' : ''}`}><h2 className="serif" style={{ fontSize: '2.6rem', textTransform: 'uppercase' }}>{fin}</h2><p>{fbody}</p><div><RollingLink to={ctaF} theme="onDark">{home ? t('cta.browseHomes') : t('cta.viewWork')}</RollingLink></div></div>
        </div>
        <div className="story-prog" aria-hidden="true">
          <div className="story-num"><span key={scene}>{String(scene).padStart(2, '0')}</span></div>
          <div className="story-track"><div className="story-fill" /></div>
        </div>
      </div>
      <style>{`@media(max-width:600px){.story{height:600vh!important}.story-inner.desk{display:none}}@media(min-width:601px){.story-mstates{display:none}}`}</style>
    </div>
  );
}

/* ---------------- Organic lattice gallery → fullscreen slider ---------------- */
const OG_CELLS = [
  { l: '2%', t: '6%', w: '24%', h: '34%', r: '58% 42% 55% 45% / 48% 56% 44% 52%' },
  { l: '30%', t: '3%', w: '18%', h: '26%', r: '45% 55% 60% 40% / 55% 45% 58% 42%' },
  { l: '74%', t: '5%', w: '24%', h: '36%', r: '50% 50% 42% 58% / 60% 44% 56% 40%' },
  { l: '5%', t: '52%', w: '20%', h: '40%', r: '60% 40% 48% 52% / 45% 58% 42% 55%' },
  { l: '76%', t: '54%', w: '21%', h: '38%', r: '44% 56% 52% 48% / 56% 46% 54% 44%' },
  { l: '29%', t: '72%', w: '17%', h: '24%', r: '55% 45% 50% 50% / 48% 52% 48% 52%' },
  { l: '55%', t: '74%', w: '18%', h: '23%', r: '48% 52% 58% 42% / 52% 48% 52% 48%' },
];
export function OrganicGallery({ images }: { images: string[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const lock = useRef(false); const idxRef = useRef(0);
  const go = (dir: 1 | -1) => {
    if (lock.current || !ref.current) return; lock.current = true;
    const next = (idxRef.current + dir + images.length) % images.length;
    const slides = ref.current.querySelectorAll('.og-slide');
    const cur = slides[idxRef.current] as HTMLElement, inc = slides[next] as HTMLElement;
    gsap.set(inc, { xPercent: dir * 100, zIndex: 6, display: 'block' });
    gsap.set(inc.querySelector('img'), { xPercent: dir * -50 });
    gsap.to(inc, { xPercent: 0, duration: 1.4, ease: 'power2.inOut' });
    gsap.to(inc.querySelector('img'), { xPercent: 0, duration: 1.4, ease: 'power2.inOut', onComplete: () => {
      gsap.set(cur, { display: 'none', zIndex: 4 }); gsap.set(inc, { zIndex: 5 });
      idxRef.current = next; setIdx(next); lock.current = false;
    } });
  };
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (REDUCED()) { setActive(true); return; }
    const ctx = gsap.context(() => {
      const collage = el.querySelector('.og-collage'); const centre = el.querySelector('.og-centre');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (st) => setActive(st.progress >= 0.77) } });
      tl.to(collage, { width: '200%', height: '150%', ease: 'none', duration: 0.55 }, 0)
        .to(centre, { left: '25%', top: '16.6%', width: '50%', height: '66.6%', borderRadius: '1.25rem', ease: 'none', duration: 0.55 }, 0)
        .to(centre, { scale: 4, borderRadius: '0rem', ease: 'none', duration: 0.3 }, 0.55)
        .to(centre, { opacity: 0, duration: 0.08 }, 0.86)
        .fromTo(el.querySelectorAll('.og-slide')[0], { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.86);
    }, el);
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (!active || paused || REDUCED()) return;
    const iv = setInterval(() => { if (!document.hidden) go(1); }, 3500);
    return () => clearInterval(iv);
  }, [active, paused]);
  return (
    <div ref={ref} className="ogallery" style={{ height: REDUCED() ? '100vh' : '600vh' }} role="region" aria-label={t('gallery.label')}>
      <div className="og-stage">
        <span className="og-label kicker">{t('gallery.label')} · {String(idx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        <div className="og-collage">
          {OG_CELLS.map((c, i) => (
            <div key={i} className="og-cell" style={{ left: c.l, top: c.t, width: c.w, height: c.h, borderRadius: c.r }}>
              <img src={images[(i + 1) % images.length]} alt="" loading="lazy" />
            </div>
          ))}
          <div className="og-cell og-centre" style={{ left: '38%', top: '32%', width: '26%', height: '38%', borderRadius: '52% 48% 55% 45% / 48% 55% 45% 52%' }}>
            <img src={images[0]} alt="" />
          </div>
        </div>
        {images.map((src, i) => (
          <div key={i} className="og-slide" style={{ display: i === 0 ? 'block' : 'none', opacity: REDUCED() ? (i === 0 ? 1 : 0) : i === 0 ? 0 : 1 }} aria-hidden={i !== idx}>
            <img src={src} alt="" />
          </div>
        ))}
        <div className={`og-arrows ${active ? 'on' : ''}`}>
          <button className="circ" onClick={() => go(-1)} aria-label={t('cta.prev')}>←</button>
          <button className="circ" onClick={() => go(1)} aria-label={t('cta.next')}>→</button>
          <button className="circ" onClick={() => setPaused(!paused)} aria-label={paused ? t('cta.play') : t('cta.pause')}>{paused ? '▶' : '❚❚'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Footer + newsletter ---------------- */
const newsSchema = z.object({
  first: z.string().min(1), last: z.string().min(1), email: z.string().email(),
  consent: z.literal(true),
});
export function Footer() {
  const { t, lp, locale } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(newsSchema) });
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelectorAll('.f-anim'), { opacity: 0, x: '-2rem', y: '2rem' },
        { opacity: 1, x: 0, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 78%' } });
      gsap.fromTo(el.querySelector('.foot-building'), { y: '6rem' }, { y: '-4rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <footer ref={ref} className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="f-anim">
            <h2 className="serif">{t('footer.newsT')}</h2>
            <p>{t('footer.news')}</p>
            {done ? <p className="serif" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{t('form.thanksNews')}</p> : (
              <form onSubmit={handleSubmit(async () => { await demoSubmit(); setDone(true); })} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <div className="field"><label htmlFor="nf">{t('form.first')}</label><input id="nf" {...register('first')} />{errors.first && <span className="err" style={{ color: '#b3402f' }}>{t('form.err.required')}</span>}</div>
                  <div className="field"><label htmlFor="nl">{t('form.last')}</label><input id="nl" {...register('last')} />{errors.last && <span className="err" style={{ color: '#b3402f' }}>{t('form.err.required')}</span>}</div>
                </div>
                <div className="field"><label htmlFor="ne">{t('form.email')}</label><input id="ne" type="email" {...register('email')} />{errors.email && <span className="err" style={{ color: '#b3402f' }}>{t('form.err.email')}</span>}</div>
                <label className="check"><input type="checkbox" {...register('consent')} /><span>{t('form.consentNews')} · {t('form.ack')} <Link to={lp('/privacy')}>{t('form.privacy')}</Link></span></label>
                {errors.consent && <span className="err" style={{ color: '#b3402f' }}>{t('form.err.ack')}</span>}
                <RollingButton type="submit" theme="solid" disabled={isSubmitting}>{isSubmitting ? t('form.sending') : t('form.subscribe')}</RollingButton>
              </form>
            )}
          </div>
          <div className="f-anim">
            <p className="kicker" style={{ color: 'var(--bronze)' }}>{t('footer.explore')}</p>
            <nav aria-label="Footer">
              <Link to={lp('/experience')}>{t('nav.experience')}</Link>
              <Link to={lp('/#neighbourhood')}>{t('nav.neighbourhood')}</Link>
              <Link to={lp('/residences')}>{t('nav.residences')}</Link>
              <Link to={lp('/#amenities')}>{t('nav.amenities')}</Link>
              <Link to={lp('/workspaces')}>{t('nav.workspaces')}</Link>
              <Link to={lp('/commercial')}>{t('nav.commercial')}</Link>
              <Link to={lp('/developer')}>{t('nav.developer')}</Link>
              <Link to={lp('/privacy')}>{t('nav.privacy')}</Link>
            </nav>
          </div>
          <div className="f-anim">
            <p className="kicker" style={{ color: 'var(--bronze)' }}>{t('footer.visit')}</p>
            <p>{brand.address}<br /><a href={`mailto:${brand.email}`}>{brand.email}</a></p>
            <p style={{ fontSize: '.88rem', color: 'var(--sage)' }}>{t('footer.disclaimer')}</p>
            <RollingLink to={lp('/contact')} theme="onLight small">{t('cta.enquire')}</RollingLink>
          </div>
        </div>
      </div>
      <div className="foot-scene" aria-hidden="true">
        <img className="foot-building" src="/images/footer/building.jpg" alt="" loading="lazy" />
        <img className="foot-tree l" src="/images/footer/tree-left.png" alt="" loading="lazy" />
        <img className="foot-tree r" src="/images/footer/tree-right.png" alt="" loading="lazy" />
      </div>
      <div className="foot-word" aria-hidden="true">ELARIS GARDENS</div>
      <div className="wrap"><div className="foot-base"><span>{t('footer.rights')}</span><span>{locale === 'fr' ? '24 Grove Avenue, Eastbank' : brand.address}</span></div></div>
    </footer>
  );
}

/* Down-arrow cue with reference rhythm */
export function DownCue() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || REDUCED()) return;
    const tw = gsap.timeline({ repeat: -1, repeatDelay: 0.4 })
      .fromTo(ref.current, { y: '-0.5rem', opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })
      .to(ref.current, { y: '0.5rem', opacity: 0, duration: 0.4 });
    return () => { tw.kill(); };
  }, []);
  return <div className="downcue" aria-hidden="true"><span ref={ref}>↓</span></div>;
}
