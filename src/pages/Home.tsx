import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../i18n';
import {
  HOME_GALLERY, AMENITIES, WORK_WINGS, PAYMENT, neighbourhood,
  availability, workWingCount, type ResCategory,
} from '../data';
import {
  Symbol, RollingLink, AnimatedText, RevealPara, EditorialPanel, StoryMorph,
  LazyVideo, useMedia, REDUCED,
} from '../components';

gsap.registerPlugin(ScrollTrigger);
const NeighbourhoodScene = React.lazy(() => import('../three/NeighbourhoodScene'));

/* ================= H1 — cinematic arrival ================= */
function HeroFilm() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<'load' | 'play' | 'done'>('load');
  const [pct, setPct] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mobile = useMedia('(max-width: 600px)');
  useEffect(() => {
    if (REDUCED()) { setPhase('done'); return; }
    const obj = { v: 0 };
    let ready = false;
    const v = videoRef.current;
    const onReady = () => { ready = true; };
    v?.addEventListener('canplay', onReady);
    const tw = gsap.to(obj, {
      v: 100, duration: 2, ease: 'power1.inOut', onUpdate: () => setPct(Math.round(obj.v)),
      onComplete: () => {
        const start = () => {
          setPhase('play');
          v?.play().catch(() => setPhase('done'));
        };
        if (ready) start(); else setTimeout(start, 600); /* never lock the user */
      },
    });
    const safety = setTimeout(() => setPhase((p) => (p === 'load' ? 'done' : p)), 6000);
    return () => { tw.kill(); clearTimeout(safety); v?.removeEventListener('canplay', onReady); };
  }, []);
  useEffect(() => {
    if (phase !== 'done' || !titleRef.current || REDUCED()) return;
    let inst: any;
    (async () => {
      try {
        const { SplitText } = await import('gsap/SplitText'); gsap.registerPlugin(SplitText);
        inst = new (SplitText as any)(titleRef.current, { type: 'chars', aria: 'auto' });
        gsap.fromTo('.hero-title', { opacity: 0 }, { opacity: 1, duration: 0.8 });
        gsap.fromTo(inst.chars, { y: '2rem', opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'power2.out' });
      } catch { /* visible regardless */ }
    })();
    return () => inst?.revert?.();
  }, [phase]);
  return (
    <section className="hero" aria-label="Elaris Gardens">
      <video ref={videoRef} className={phase === 'load' ? 'visually-hidden' : ''} muted playsInline preload="auto"
        poster={mobile ? '/images/hero/poster-mobile.jpg' : '/images/hero/poster-desktop.jpg'}
        src={mobile ? '/media/arrival-mobile.mp4' : '/media/arrival-desktop.mp4'}
        onEnded={() => setPhase('done')} />
      {phase === 'load' && <img className="hero-poster" src={mobile ? '/images/hero/poster-mobile.jpg' : '/images/hero/poster-desktop.jpg'} alt="" />}
      <div className="hero-shade" />
      {phase === 'load' && (
        <div className="loader" role="status" aria-label={`${pct}%`}>
          <Symbol />
          <div className="loader-track"><div className="loader-fill" style={{ transform: `scaleX(${pct / 100})` }} /></div>
          <div className="loader-pct">{pct}%</div>
        </div>
      )}
      {phase === 'play' && <button className="hero-skip" onClick={() => { videoRef.current?.pause(); setPhase('done'); }}>{t('hero.scroll')} ↓</button>}
      <div className="hero-title" style={{ opacity: phase === 'done' ? undefined : 0 }}>
        <p className="kicker">{t('hero.kicker')}</p>
        <h1 ref={titleRef} className="serif">ELARIS GARDENS</h1>
      </div>
    </section>
  );
}

/* ================= shared selector bits ================= */
function RollingItem({ label, active, onClick, onHover, refCb }: {
  label: string; active: boolean; onClick: () => void; onHover: () => void; refCb?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button ref={refCb} className={`sel-item ${active ? 'active' : ''}`} onClick={onClick}
      onMouseEnter={onHover} onFocus={onHover} aria-pressed={active}>
      <span className="roll"><span>{label}</span><span aria-hidden="true">{label}</span></span>
    </button>
  );
}
function useMarker(listRef: React.RefObject<HTMLDivElement>, deps: any[]) {
  const [m, setM] = useState({ top: 0, height: 0 });
  const move = (el: HTMLElement | null) => { if (el) setM({ top: el.offsetTop + el.offsetHeight * 0.1, height: el.offsetHeight * 0.8 }); };
  return { m, move };
}
function MobileSelect({ options, value, onChange, label }: {
  options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);
  return (
    <div className={`msel ${open ? 'open' : ''}`}>
      <button className="msel-head" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>
        <span>{current?.label}</span><span className="chev">⌄</span>
      </button>
      <div className="msel-body"><div className="msel-bodyIn">
        {options.map((o) => (
          <button key={o.id} aria-pressed={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }}>{o.label}</button>
        ))}
      </div></div>
    </div>
  );
}
function useDelayedInfo<T>(value: T): [T, React.RefObject<HTMLDivElement>] {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el || REDUCED()) { setShown(value); return; }
    const tw = gsap.to(el, { opacity: 0, y: 8, duration: 0.3, onComplete: () => { setShown(value); gsap.fromTo(el, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.05 }); } });
    return () => { tw.kill(); };
  }, [value]);
  return [shown, ref];
}
function useSelectorReveal(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      const media = el.querySelector('.sel-media'); const panel = el.querySelector('.sel-panel');
      gsap.fromTo(media, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
      gsap.fromTo(panel, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
      const img = el.querySelector('.sel-media .plx');
      if (img) gsap.fromTo(img, { y: '-5%' }, { y: '5%', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
}

/* ================= H6 — residence selector + Keen gallery ================= */
function ResidenceSelector() {
  const { t, lp } = useI18n();
  const isMobile = useMedia('(max-width: 1120px)');
  const flat = HOME_GALLERY.flatMap((g) => g.images.map((src) => ({ src, cat: g.cat })));
  const offsets: number[] = []; let acc = 0;
  HOME_GALLERY.forEach((g) => { offsets.push(acc); acc += g.images.length; });
  const [catIdx, setCatIdx] = useState(0);
  const [slide, setSlide] = useState(0);
  const programmatic = useRef(false);
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { m, move } = useMarker(listRef, [catIdx]);
  const [shownCat, infoRef] = useDelayedInfo(catIdx);
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true, slides: { perView: 1 },
    slideChanged(s) {
      const i = s.track.details.rel; setSlide(i);
      if (programmatic.current) return;
      const c = HOME_GALLERY.findIndex((g) => g.cat === flat[i].cat);
      if (c >= 0) setCatIdx(c);
    },
    animationEnded() { programmatic.current = false; },
  });
  useSelectorReveal(rootRef);
  useEffect(() => { move(itemRefs.current[catIdx] ?? null); }, [catIdx]);
  const choose = (i: number) => { setCatIdx(i); programmatic.current = true; slider.current?.moveToIdx(offsets[i]); };
  const cat = HOME_GALLERY[shownCat];
  return (
    <section ref={rootRef} className="selector" aria-label={t('nav.residences')}>
      <div className="sel-panel">
        <p className="kicker" style={{ color: 'var(--bronze)' }}>{t('homes.kicker')}</p>
        {isMobile ? (
          <MobileSelect label={t('f.layout')} value={HOME_GALLERY[catIdx].cat}
            options={HOME_GALLERY.map((g) => ({ id: g.cat, label: t(g.labelKey) }))}
            onChange={(id) => choose(HOME_GALLERY.findIndex((g) => g.cat === id))} />
        ) : (
          <div className="sel-list" ref={listRef} onMouseLeave={() => move(itemRefs.current[catIdx] ?? null)}>
            <span className="sel-marker" style={{ top: m.top, height: m.height }} />
            {HOME_GALLERY.map((g, i) => (
              <RollingItem key={g.cat} label={t(g.labelKey)} active={i === catIdx} refCb={(el) => { itemRefs.current[i] = el; }}
                onClick={() => choose(i)} onHover={() => move(itemRefs.current[i] ?? null)} />
            ))}
          </div>
        )}
        <div className="sel-info" ref={infoRef} aria-live="polite">
          <span className="sel-count">{availability(cat.cat as ResCategory)}</span>{' '}
          <span>{t('sel.available')} · {t(cat.labelKey)}</span>
          <div style={{ marginTop: '1.2rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap' }}>
            <RollingLink to={lp('/residences')} theme="onLight">{t('sel.browseAll')}</RollingLink>
            <RollingLink to={lp('/contact')} theme="onLight">{t('cta.enquire')}</RollingLink>
          </div>
        </div>
      </div>
      <div className="sel-media">
        <div ref={sliderRef} className="keen-slider keen">
          {flat.map((f, i) => (
            <div className="keen-slider__slide" key={i}><img className="plx" src={f.src} alt="" loading="lazy" style={{ scale: 1.1 }} /></div>
          ))}
        </div>
        <div className="sel-arrows">
          <button className="circ" onClick={() => slider.current?.prev()} aria-label={t('cta.prev')}>←</button>
          <button className="circ" onClick={() => slider.current?.next()} aria-label={t('cta.next')}>→</button>
        </div>
        <span style={{ position: 'absolute', left: '1.4rem', bottom: '1.4rem', color: '#fff', fontFamily: 'var(--serif)', fontStyle: 'italic', zIndex: 5 }}>
          {String(slide + 1).padStart(2, '0')} / {String(flat.length).padStart(2, '0')}
        </span>
      </div>
    </section>
  );
}

/* ================= H8 — workspace selector (shared lobby image) ================= */
export function WorkspaceSelector({ brochure = false }: { brochure?: boolean }) {
  const { t, lp } = useI18n();
  const isMobile = useMedia('(max-width: 1120px)');
  const [idx, setIdx] = useState(0);
  const [shown, infoRef] = useDelayedInfo(idx);
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { m, move } = useMarker(listRef, [idx]);
  useSelectorReveal(rootRef);
  useEffect(() => { move(itemRefs.current[idx] ?? null); }, [idx]);
  const w = WORK_WINGS[shown];
  return (
    <section ref={rootRef} className="selector rev" aria-label={t('nav.workspaces')}>
      <div className="sel-media"><img className="plx" src="/images/work/lobby.jpg" alt="" loading="lazy" /></div>
      <div className={`sel-panel ${brochure ? 'charcoal' : 'dark'}`}>
        <p className="kicker lime">{t('work.kicker')}</p>
        {isMobile ? (
          <MobileSelect label={t('f.wing')} value={WORK_WINGS[idx].id}
            options={WORK_WINGS.map((x) => ({ id: x.id, label: t(`wing.${x.id}`) }))}
            onChange={(id) => setIdx(WORK_WINGS.findIndex((x) => x.id === id))} />
        ) : (
          <div className="sel-list" ref={listRef} onMouseLeave={() => move(itemRefs.current[idx] ?? null)}>
            <span className="sel-marker" style={{ top: m.top, height: m.height }} />
            {WORK_WINGS.map((x, i) => (
              <RollingItem key={x.id} label={t(`wing.${x.id}`)} active={i === idx} refCb={(el) => { itemRefs.current[i] = el; }}
                onClick={() => setIdx(i)} onHover={() => move(itemRefs.current[i] ?? null)} />
            ))}
          </div>
        )}
        <div className="sel-info" ref={infoRef} aria-live="polite" style={{ borderTopColor: 'rgb(204 191 153/.5)' }}>
          <span className="sel-count">{workWingCount(w.id)}</span> <span>{t('sel.spaces')}</span>
          <p style={{ maxWidth: '26rem' }}>{t(`wing.${w.id}.d`)}</p>
          <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {brochure && <RollingLink to="/documents/workspace-brochure.pdf" theme="onDark" download>{t('cta.downloadBrochure')}</RollingLink>}
            <RollingLink to={lp(brochure ? '/contact?tab=business' : '/workspaces')} theme="onDark">{brochure ? t('cta.business') : t('cta.browseWork')}</RollingLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= H11 — amenity selector (width wipe) ================= */
function AmenitySelector() {
  const { t, lp } = useI18n();
  const isMobile = useMedia('(max-width: 1120px)');
  const [idx, setIdx] = useState(0);
  const [shown, infoRef] = useDelayedInfo(idx);
  const rootRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [m, setM] = useState({ top: 0, height: 0 });
  const move = (el: HTMLElement | null) => { if (el) setM({ top: el.offsetTop + el.offsetHeight * 0.1, height: el.offsetHeight * 0.8 }); };
  useSelectorReveal(rootRef);
  useEffect(() => move(itemRefs.current[idx] ?? null), [idx]);
  const a = AMENITIES[shown];
  return (
    <section ref={rootRef} className="selector" aria-label={t('nav.amenities')}>
      <div className="sel-panel sand">
        <p className="kicker" style={{ color: 'var(--bronze)' }}>{t('amen.kicker')}</p>
        {isMobile ? (
          <MobileSelect label={t('amen.kicker')} value={AMENITIES[idx].id}
            options={AMENITIES.map((x) => ({ id: x.id, label: t(`amen.${x.id}`) }))}
            onChange={(id) => setIdx(AMENITIES.findIndex((x) => x.id === id))} />
        ) : (
          <div className="sel-list" onMouseLeave={() => move(itemRefs.current[idx] ?? null)}>
            <span className="sel-marker" style={{ top: m.top, height: m.height }} />
            {AMENITIES.map((x, i) => (
              <RollingItem key={x.id} label={t(`amen.${x.id}`)} active={i === idx} refCb={(el) => { itemRefs.current[i] = el; }}
                onClick={() => setIdx(i)} onHover={() => move(itemRefs.current[i] ?? null)} />
            ))}
          </div>
        )}
        <div className="sel-info" ref={infoRef} aria-live="polite">
          <p className="serif" style={{ fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--bronze)', margin: '0 0 .5rem' }}>{t(`amen.${a.id}`)}</p>
          <p style={{ maxWidth: '26rem' }}>{t(`amen.${a.id}.d`)}</p>
          <RollingLink to={lp('/residences')} theme="onLight">{t('cta.viewHomes')}</RollingLink>
        </div>
      </div>
      <div className="sel-media">
        <div className="wipebox">
          {AMENITIES.map((x, i) => (
            <div key={x.id} className="wp" style={{ width: i === idx ? '100%' : '0%' }} aria-hidden={i !== idx}>
              <img className="plx" src={x.img} alt={i === idx ? t(`amen.${x.id}`) : ''} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= H4 — neighbourhood ================= */
function Neighbourhood() {
  const { t, locale } = useI18n();
  const [act, setAct] = useState(0);
  const isTouchLayout = useMedia('(max-width: 1120px)');
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [m, setM] = useState({ top: 0, height: 0 });
  const [shown, infoRef] = useDelayedInfo(act);
  const rootRef = useRef<HTMLElement>(null);
  const move = (el: HTMLElement | null) => { if (el) setM({ top: el.offsetTop + el.offsetHeight * 0.1, height: el.offsetHeight * 0.8 }); };
  useEffect(() => move(itemRefs.current[act] ?? null), [act]);
  useEffect(() => {
    const el = rootRef.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector('.neigh-left'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
      gsap.fromTo(el.querySelector('.mapwrap'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
    }, el);
    return () => ctx.revert();
  }, []);
  const [cardRef, cardSlider] = useKeenSlider<HTMLDivElement>({ slides: { perView: 1, spacing: 16 }, slideChanged: (s) => setAct(s.track.details.rel) });
  const place = neighbourhood[shown];
  return (
    <section ref={rootRef} id="neighbourhood" className="neigh">
      <div className="wrap">
        <div className="neigh-grid">
          <div className="neigh-left">
            <p className="kicker" style={{ color: 'var(--bronze)' }}>{t('neigh.kicker')}</p>
            <AnimatedText text={t('neigh.title')} className="h2" />
            {!isTouchLayout && (
              <>
                <div className="neigh-list" ref={listRef} onMouseLeave={() => move(itemRefs.current[act] ?? null)}>
                  <span className="sel-marker" style={{ top: m.top, height: m.height }} />
                  {neighbourhood.map((p, i) => (
                    <button key={p.id} ref={(el) => { itemRefs.current[i] = el; }} className={`neigh-item ${i === act ? 'active' : ''}`}
                      onMouseEnter={() => { setAct(i); }} onFocus={() => setAct(i)} onClick={() => setAct(i)} aria-pressed={i === act}>
                      <span className="roll"><span>{p.name[locale]}</span><span aria-hidden="true">{p.name[locale]}</span></span>
                    </button>
                  ))}
                </div>
                <div className="neigh-detail" ref={infoRef} aria-live="polite">
                  <h3 className="h3">{place.name[locale]}</h3>
                  <div className="neigh-times">
                    <span>🚗 {place.drive} {t('neigh.min')} · {t('neigh.drive')}</span>
                    {place.walk !== null && <span>🚶 {place.walk} {t('neigh.min')} · {t('neigh.walk')}</span>}
                  </div>
                  <p>{place.desc[locale]}</p>
                </div>
              </>
            )}
          </div>
          <div className="mapwrap mapfeather">
            <Suspense fallback={<img src="/images/neighbourhood/map.svg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}>
              <NeighbourhoodScene active={act} onSelect={setAct} />
            </Suspense>
          </div>
        </div>
        {isTouchLayout && (
          <div className="neigh-cards">
            <div className="neigh-mapstatic"><img src="/images/neighbourhood/map.svg" alt="Eastbank map — Elaris Gardens" /></div>
            <div ref={cardRef} className="keen-slider">
              {neighbourhood.map((p) => (
                <div key={p.id} className="keen-slider__slide"><div className="ncard">
                  <img src={p.img} alt={p.name[locale]} loading="lazy" />
                  <div className="in">
                    <h3 className="h3">{p.name[locale]}</h3>
                    <div className="neigh-times"><span>🚗 {p.drive} {t('neigh.min')}</span>{p.walk !== null && <span>🚶 {p.walk} {t('neigh.min')}</span>}</div>
                    <p>{p.desc[locale]}</p>
                  </div>
                </div></div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <span className="serif" style={{ fontStyle: 'italic', color: 'var(--bronze)' }}>{String(act + 1).padStart(2, '0')} / 06</span>
              <div style={{ flex: 1, height: 1, background: 'var(--muted-cream)', position: 'relative' }}>
                <span style={{ position: 'absolute', inset: 0, background: 'var(--bronze)', transformOrigin: 'left', transform: `scaleX(${(act + 1) / 6})`, transition: 'transform .4s' }} />
              </div>
              <button className="circ onLight" onClick={() => cardSlider.current?.prev()} aria-label={t('cta.prev')}>←</button>
              <button className="circ onLight" onClick={() => cardSlider.current?.next()} aria-label={t('cta.next')}>→</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================= H9 — living story ================= */
function LivingStory() {
  const { t, lp } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isPhone = useMedia('(max-width: 600px)');
  const [mState, setMState] = useState(1);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    let splitInst: any; let cleanups: (() => void)[] = [];
    let charTween: gsap.core.Tween | undefined; let cancelled = false;
    (async () => {
      try {
        const { SplitText } = await import('gsap/SplitText'); gsap.registerPlugin(SplitText);
        if (cancelled || !titleRef.current) return;
        splitInst = new (SplitText as any)(titleRef.current, { type: 'chars', aria: 'auto' });
        charTween = gsap.fromTo(splitInst.chars, { x: '100vw' }, { x: 0, duration: 1.7, stagger: 0.1, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 70%' } });
      } catch { /* visible */ }
    })();
    const ctx = gsap.context(() => {
      const wins = el.querySelectorAll('.lwin');
      gsap.fromTo(wins, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.5, stagger: 0.3, delay: 0.4, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 70%' } });
      gsap.fromTo(el.querySelector('.living-drift'), { y: '-10rem' }, { y: '5rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      if (window.matchMedia('(pointer:fine)').matches) {
        const strengths = [0.09, 0.06, 0.035];
        const tos = [...wins].map((w, i) => ({ x: gsap.quickTo(w, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(w, 'y', { duration: 1.2, ease: 'power3' }), s: strengths[i] ?? 0.05 }));
        const onMove = (e: PointerEvent) => {
          const dx = e.clientX - innerWidth / 2, dy = e.clientY - innerHeight / 2;
          tos.forEach((o) => { o.x(dx * o.s); o.y(dy * o.s); });
        };
        el.addEventListener('pointermove', onMove);
        cleanups.push(() => el.removeEventListener('pointermove', onMove));
      }
      if (window.matchMedia('(max-width:600px)').matches) {
        ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', onUpdate: (st) => setMState(st.progress < 0.5 ? 1 : 2) });
        gsap.fromTo(el.querySelector('.living-m2'), { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: '55% bottom', end: '75% bottom', scrub: true } });
      }
    });
    return () => { cancelled = true; cleanups.forEach((f) => f()); charTween?.scrollTrigger?.kill(); charTween?.kill(); splitInst?.revert?.(); ctx.revert(); };
  }, []);
  const wins = (
    <div className="wins" aria-hidden="true">
      <div className="lwin a" style={{ borderRadius: '58% 42% 55% 45% / 48% 56% 44% 52%' }}><img src="/images/living/01.jpg" alt="" loading="lazy" /></div>
      <div className="lwin b" style={{ borderRadius: '45% 55% 48% 52% / 56% 44% 58% 42%' }}><LazyVideo src="/media/living-loop.mp4" poster="/images/living/02.jpg" /></div>
      <div className="lwin c" style={{ borderRadius: '52% 48% 60% 40% / 45% 58% 42% 55%' }}><img src="/images/living/02.jpg" alt="" loading="lazy" /></div>
    </div>
  );
  if (isPhone) {
    return (
      <section ref={ref} className="living" style={{ height: REDUCED() ? undefined : '400vh', padding: 0 }}>
        <div style={{ position: 'sticky', top: 0, height: '100svh', overflow: 'hidden', padding: '6.5rem 1.5rem 3rem' }}>
          {wins}
          <div style={{ position: 'relative', zIndex: 3, opacity: mState === 1 ? 1 : 0.15, transition: 'opacity .6s' }}>
            <p className="kicker lime">{t('living.kicker')}</p>
            <h2 ref={titleRef} className="serif">{t('living.title')}</h2>
          </div>
          <div className="living-m2" style={{ position: 'absolute', left: '1.5rem', right: '1.5rem', bottom: '5rem', zIndex: 4 }}>
            <p className="serif" style={{ fontSize: '1.7rem', lineHeight: 1.3 }}>{t('living.body')}</p>
            <RollingLink to={lp('/residences')} theme="onDark">{t('cta.viewHomes')}</RollingLink>
          </div>
          <div className="story-prog" style={{ left: '1.5rem' }}><div className="story-num"><span key={mState}>{String(mState).padStart(2, '0')}</span></div></div>
        </div>
      </section>
    );
  }
  return (
    <section ref={ref} className="living">
      {wins}
      <div className="wrap living-drift" style={{ position: 'relative', zIndex: 3 }}>
        <p className="kicker lime">{t('living.kicker')}</p>
        <h2 ref={titleRef} className="serif">{t('living.title')}</h2>
        <p className="lstmt serif">{t('living.body')}</p>
        <div style={{ marginTop: '1.6rem' }}><RollingLink to={lp('/residences')} theme="onDark">{t('cta.viewHomes')}</RollingLink></div>
      </div>
    </section>
  );
}

/* ================= H12 — aerial panorama ================= */
function AerialPanorama() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const pano = el.querySelector<HTMLElement>('.aerial-pano')!;
    const setup = () => { el.style.height = `${innerHeight + 2 * Math.max(0, pano.scrollWidth - innerWidth)}px`; ScrollTrigger.refresh(); };
    const img = pano.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', setup); else setup();
    addEventListener('resize', setup);
    const ctx = gsap.context(() => {
      gsap.to(el.querySelector('.shutter.l'), { xPercent: -101, duration: 1, ease: 'power1.inOut', scrollTrigger: { trigger: el, start: 'top 65%' } });
      gsap.to(el.querySelector('.shutter.r'), { xPercent: 101, duration: 1, ease: 'power1.inOut', scrollTrigger: { trigger: el, start: 'top 65%' } });
      const chars = el.querySelectorAll('.aerial-title .ch');
      gsap.fromTo(chars, { yPercent: 15, filter: 'blur(10px)', opacity: 0 }, { yPercent: 0, filter: 'blur(0px)', opacity: 1, duration: 0.6, stagger: 0.04, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      const travel = () => {
        const over = Math.max(0, pano.scrollWidth - innerWidth);
        const bp = innerWidth > 1120 ? [0, 1] : innerWidth > 600 ? [0.15, 0.85] : [0.22, 0.78];
        return { from: -over * bp[0], to: -over * bp[1] };
      };
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
      tl.fromTo(pano, { x: () => travel().from }, { x: () => travel().to, ease: 'none', duration: 1 }, 0)
        .fromTo(el.querySelector('.cloud1'), { xPercent: 0 }, { xPercent: -10, ease: 'none', duration: 1 }, 0)
        .fromTo(el.querySelector('.cloud2'), { xPercent: 0 }, { xPercent: -20, ease: 'none', duration: 1 }, 0)
        .fromTo(el.querySelector('.cloud3'), { xPercent: 0 }, { xPercent: -30, ease: 'none', duration: 1 }, 0)
        .fromTo(el.querySelector('.aerial-title'), { xPercent: 0 }, { xPercent: -10, ease: 'none', duration: 1 }, 0)
        .to(chars, { scale: 0.7, filter: 'blur(10px)', opacity: 0, stagger: 0.04, duration: 0.4, ease: 'none' }, 0.3);
    }, el);
    return () => { removeEventListener('resize', setup); ctx.revert(); };
  }, []);
  const title = t('aerial.title');
  const reduced = REDUCED();
  return (
    <div ref={ref} className="aerial" style={{ height: reduced ? '100vh' : '220vh' }}>
      <div className="aerial-stage">
        <div className="aerial-pano">
          <div style={{ position: 'relative', height: '100%' }}>
            <img className="panoimg" src="/images/aerial/site.jpg" alt="" style={{ height: '100%', width: 'auto', maxWidth: 'none' }} />
            <span className="aerial-label" style={{ left: '24%' }}>{t('aerial.west')}</span>
            <span className="aerial-label" style={{ left: '76%' }}>{t('aerial.east')}</span>
          </div>
        </div>
        <img className="cloud cloud1" src="/images/aerial/cloud-01.png" alt="" style={{ width: '38rem', top: '6%', left: '8%' }} />
        <img className="cloud cloud2" src="/images/aerial/cloud-02.png" alt="" style={{ width: '30rem', top: '34%', left: '52%' }} />
        <img className="cloud cloud3" src="/images/aerial/cloud-03.png" alt="" style={{ width: '44rem', bottom: '4%', left: '26%' }} />
        <div className="aerial-title">
          <h2 className="serif" aria-label={title}>{title.split('').map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ display: 'inline-block' }}>{c === ' ' ? '\u00A0' : c}</span>)}</h2>
        </div>
        {!reduced && <><div className="shutter l" /><div className="shutter r" /></>}
      </div>
    </div>
  );
}

/* ================= H13 — payment ================= */
function PaymentPlan() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const isMobile = useMedia('(max-width: 600px)');
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector('.pay-img'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
      gsap.fromTo(el.querySelector('.pay-panel'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 72%' } });
      const img = el.querySelector('.pay-img img');
      gsap.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 72%' } });
      gsap.fromTo(img, { y: isMobile ? '-5rem' : '-10rem' }, { y: isMobile ? '5rem' : '10rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, [isMobile]);
  return (
    <section ref={ref} className="payment">
      <div className="pay-img"><img src={isMobile ? '/images/payment/dusk-mobile.jpg' : '/images/payment/dusk.jpg'} alt="Elaris Gardens at dusk" loading="lazy" /></div>
      <div className="pay-panel">
        <p className="kicker lime">{t('pay.kicker')}</p>
        <AnimatedText text={t('pay.title')} className="h2" />
        <div style={{ margin: '2rem 0' }}>
          {PAYMENT.map((p, i) => (
            <div className="pay-row" key={i}><span>{t(`pay.${i + 1}`)}</span><span className="pct">{p}%</span></div>
          ))}
        </div>
        <p style={{ color: 'var(--muted-cream)', fontSize: '.9rem' }}>{t('pay.note')}</p>
        <div><RollingLink to="/documents/project-guide.pdf" theme="onDark" download>{t('cta.downloadGuide')}</RollingLink></div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      <HeroFilm />
      <StoryMorph variant="home" />
      <EditorialPanel bg="/images/editorial/location.jpg" kicker={t('loc.kicker')} title={t('loc.title')}
        body={t('loc.body')} inset="/media/location-loop.mp4" insetPos="pos-ur" tone="bronze" />
      <Neighbourhood />
      <EditorialPanel bg="/images/editorial/homes.jpg" kicker={t('homes.kicker')} title={t('homes.title')}
        body={t('homes.body')} inset="/media/interior-loop.mp4" insetPos="pos-ul" tone="bronze" />
      <ResidenceSelector />
      <EditorialPanel bg="/images/editorial/work.jpg" kicker={t('work.kicker')} title={t('work.title')}
        body={t('work.body')} inset="/media/work-loop.mp4" insetPos="pos-lr" bodySide="left" />
      <WorkspaceSelector />
      <LivingStory />
      <div id="amenities">
        <EditorialPanel bg="/images/editorial/amenities.jpg" kicker={t('amen.kicker')} title={t('amen.title')}
          body={t('amen.body')} inset="/media/amenities-loop.mp4" insetPos="pos-ur" />
      </div>
      <AmenitySelector />
      <AerialPanorama />
      <PaymentPlan />
    </>
  );
}
