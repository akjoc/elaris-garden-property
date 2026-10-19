import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { I18nProvider, useI18n } from './i18n';
import { isLocale, brand, type Locale } from './data';
import { Symbol, Footer, REDUCED } from './components';
import Home from './pages/Home';
import Residences, { CommercialCatalogue } from './pages/Catalogue';
import Detail from './pages/Detail';
import Workspaces from './pages/Workspaces';
import Contact from './pages/Contact';
import Developer from './pages/Developer';
import Privacy, { NotFound } from './pages/Privacy';

gsap.registerPlugin(ScrollTrigger);
const Experience = React.lazy(() => import('./pages/Experience'));

declare global { interface Window { __lenis?: Lenis } }

/* ---------------- subtle bronze spring pointer trail (desktop fine-pointer, never on explorer) ---------------- */
function PointerTrail({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!enabled || REDUCED()) return;
    if (!window.matchMedia('(min-width:1121px) and (pointer:fine)').matches) return;
    const cv = ref.current!; const ctx = cv.getContext('2d')!;
    let w = (cv.width = innerWidth), h = (cv.height = innerHeight);
    const mouse = { x: w / 2, y: h / 2 };
    const STRANDS = 10, NODES = 10, FRICTION = 0.5, DAMP = 0.1, TENSION = 0.98;
    const strands = Array.from({ length: STRANDS }, (_, s) =>
      Array.from({ length: NODES }, () => ({ x: mouse.x, y: mouse.y, vx: 0, vy: 0, k: 0.28 - s * 0.012 })));
    let raf = 0;
    const move = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const resize = () => { w = cv.width = innerWidth; h = cv.height = innerHeight; };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(166,129,80,0.20)'; ctx.lineWidth = 1;
      for (const strand of strands) {
        let px = mouse.x, py = mouse.y;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (const n of strand) {
          n.vx = (n.vx + (px - n.x) * n.k * TENSION) * (1 - DAMP) * (1 - (1 - FRICTION) * 0.2);
          n.vy = (n.vy + (py - n.y) * n.k * TENSION) * (1 - DAMP) * (1 - (1 - FRICTION) * 0.2);
          n.x += n.vx; n.y += n.vy;
          ctx.quadraticCurveTo(px, py, n.x, n.y);
          px = n.x; py = n.y;
        }
        ctx.stroke();
      }
    };
    addEventListener('pointermove', move); addEventListener('resize', resize); tick();
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); removeEventListener('resize', resize); };
  }, [enabled]);
  if (!enabled) return null;
  return <canvas id="trail" ref={ref} aria-hidden="true" />;
}

/* ---------------- floating capsule header ---------------- */
function Header() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const loc = useLocation(); const nav = useNavigate();
  const ref = useRef<HTMLElement>(null); const btnRef = useRef<HTMLButtonElement>(null);
  const base = `/${locale}`;
  const links: [string, string][] = [
    [base, t('nav.home')], [`${base}/experience`, t('nav.experience')], [`${base}#neighbourhood`, t('nav.neighbourhood')],
    [`${base}/residences`, t('nav.residences')], [`${base}#amenities`, t('nav.amenities')],
    [`${base}/workspaces`, t('nav.workspaces')], [`${base}/commercial`, t('nav.commercial')],
    [`${base}/developer`, t('nav.developer')], [`${base}/contact`, t('nav.contact')],
  ];
  useEffect(() => { setOpen(false); }, [loc.pathname, loc.hash]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey); document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    const isMobile = window.matchMedia('(max-width:1120px)').matches;
    if (isMobile) document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('nav a')?.focus();
    return () => { window.__lenis?.start(); document.body.style.overflow = ''; };
  }, [open]);
  useEffect(() => {
    let last = 0;
    const onScroll = ({ scroll }: { scroll: number }) => {
      if (window.matchMedia('(max-width:1120px)').matches && !open) setHidden(scroll > 80 && scroll > last);
      last = scroll;
    };
    const lenis = window.__lenis; lenis?.on('scroll', onScroll);
    return () => { lenis?.off('scroll', onScroll); };
  }, [open]);
  const swapLocale = (l: Locale) => {
    if (l === locale) return;
    const rest = loc.pathname.replace(/^\/(en|fr)/, '') || '';
    nav(`/${l}${rest}${loc.search}${loc.hash}`);
  };
  return (
    <header ref={ref} className={`hdr ${open ? 'open' : ''} ${hidden && !open ? 'hiddenUp' : ''}`}>
      <div className="hdr-bar">
        <button ref={btnRef} className="hdr-menu" aria-expanded={open} aria-controls="main-nav"
          aria-label={open ? t('a11y.closeMenu') : t('a11y.openMenu')} onClick={() => setOpen(!open)}>
          <span className="burger" aria-hidden="true"><i /><i /></span>{open ? t('nav.close') : t('nav.menu')}
        </button>
        <Link className="hdr-logo" to={base} aria-label={`${brand.name} — ${t('nav.home')}`} onClick={() => setOpen(false)}>
          <Symbol color="#CCBF99" />
        </Link>
        <Link className="hdr-enq" to={`${base}/contact`}>{t('nav.enquire')} <span aria-hidden="true">→</span></Link>
      </div>
      <div className="hdr-panel" ref={(el) => { if (el) (el as any).inert = !open; }}>
        <div className="hdr-panelIn">
          <div className="hdr-word">ELARIS&nbsp;GARDENS</div>
          <nav id="main-nav" aria-label="Main">
            {links.map(([to, label]) => (
              <Link key={to + label} className="navlink" to={to} tabIndex={open ? 0 : -1}>
                <span className="roll"><span>{label}</span><span aria-hidden="true">{label}</span></span>
              </Link>
            ))}
          </nav>
          <div className="hdr-foot">
            <div className="lang" role="group" aria-label={t('nav.lang')}>
              <button className={locale === 'en' ? 'on' : ''} onClick={() => swapLocale('en')} tabIndex={open ? 0 : -1}>EN</button>
              <button className={locale === 'fr' ? 'on' : ''} onClick={() => swapLocale('fr')} tabIndex={open ? 0 : -1}>FR</button>
            </div>
            <a href={`mailto:${brand.email}`} style={{ fontSize: '.85rem', color: 'var(--muted-cream)' }}>{brand.email}</a>
          </div>
          <Link className="hdr-ctaM rbtn onDark" to={`${base}/contact`}>{t('nav.enquire')} →</Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- locale app with route-cover transitions ---------------- */
function LocaleApp() {
  const { locale } = useParams();
  const location = useLocation();
  const [display, setDisplay] = useState(location);
  const coverRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (REDUCED()) { setDisplay(location); return; }
    if (first.current) { first.current = false; setDisplay(location); return; }
    if (location.pathname === display.pathname && location.search === display.search) { setDisplay(location); return; } // hash-only
    const cover = coverRef.current, main = mainRef.current;
    if (!cover || !main) { setDisplay(location); return; }
    window.__lenis?.stop();
    const tl = gsap.timeline({ onComplete: () => { gsap.set([cover, main], { clearProps: 'transform,transformOrigin' }); window.__lenis?.start(); ScrollTrigger.refresh(); } });
    tl.set(cover, { transformOrigin: 'bottom', scaleY: 0 })
      .to(cover, { scaleY: 1, duration: 1, ease: 'power2.inOut' }, 0)
      .to(main, { y: '-50vh', duration: 1, ease: 'power2.inOut' }, 0)
      .add(() => { setDisplay(location); window.scrollTo(0, 0); window.__lenis?.scrollTo(0, { immediate: true }); })
      .set(main, { y: '50vh' })
      .set(cover, { transformOrigin: 'top' })
      .to(cover, { scaleY: 0, duration: 1, ease: 'power2.inOut' }, '+=0.05')
      .to(main, { y: 0, duration: 1, ease: 'power2.inOut' }, '<');
    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  /* anchor scrolling (direct load, back/forward, cross-route) */
  useEffect(() => {
    if (!display.hash) return;
    const id = display.hash.slice(1);
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) { if (window.__lenis) window.__lenis.scrollTo(el, { offset: 0, duration: 1.6 }); else el.scrollIntoView(); }
    }, REDUCED() ? 60 : 1150);
    return () => clearTimeout(t);
  }, [display]);

  useEffect(() => {
    const seg = display.pathname.split('/')[2] ?? '';
    const names: Record<string, string> = {
      '': '', experience: 'Experience', residences: 'Residences', workspaces: 'Workspaces',
      commercial: 'Offices & Retail', contact: 'Contact', developer: 'Developer', privacy: 'Privacy',
    };
    document.title = names[seg] ? `${names[seg]} — Elaris Gardens` : 'Elaris Gardens — Eastbank District';
    document.documentElement.lang = isLocale(locale) ? locale : 'en';
  }, [display.pathname, locale]);

  if (!isLocale(locale)) {
    const rest = location.pathname.split('/').slice(2).join('/');
    return <Navigate to={`/en${rest ? '/' + rest : ''}${location.search}${location.hash}`} replace />;
  }
  const seg = display.pathname.split('/')[2] ?? '';
  const noFooter = seg === 'contact' || seg === 'experience';
  const is404 = !['', 'experience', 'residences', 'workspaces', 'commercial', 'contact', 'developer', 'privacy'].includes(seg);
  return (
    <I18nProvider locale={locale}>
      <a className="skip" href="#main">Skip</a>
      <Header />
      <PointerTrail enabled={seg !== 'experience'} />
      <div ref={coverRef} className="cover" aria-hidden="true" />
      <div ref={mainRef}>
        <main id="main">
          <Routes location={display}>
            <Route index element={<Home />} />
            <Route path="experience" element={<Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>…</div>}><Experience /></Suspense>} />
            <Route path="residences" element={<Residences />} />
            <Route path="residences/:slug" element={<Detail kind="home" />} />
            <Route path="workspaces" element={<Workspaces />} />
            <Route path="commercial" element={<CommercialCatalogue />} />
            <Route path="commercial/:slug" element={<Detail kind="commercial" />} />
            <Route path="contact" element={<Contact />} />
            <Route path="developer" element={<Developer />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!noFooter && !is404 && <Footer />}
      </div>
    </I18nProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (REDUCED()) return;
    const lenis = new Lenis({ duration: 2, smoothWheel: true, touchMultiplier: 1 });
    window.__lenis = lenis;
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const onResize = () => ScrollTrigger.refresh();
    addEventListener('resize', onResize);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => { gsap.ticker.remove(raf); lenis.off('scroll', onScroll); lenis.destroy(); removeEventListener('resize', onResize); window.__lenis = undefined; };
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      <Route path="/:locale/*" element={<LocaleApp />} />
    </Routes>
  );
}
