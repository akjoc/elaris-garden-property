import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useKeenSlider } from 'keen-slider/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n, fmtArea } from '../i18n';
import { residences, commercial, bySlug, DETAIL_GALLERY_HOME, DETAIL_GALLERY_WORK, type Property } from '../data';
import {
  AnimatedText, RevealPara, RollingLink, RollingButton, PlanSVG, FloorDiagram, Cutaway,
  PropertyCard, OrganicGallery, shareProperty, downloadPropertyPdf, REDUCED,
} from '../components';
import { NotFound } from './Privacy';

gsap.registerPlugin(ScrollTrigger);

export function PlanTabs({ p, compact = false }: { p: Property; compact?: boolean }) {
  const { t } = useI18n();
  const uid = React.useId().replace(/[:]/g, '');
  const isHome = p.kind === 'home';
  const tabs = isHome ? (['3d', 'layout', 'floor'] as const) : (['layout', 'floor'] as const);
  const labels: Record<string, string> = { '3d': t('p.3d'), layout: t('p.layout'), floor: t('p.floorTab') };
  const [tab, setTab] = useState<string>(isHome ? '3d' : 'layout');
  return (
    <div>
      <div className="plantabs" role="tablist" aria-label={p.id}>
        {tabs.map((id, i) => (
          <React.Fragment key={id}>
            {i > 0 && <span className="conn" />}
            <button className="plantab" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)}>{labels[id]}</button>
          </React.Fragment>
        ))}
      </div>
      <div className="mediabox" style={compact ? { aspectRatio: '4/3' } : undefined}>
        {tabs.map((id) => (
          <div key={id} className="layer" role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}
            style={{ opacity: tab === id ? 1 : 0, pointerEvents: tab === id ? 'auto' : 'none' }} aria-hidden={tab !== id}>
            {id === '3d' && <Cutaway p={p} />}
            {id === 'layout' && <PlanSVG p={p} />}
            {id === 'floor' && <FloorDiagram p={p} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PropertySummary({ p, onEnquire }: { p: Property; onEnquire?: () => void }) {
  const { t, lp, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="kicker" style={{ color: 'var(--bronze)' }}>
        {p.kind === 'home' ? t(`cat.${p.category}`) : p.kind === 'office' ? t('p.office') : t('p.retail')} · {t(`wing.${p.wing}`)}
        {p.status === 'sold' && ` · ${t('p.sold')}`}
      </p>
      <div style={{ display: 'flex', gap: '1.4rem', flexWrap: 'wrap', margin: '.8rem 0' }}>
        <span><strong className="serif" style={{ fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{fmtArea(p.area, locale)}</strong></span>
        <span>{t('p.floor')} {p.floor}</span>
        {p.balcony && <span>▭ {t('f.balcony')}</span>}{p.garden && <span>❀ {t('f.garden')}</span>}
      </div>
      <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
        <RollingLink to={lp(`/contact?property=${p.slug}${p.kind !== 'home' ? '&tab=business' : ''}`)} theme="solid small">{t('cta.enquire')}</RollingLink>
        <RollingButton theme="onLight small" onClick={() => shareProperty(p, t, setCopied)}>{copied ? t('cta.copied') : t('cta.share')}</RollingButton>
        {copied && <span className="visually-hidden" role="status">{t('cta.copied')}</span>}
      </div>
      {onEnquire && <span className="visually-hidden" />}
    </div>
  );
}

export default function Detail({ kind }: { kind: 'home' | 'commercial' }) {
  const { slug } = useParams();
  const { t, lp, locale } = useI18n();
  const list = kind === 'home' ? residences : commercial;
  const p = bySlug(list, slug);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const stmtRef = useRef<HTMLElement>(null);
  const related = list.filter((x) => x.slug !== slug && (kind === 'home' ? x.category === p?.category : x.kind === p?.kind)).slice(0, 8);
  const [relRef, relSlider] = useKeenSlider<HTMLDivElement>({ slides: { perView: 'auto', spacing: 18 } });

  useEffect(() => {
    if (!p || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(infoRef.current?.querySelectorAll('.stag') ?? [], { y: '2rem', opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.15 });
      const st = stmtRef.current;
      if (st) {
        gsap.fromTo(st.querySelector('.floatimg'), { y: '-10rem' }, { y: 0, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo(st.querySelector('.plant'), { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });
    return () => ctx.revert();
  }, [p?.slug]);

  if (!p) return <NotFound />;
  const isHome = p.kind === 'home';
  const firstRooms = p.rooms.slice(0, 4); const restRooms = p.rooms.slice(4);
  const backTo = lp(kind === 'home' ? '/residences' : '/commercial');
  return (
    <>
      <div className="detail">
        <div className="wrap">
          <Link to={backTo} className="serif" style={{ fontStyle: 'italic', color: 'var(--bronze)', textDecoration: 'none', fontSize: '1.2rem' }}>← {t('cta.back')}</Link>
          <div className="detail-grid" style={{ marginTop: '1.6rem' }}>
            <div ref={infoRef}>
              <p className="kicker stag" style={{ color: 'var(--bronze)' }}>
                {isHome ? t(`cat.${p.category}`) : p.kind === 'office' ? t('p.office') : t('p.retail')}
                {p.status === 'sold' && ` · ${t('p.sold')}`}
              </p>
              <h1 className="d-id stag">{p.id}</h1>
              <p className="stag">{t('p.area')}: <span className="serif" style={{ fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--bronze)' }}>{fmtArea(p.area, locale)}</span>
                {'  ·  '}{t('p.floor')} {p.floor} · {t(`wing.${p.wing}`)}</p>
              <table className="area-table stag"><tbody>
                {firstRooms.map((r) => <tr key={r.key}><td>{t(`room.${r.key}`)}</td><td>{r.area.toFixed(1)} m²</td></tr>)}
              </tbody></table>
              {restRooms.length > 0 && (
                <>
                  <div className={`morewrap ${expanded ? 'open' : ''}`}><div>
                    <table className="area-table" style={{ marginTop: 0 }}><tbody>
                      {restRooms.map((r) => <tr key={r.key}><td>{t(`room.${r.key}`)}</td><td>{r.area.toFixed(1)} m²</td></tr>)}
                    </tbody></table>
                  </div></div>
                  <button className={`morebtn ${expanded ? 'open' : ''}`} aria-expanded={expanded} onClick={() => { setExpanded(!expanded); setTimeout(() => ScrollTrigger.refresh(), 550); }}>
                    {expanded ? t('p.less') : t('p.more')} <span className="chev">⌄</span>
                  </button>
                </>
              )}
              <p className="stag" style={{ maxWidth: '26rem' }}>{isHome ? t('p.home.d') : p.kind === 'office' ? t('p.office.d') : t('p.retail.d')}</p>
              <div className="stag" style={{ display: 'flex', gap: '1rem', color: 'var(--sage)', margin: '1rem 0 1.6rem' }}>
                <span>⌂ {t(`wing.${p.wing}`)}</span>
                {p.balcony && <span>▭ {t('f.balcony')}</span>}{p.garden && <span>❀ {t('f.garden')}</span>}
              </div>
              <div className="stag" style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap' }}>
                <RollingLink to={lp(`/contact?property=${p.slug}${!isHome ? '&tab=business' : ''}`)} theme="solid">{t('cta.enquire')}</RollingLink>
                <RollingButton theme="onLight" onClick={() => downloadPropertyPdf(p, t)}>{t('cta.downloadPdf')}</RollingButton>
                <RollingButton theme="onLight" onClick={() => shareProperty(p, t, setCopied)}>{copied ? t('cta.copied') : t('cta.share')}</RollingButton>
              </div>
              {copied && <span role="status" className="visually-hidden">{t('cta.copied')}</span>}
            </div>
            <div className="d-media"><PlanTabs p={p} /></div>
          </div>
        </div>
        <section ref={stmtRef} className="stmt">
          <img className="plant" src="/images/cutouts/plant.png" alt="" loading="lazy" />
          <div className="wrap">
            <AnimatedText text={isHome ? t('detail.stmtH') : t('detail.stmtWorkH')} />
            <div style={{ maxWidth: '30rem' }}><RevealPara text={isHome ? t('detail.stmt') : t('detail.stmtWork')} /></div>
            <img className="floatimg" src={isHome ? '/images/story/interior-02.jpg' : '/images/work/lobby.jpg'} alt="" loading="lazy" />
          </div>
        </section>
        <OrganicGallery images={isHome ? DETAIL_GALLERY_HOME : DETAIL_GALLERY_WORK} />
        <section className="related">
          <div className="wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <AnimatedText text={isHome ? t('p.relatedHomes') : t('p.relatedWork')} className="h2" />
              <div style={{ display: 'flex', gap: '.7rem' }}>
                <button className="circ onLight" onClick={() => relSlider.current?.prev()} aria-label={t('cta.prev')}>←</button>
                <button className="circ onLight" onClick={() => relSlider.current?.next()} aria-label={t('cta.next')}>→</button>
              </div>
            </div>
            <div ref={relRef} className="keen-slider rel-keen" style={{ marginTop: '2rem' }}>
              {related.map((r) => (
                <div className="keen-slider__slide" key={r.slug}>
                  <PropertyCard p={r} base={kind === 'home' ? '/residences' : '/commercial'} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem' }}><RollingLink to={backTo} theme="onLight">{kind === 'home' ? t('cta.browseHomes') : t('cta.viewWork')}</RollingLink></div>
          </div>
        </section>
      </div>
    </>
  );
}
