import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../i18n';
import { AnimatedText, RevealPara, DownCue, RollingButton, StoryMorph, EditorialPanel, RollingLink, REDUCED } from '../components';
import { WorkspaceSelector } from './Home';

gsap.registerPlugin(ScrollTrigger);

export default function Workspaces() {
  const { t, lp } = useI18n();
  const [film, setFilm] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = heroRef.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector('.bg'), { y: '-10rem' }, { y: '10rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    if (!film) { videoRef.current?.pause(); return; }
    window.__lenis?.stop(); document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFilm(false); };
    document.addEventListener('keydown', onKey);
    return () => { window.__lenis?.start(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [film]);
  return (
    <>
      <section ref={heroRef} className="cathero">
        <div className="bg" style={{ backgroundImage: 'url(/images/work/hero.jpg)' }} /><div className="shade" />
        <div className="wrap in">
          <p className="kicker lime">{t('ws.kicker')}</p>
          <AnimatedText text={t('ws.title')} as="h1" />
          <p className="kicker" style={{ color: 'var(--lime)', fontSize: '1rem' }}>{t('ws.sub')}</p>
          <RevealPara text={t('ws.body')} />
          <div style={{ marginTop: '1.4rem' }}>
            <RollingButton theme="onDark" onClick={() => setFilm(true)}>{t('cta.watch')}</RollingButton>
          </div>
        </div>
        <DownCue />
      </section>
      <StoryMorph variant="work" />
      <WorkspaceSelector brochure />
      <EditorialPanel bg="/images/work/panorama.jpg" kicker={t('amen.dining')} title={t('ws.panoT')} body={t('ws.pano')}>
        <div style={{ marginTop: '1rem' }}><RollingLink to={lp('/commercial')} theme="onLight small">{t('cta.viewWork')}</RollingLink></div>
      </EditorialPanel>
      {film && (
        <div className={`modal ${film ? 'on' : ''}`} role="dialog" aria-modal="true" aria-label={t('cta.watch')}>
          <div className="bk" onClick={() => setFilm(false)} />
          <div className="box">
            <button ref={closeRef} className="circ x" onClick={() => setFilm(false)} aria-label={t('nav.close')}>✕</button>
            <video ref={videoRef} src="/media/presentation-film.mp4" poster="/images/work/panorama.jpg" controls playsInline />
          </div>
        </div>
      )}
    </>
  );
}
