import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../i18n';
import {
  filterHomes, filterCommercial, type ResCategory, type Wing,
} from '../data';
import { AnimatedText, RevealPara, DownCue, PropertyCard, DualRange, CAT_CHIPS, RES_BOUNDS, COM_BOUNDS, RollingButton, REDUCED } from '../components';

gsap.registerPlugin(ScrollTrigger);
const PAGE = 12;

function CatHero({ bg, title, sub }: { bg: string; title: string; sub: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector('.bg'), { y: '-10rem' }, { y: '10rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="cathero">
      <div className="bg" style={{ backgroundImage: `url(${bg})` }} /><div className="shade" />
      <div className="wrap in">
        <AnimatedText text={title} as="h1" />
        <RevealPara text={sub} />
      </div>
      <DownCue />
    </section>
  );
}

function useParamState() {
  const [params, setParams] = useSearchParams();
  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => { if (v === null || v === '') next.delete(k); else next.set(k, v); });
    setParams(next, { replace: true, preventScrollReset: true });
  };
  return { params, set };
}
const num = (v: string | null, d: number) => { const n = v ? Number(v) : NaN; return Number.isFinite(n) ? n : d; };

export function HomeFilterControls({ value, onChange }: {
  value: { cats: ResCategory[]; area: [number, number]; floor: [number, number]; balcony: boolean; garden: boolean; wings: Wing[] };
  onChange: (v: typeof value) => void;
}) {
  const { t } = useI18n();
  const toggleCat = (c: ResCategory) => onChange({ ...value, cats: value.cats.includes(c) ? value.cats.filter((x) => x !== c) : [...value.cats, c] });
  const toggleWing = (w: Wing) => onChange({ ...value, wings: value.wings.includes(w) ? value.wings.filter((x) => x !== w) : [...value.wings, w] });
  return (
    <div>
      <h3>{t('f.layout')}</h3>
      <div className="chips" role="group" aria-label={t('f.layout')}>
        <button className={`chip ${value.cats.length === 0 ? 'on' : ''}`} aria-pressed={value.cats.length === 0} onClick={() => onChange({ ...value, cats: [] })}>{t('f.all')}</button>
        {CAT_CHIPS.map((c) => (
          <button key={c.id} className={`chip ${value.cats.includes(c.id) ? 'on' : ''}`} aria-pressed={value.cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{t(c.key)}</button>
        ))}
      </div>
      <h3>{t('f.area')} (m²)</h3>
      <DualRange label={t('f.area')} min={RES_BOUNDS[0]} max={RES_BOUNDS[1]} value={value.area} onChange={(area) => onChange({ ...value, area })} format={(n) => `${n} m²`} />
      <h3>{t('f.floor')}</h3>
      <DualRange label={t('f.floor')} min={1} max={6} value={value.floor} onChange={(floor) => onChange({ ...value, floor })} />
      <h3>{t('f.features')}</h3>
      <div className="chips">
        <button className={`chip ${value.balcony ? 'on' : ''}`} aria-pressed={value.balcony} onClick={() => onChange({ ...value, balcony: !value.balcony })}>{t('f.balcony')}</button>
        <button className={`chip ${value.garden ? 'on' : ''}`} aria-pressed={value.garden} onClick={() => onChange({ ...value, garden: !value.garden })}>{t('f.garden')}</button>
      </div>
      <h3>{t('f.wing')}</h3>
      <div className="chips">
        {(['east', 'west'] as Wing[]).map((w) => (
          <button key={w} className={`chip ${value.wings.includes(w) ? 'on' : ''}`} aria-pressed={value.wings.includes(w)} onClick={() => toggleWing(w)}>{t(`wing.${w}`)}</button>
        ))}
      </div>
    </div>
  );
}
export function CommFilterControls({ value, onChange }: {
  value: { type: 'all' | 'office' | 'retail'; area: [number, number]; floor: [number, number]; wings: Wing[] };
  onChange: (v: typeof value) => void;
}) {
  const { t } = useI18n();
  const toggleWing = (w: Wing) => onChange({ ...value, wings: value.wings.includes(w) ? value.wings.filter((x) => x !== w) : [...value.wings, w] });
  return (
    <div>
      <h3>{t('f.type')}</h3>
      <div className="chips" role="group" aria-label={t('f.type')}>
        {([['all', 'f.all'], ['office', 'f.offices'], ['retail', 'f.retail']] as const).map(([id, k]) => (
          <button key={id} className={`chip ${value.type === id ? 'on' : ''}`} aria-pressed={value.type === id} onClick={() => onChange({ ...value, type: id })}>{t(k)}</button>
        ))}
      </div>
      <h3>{t('f.area')} (m²)</h3>
      <DualRange label={t('f.area')} min={COM_BOUNDS[0]} max={COM_BOUNDS[1]} value={value.area} onChange={(area) => onChange({ ...value, area })} format={(n) => `${n} m²`} />
      <h3>{t('f.floor')}</h3>
      <DualRange label={t('f.floor')} min={0} max={3} value={value.floor} onChange={(floor) => onChange({ ...value, floor })} />
      <h3>{t('f.officeWing')}</h3>
      <div className="chips">
        {(['east', 'west', 'courtyard'] as Wing[]).map((w) => (
          <button key={w} className={`chip ${value.wings.includes(w) ? 'on' : ''}`} aria-pressed={value.wings.includes(w)} onClick={() => toggleWing(w)}>{t(`wing.${w}`)}</button>
        ))}
      </div>
    </div>
  );
}

function CatalogueShell({ count, onReset, filters, drawerFilters, children }: {
  count: number; onReset: () => void; filters: React.ReactNode; drawerFilters: React.ReactNode; children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [drawer, setDrawer] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!drawer) return;
    window.__lenis?.stop(); closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => { window.__lenis?.start(); document.removeEventListener('keydown', onKey); };
  }, [drawer]);
  return (
    <div className="wrap">
      <div className="fbar" role="region" aria-label={t('cta.filters')}>
        <span aria-live="polite">{count} {t('f.results')}</span>
        <button onClick={() => setDrawer(true)} aria-expanded={drawer}>{t('cta.filters')}</button>
      </div>
      <div className="catgrid">
        <aside className="filters desktop">
          <p aria-live="polite"><span className="serif" style={{ fontSize: '2.2rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{count}</span> {t('f.results')}</p>
          {filters}
          <div style={{ marginTop: '2rem' }}><RollingButton theme="onLight small" onClick={onReset}>{t('cta.reset')}</RollingButton></div>
        </aside>
        <div>{children}</div>
      </div>
      <div className={`fdrawer ${drawer ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={t('cta.filters')} aria-hidden={!drawer}>
        <div className="bk" onClick={() => setDrawer(false)} />
        <div className="panel" data-lenis-prevent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span aria-live="polite"><span className="serif" style={{ fontSize: '2rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{count}</span> {t('f.results')}</span>
            <button ref={closeRef} className="circ onLight" onClick={() => setDrawer(false)} aria-label={t('nav.close')}>✕</button>
          </div>
          {drawerFilters}
          <div style={{ display: 'flex', gap: '.7rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <RollingButton theme="solid small" onClick={() => setDrawer(false)}>{t('cta.results')}</RollingButton>
            <RollingButton theme="onLight small" onClick={onReset}>{t('cta.reset')}</RollingButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Results({ list, base, shown, onMore, onReset }: { list: ReturnType<typeof filterHomes>; base: string; shown: number; onMore: () => void; onReset: () => void }) {
  const { t } = useI18n();
  useEffect(() => { const id = setTimeout(() => ScrollTrigger.refresh(), 80); return () => clearTimeout(id); }, [list.length, shown]);
  if (list.length === 0) return (
    <div style={{ padding: '3rem 0' }}>
      <p className="serif" style={{ fontSize: '1.8rem', maxWidth: '26rem' }}>{t('f.empty')}</p>
      <RollingButton theme="onLight" onClick={onReset}>{t('cta.reset')}</RollingButton>
    </div>
  );
  return (
    <>
      <div className="cards">{list.slice(0, shown).map((p) => <PropertyCard key={p.slug} p={p} base={base} />)}</div>
      {shown < list.length && (
        <div style={{ textAlign: 'center', marginTop: '2.6rem' }}>
          <RollingButton theme="onLight" onClick={onMore}>{t('cta.showMore')} ({list.length - shown})</RollingButton>
        </div>
      )}
    </>
  );
}

export default function Residences() {
  const { t } = useI18n();
  const { params, set } = useParamState();
  const value = {
    cats: (params.get('cats')?.split(',').filter(Boolean) ?? []) as ResCategory[],
    area: [num(params.get('a0'), RES_BOUNDS[0]), num(params.get('a1'), RES_BOUNDS[1])] as [number, number],
    floor: [num(params.get('f0'), 1), num(params.get('f1'), 6)] as [number, number],
    balcony: params.get('balcony') === '1', garden: params.get('garden') === '1',
    wings: (params.get('wings')?.split(',').filter(Boolean) ?? []) as Wing[],
  };
  const shown = num(params.get('shown'), PAGE);
  const list = useMemo(() => filterHomes(value), [params.toString()]); // eslint-disable-line
  const onChange = (v: typeof value) => set({
    cats: v.cats.join(',') || null, a0: String(v.area[0]), a1: String(v.area[1]),
    f0: String(v.floor[0]), f1: String(v.floor[1]), balcony: v.balcony ? '1' : null,
    garden: v.garden ? '1' : null, wings: v.wings.join(',') || null, shown: null,
  });
  const reset = () => set({ cats: null, a0: null, a1: null, f0: null, f1: null, balcony: null, garden: null, wings: null, shown: null });
  return (
    <>
      <CatHero bg="/images/catalogue/homes.jpg" title={t('res.title')} sub={t('res.sub')} />
      <CatalogueShell count={list.length} onReset={reset}
        filters={<HomeFilterControls value={value} onChange={onChange} />}
        drawerFilters={<HomeFilterControls value={value} onChange={onChange} />}>
        <Results list={list} base="/residences" shown={shown} onMore={() => set({ shown: String(shown + PAGE) })} onReset={reset} />
      </CatalogueShell>
    </>
  );
}

export function CommercialCatalogue() {
  const { t } = useI18n();
  const { params, set } = useParamState();
  const ty = params.get('type');
  const value = {
    type: (ty === 'office' || ty === 'retail' ? ty : 'all') as 'all' | 'office' | 'retail',
    area: [num(params.get('a0'), COM_BOUNDS[0]), num(params.get('a1'), COM_BOUNDS[1])] as [number, number],
    floor: [num(params.get('f0'), 0), num(params.get('f1'), 3)] as [number, number],
    wings: (params.get('wings')?.split(',').filter(Boolean) ?? []) as Wing[],
  };
  const shown = num(params.get('shown'), PAGE);
  const list = useMemo(() => filterCommercial(value), [params.toString()]); // eslint-disable-line
  const onChange = (v: typeof value) => set({
    type: v.type === 'all' ? null : v.type, a0: String(v.area[0]), a1: String(v.area[1]),
    f0: String(v.floor[0]), f1: String(v.floor[1]), wings: v.wings.join(',') || null, shown: null,
  });
  const reset = () => set({ type: null, a0: null, a1: null, f0: null, f1: null, wings: null, shown: null });
  return (
    <>
      <CatHero bg="/images/catalogue/commercial.jpg" title={t('com.title')} sub={t('com.sub')} />
      <CatalogueShell count={list.length} onReset={reset}
        filters={<CommFilterControls value={value} onChange={onChange} />}
        drawerFilters={<CommFilterControls value={value} onChange={onChange} />}>
        <Results list={list} base="/commercial" shown={shown} onMore={() => set({ shown: String(shown + PAGE) })} onReset={reset} />
      </CatalogueShell>
    </>
  );
}
