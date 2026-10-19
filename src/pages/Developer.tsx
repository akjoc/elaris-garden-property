import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../i18n';
import { portfolio } from '../data';
import { AnimatedText, RevealPara, DownCue, RollingLink, useMedia, REDUCED } from '../components';

gsap.registerPlugin(ScrollTrigger);

function Portfolio() {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);
  const isSmall = useMedia('(max-width: 1120px)') || REDUCED();
  useEffect(() => {
    if (isSmall || REDUCED() || !ref.current) return;
    const el = ref.current;
    const st = ScrollTrigger.create({
      trigger: el, start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => {
        const n = Math.min(5, Math.floor(s.progress * 6));
        gsap.set(el.querySelector('.port-fill'), { scaleX: s.progress });
        if (n !== stageRef.current) {
          const dir = n > stageRef.current ? 1 : -1;
          const slides = el.querySelectorAll('.port-slide');
          const prev = slides[stageRef.current] as HTMLElement; const next = slides[n] as HTMLElement;
          gsap.set(next, { zIndex: 3, left: dir > 0 ? 0 : 'auto', right: dir > 0 ? 'auto' : 0 });
          gsap.fromTo(next, { width: '0%' }, { width: '100%', duration: 0.8, ease: 'power1.inOut' });
          gsap.to(prev, { width: '0%', duration: 0.8, ease: 'power1.inOut', delay: 0.05 });
          const txt = el.querySelector('.port-swap');
          gsap.fromTo(txt, { opacity: 0, y: dir * 16 }, { opacity: 1, y: 0, duration: 0.8 });
          stageRef.current = n; setStage(n);
        }
      },
    });
    return () => { st.kill(); };
  }, [isSmall]);
  const [msel, setMsel] = useState(false);
  if (isSmall) {
    const p = portfolio[stage];
    return (
      <div className="portfolio port-m">
        <div className="wrap">
          <p className="kicker lime">{t('dev.portfolio')}</p>
          <div className={`msel ${msel ? 'open' : ''}`} style={{ borderColor: 'var(--muted-cream)' }}>
            <button className="msel-head" aria-expanded={msel} onClick={() => setMsel(!msel)} style={{ color: 'var(--ivory)' }}>
              <span>{p.name}</span><span className="chev">⌄</span>
            </button>
            <div className="msel-body"><div className="msel-bodyIn">
              {portfolio.map((x, i) => (
                <button key={x.name} style={{ color: 'var(--ivory)' }} aria-pressed={i === stage} onClick={() => { setStage(i); setMsel(false); }}>{x.name}</button>
              ))}
            </div></div>
          </div>
          <img src={p.img} alt={p.name} loading="lazy" />
          <h3 className="h2 serif" style={{ marginTop: '1.2rem' }}>{p.name}</h3>
          <p style={{ color: 'var(--lime)', fontStyle: 'italic' }} className="serif">{p.loc[locale]}</p>
          <p>{p.desc[locale]}</p>
          <p aria-hidden="true">{String(stage + 1).padStart(2, '0')} / 06</p>
        </div>
      </div>
    );
  }
  const p = portfolio[stage];
  return (
    <div ref={ref} className="portfolio portfolio-pin" style={{ height: REDUCED() ? '100vh' : '1000vh' }}>
      <div className="port-stage">
        <div className="port-text">
          <p className="kicker lime">{t('dev.portfolio')}</p>
          <div className="port-swap" aria-live="polite">
            <h3 className="serif" style={{ fontSize: '3.6rem', margin: '1rem 0 .4rem' }}>{p.name}</h3>
            <p className="serif" style={{ fontStyle: 'italic', color: 'var(--lime)', fontSize: '1.4rem' }}>{p.loc[locale]}</p>
            <p style={{ maxWidth: '26rem' }}>{p.desc[locale]}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2.4rem' }} aria-hidden="true">
            <span className="serif" style={{ fontSize: '1.3rem' }}>{String(stage + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgb(253 251 239/.3)', position: 'relative' }}>
              <span className="port-fill" style={{ position: 'absolute', inset: 0, background: 'var(--lime)', transformOrigin: 'left', transform: 'scaleX(0)' }} />
            </div>
            <span className="serif">06</span>
          </div>
        </div>
        <div className="port-img">
          {portfolio.map((x, i) => (
            <div key={x.name} className="port-slide" style={{ width: i === 0 ? '100%' : '0%', zIndex: i === 0 ? 2 : 1 }} aria-hidden={i !== stage}>
              <img src={x.img} alt={i === stage ? x.name : ''} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Developer() {
  const { t, lp } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const stmtRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (REDUCED()) return;
    const ctx = gsap.context(() => {
      const h = heroRef.current;
      if (h) gsap.fromTo(h.querySelector('.bg'), { y: '-10rem' }, { y: '10rem', ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } });
      const s = stmtRef.current;
      if (s) {
        gsap.fromTo(s.querySelectorAll('.dm'), { clipPath: 'circle(0% at 50% 50%)' },
          { clipPath: 'circle(78% at 50% 50%)', duration: 1.2, stagger: 0.7, ease: 'power2.inOut', scrollTrigger: { trigger: s, start: 'top 70%' } });
        gsap.utils.toArray<HTMLElement>(s.querySelectorAll('.dm img')).forEach((img) =>
          gsap.fromTo(img, { y: '-6%' }, { y: '6%', ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } }));
      }
    });
    return () => ctx.revert();
  }, []);
  return (
    <>
      <section ref={heroRef} className="cathero">
        <div className="bg" style={{ backgroundImage: 'url(/images/developer/hero.jpg)' }} /><div className="shade" />
        <div className="wrap in">
          <p className="kicker lime">{t('dev.kicker')}</p>
          <AnimatedText text={t('dev.title')} as="h1" />
          <RevealPara text={t('dev.intro')} />
          <div style={{ marginTop: '1.2rem' }}><RollingLink to={lp('/contact')} theme="onDark">{t('cta.contactUs')}</RollingLink></div>
        </div>
        <DownCue />
      </section>
      <section ref={stmtRef} className="dev-stmt">
        <div className="wrap">
          <AnimatedText text={t('dev.stmt')} className="h1" split="chars" />
          <div style={{ maxWidth: '32rem' }}><RevealPara text={t('dev.stmtBody')} /></div>
          <div className="dev-masks">
            <div className="dm" style={{ borderRadius: '62% 38% 55% 45% / 48% 58% 42% 52%' }}><img src="/images/developer/hero.jpg" alt="" loading="lazy" /></div>
            <div className="dm" style={{ borderRadius: '42% 58% 45% 55% / 58% 44% 56% 42%' }}><img src="/images/developer/secondary.jpg" alt="" loading="lazy" /></div>
          </div>
        </div>
      </section>
      <Portfolio />
      <section className="dev-stmt">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <AnimatedText text={t('dev.final')} className="h2" />
            <RevealPara text={t('dev.finalBody')} />
            <div style={{ marginTop: '1.4rem' }}><RollingLink to={lp('/contact?tab=business')} theme="onLight">{t('cta.business')}</RollingLink></div>
          </div>
          <div className="dm" style={{ borderRadius: '55% 45% 52% 48% / 48% 56% 44% 52%', overflow: 'hidden', aspectRatio: '1/1' }}>
            <img src="/images/developer/desk.jpg" alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>
    </>
  );
}
