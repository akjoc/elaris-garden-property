import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../i18n';
import { AnimatedText, DownCue, LazyVideo, RollingLink, REDUCED } from '../components';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS: { h: [string, string]; b: [string, string][] }[] = [
  { h: ['What this prototype is', 'Ce qu’est ce prototype'], b: [[
    'Elaris Gardens is an illustrative presentation prototype created by Elaris Development Studio. The homes, workspaces, availability, plans and payment stages shown are fictional example data prepared to demonstrate a design concept. Nothing on this site is an offer to sell or lease a real property.',
    'Elaris Gardens est un prototype de présentation illustratif créé par Elaris Development Studio. Les logements, espaces de travail, disponibilités, plans et étapes de paiement présentés sont des données fictives destinées à illustrer un concept de design. Rien sur ce site ne constitue une offre de vente ou de location d’un bien réel.'], [
    'Because this is a demonstration, the forms on this site run in an isolated preview mode. When you submit an enquiry, callback, business or newsletter form, no message is sent to any server, no email is delivered, and your details are not stored in a database.',
    'S’agissant d’une démonstration, les formulaires de ce site fonctionnent en mode aperçu isolé. Lorsque vous envoyez une demande, un rappel, une demande entreprise ou le formulaire de newsletter, aucun message n’est transmis à un serveur, aucun e-mail n’est livré et vos données ne sont conservées dans aucune base.']] },
  { h: ['Information the forms ask for', 'Informations demandées par les formulaires'], b: [[
    'The demo forms ask only for the fields shown on screen: your name, email address, telephone number, preferred call window and, for business enquiries, your company name. A property reference may be pre-filled when you arrive from a property page. In preview mode this information stays in your browser tab and disappears when you leave or refresh the page. We do not write it to local storage or cookies.',
    'Les formulaires de démonstration ne demandent que les champs affichés : nom, adresse e-mail, numéro de téléphone, créneau d’appel préféré et, pour les demandes entreprise, le nom de votre société. Une référence de bien peut être pré-remplie depuis une fiche. En mode aperçu, ces informations restent dans l’onglet de votre navigateur et disparaissent à la fermeture ou à l’actualisation. Nous ne les écrivons ni en stockage local ni en cookies.'], [
    'Consent checkboxes are never pre-selected. In a future production version, optional consents (hearing about other projects, or contact by messaging apps) would only be used for the purpose described next to each checkbox, and could be withdrawn at any time.',
    'Les cases de consentement ne sont jamais pré-cochées. Dans une future version de production, les consentements facultatifs (découvrir d’autres projets, contact par messagerie) ne seraient utilisés que pour l’objectif décrit à côté de chaque case et pourraient être retirés à tout moment.']] },
  { h: ['Cookies, analytics and third parties', 'Cookies, mesure d’audience et tiers'], b: [[
    'This prototype does not set marketing cookies, does not load advertising or social-media trackers, and does not send analytics events to any third party. Fonts, images, films and documents are served from this site itself. Your browser may still cache those files locally to make later pages load faster; you can clear that cache at any time in your browser settings.',
    'Ce prototype ne dépose aucun cookie marketing, ne charge aucun traceur publicitaire ou de réseaux sociaux et n’envoie aucun événement de mesure à des tiers. Polices, images, films et documents sont servis par ce site lui-même. Votre navigateur peut conserver ces fichiers en cache local pour accélérer les pages suivantes ; vous pouvez effacer ce cache à tout moment dans ses réglages.'], [
    'If a production version later connects a real enquiry inbox, newsletter service or privacy-respecting analytics tool, this page will be updated first to name the provider, explain what is shared, and describe how long records are kept.',
    'Si une version de production relie ultérieurement une vraie boîte de réception, un service de newsletter ou un outil de mesure respectueux de la vie privée, cette page sera d’abord mise à jour pour nommer le prestataire, expliquer ce qui est partagé et préciser les durées de conservation.']] },
  { h: ['Your choices and contact', 'Vos choix et contact'], b: [[
    'Since preview mode retains nothing, there is no stored record to access, correct or delete. If you email us directly, your message will be handled by your own email provider and ours in the ordinary way. For any question about this page or the prototype, contact Elaris Development Studio at hello@elaris.example or 24 Grove Avenue, Eastbank District.',
    'Le mode aperçu ne conservant rien, il n’existe aucune donnée stockée à consulter, corriger ou supprimer. Si vous nous écrivez directement, votre message sera traité par votre fournisseur de messagerie et le nôtre de la manière habituelle. Pour toute question sur cette page ou le prototype, contactez Elaris Development Studio à hello@elaris.example ou 24 Grove Avenue, Eastbank District.']] },
];

export default function Privacy() {
  const { t, locale } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = heroRef.current; if (!el || REDUCED()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.querySelector('.bg'), { y: '-8rem' }, { y: '8rem', ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  const li = locale === 'fr' ? 1 : 0;
  return (
    <>
      <section ref={heroRef} className="cathero">
        <div className="bg" style={{ backgroundImage: 'url(/images/privacy/hero.jpg)' }} /><div className="shade" />
        <div className="wrap in"><AnimatedText text={t('priv.title')} as="h1" /></div>
        <DownCue />
      </section>
      <section className="legal">
        <div className="wrap"><div className="col">
          {SECTIONS.map((s) => (
            <React.Fragment key={s.h[0]}>
              <h2 className="serif">{s.h[li]}</h2>
              {s.b.map((p, i) => <p key={i}>{p[li]}</p>)}
            </React.Fragment>
          ))}
        </div></div>
      </section>
    </>
  );
}

export function NotFound() {
  const { t, lp } = useI18n();
  /* The 404 has no newsletter footer — also when reached via an unknown property slug. */
  useEffect(() => {
    const f = document.querySelector('footer') as HTMLElement | null;
    if (f) f.style.display = 'none';
    return () => { if (f) f.style.display = ''; };
  }, []);
  return (
    <section className="nf">
      <LazyVideo src="/media/not-found-loop.mp4" poster="/images/hero/poster-desktop.jpg" />
      <div style={{ position: 'absolute', inset: 0, background: 'rgb(46 58 38/.45)' }} />
      <div className="in">
        <h1 className="serif">{t('nf.title')}</h1>
        <p className="serif" style={{ fontSize: '1.6rem', maxWidth: '28rem', margin: '0 auto 2rem' }}>{t('nf.body')}</p>
        <RollingLink to={lp('/')} theme="onDark">{t('cta.backHome')}</RollingLink>
      </div>
    </section>
  );
}
