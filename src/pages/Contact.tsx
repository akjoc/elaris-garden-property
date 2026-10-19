import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useI18n, fmtArea } from '../i18n';
import { allProperties, bySlug, brand } from '../data';
import { AnimatedText, RollingButton, RollingLink, demoSubmit } from '../components';

type Tab = 'request' | 'callback' | 'business';
const phoneOk = (v: string) => /^[+\d][\d\s().-]{6,}$/.test(v.trim());

export default function Contact() {
  const { t, lp, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw === 'callback' || raw === 'business' ? raw : 'request';
  const property = bySlug(allProperties, params.get('property') ?? undefined);
  const [done, setDone] = useState(false);
  const [localTab, setLocalTab] = useState<Tab>(tab);
  useEffect(() => { setLocalTab(tab); setDone(false); }, [tab]);

  const setTab = (nt: Tab) => {
    setLocalTab(nt);
    const next = new URLSearchParams(params);
    next.set('tab', nt);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const schema = z.object({
    first: z.string().min(1, t('form.err.required')),
    last: localTab === 'business' ? z.string().optional() : z.string().min(1, t('form.err.required')),
    company: localTab === 'business' ? z.string().min(1, t('form.err.required')) : z.string().optional(),
    email: localTab === 'callback' ? z.string().optional() : z.string().email(t('form.err.email')),
    phone: z.string().refine(phoneOk, t('form.err.phone')),
    window: z.string().optional(),
    ack: z.literal(true, { errorMap: () => ({ message: t('form.err.ack') }) }),
    consentProjects: z.boolean().optional(),
    consentMsg: z.boolean().optional(),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema) as any, defaultValues: { window: '09:00–12:00' },
  });
  const biz = localTab === 'business';
  const tabs: [Tab, string][] = [['request', t('form.enquiry')], ['callback', t('form.callback')], ['business', t('form.business')]];
  const activeIdx = tabs.findIndex(([id]) => id === localTab);

  const field = (id: string, label: string, opts: any = {}) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!(errors as any)[id]} {...register(id as any)} {...opts} />
      {(errors as any)[id] && <span className="err" role="alert">{(errors as any)[id]?.message}</span>}
    </div>
  );

  return (
    <div className="contact">
      <div className="contact-media">
        <img src="/images/contact/interior.jpg" alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 45%, rgb(46 58 38/.55))' }} />
        <div className="ttl">
          <AnimatedText text={t('contact.title')} as="h1" />
          <p style={{ maxWidth: '24rem' }}>{t('contact.intro')}</p>
          <p style={{ fontSize: '.9rem' }}>{brand.address} · <a href={`mailto:${brand.email}`}>{brand.email}</a></p>
        </div>
      </div>
      <div className={`contact-panel ${biz ? 'biz' : ''}`}>
        <div className="ctabs" role="tablist" aria-label={t('nav.contact')}>
          {tabs.map(([id, label], i) => (
            <React.Fragment key={id}>
              {i > 0 && <span className={`cconn ${activeIdx >= i ? 'on' : ''}`} aria-hidden="true"><i /></span>}
              <button className="ctab" role="tab" aria-selected={localTab === id} onClick={() => setTab(id)}>{label}</button>
            </React.Fragment>
          ))}
        </div>
        {property && (
          <div className="propcontext">
            <span>{t('form.property')}</span>
            <b>{property.id} · {fmtArea(property.area, locale)}</b>
          </div>
        )}
        {done ? (
          <div role="status">
            <h2 className="serif" style={{ fontSize: '4.5rem' }}>{t('form.thanksT')}</h2>
            <p style={{ maxWidth: '26rem' }}>{t('form.thanks')}</p>
            <p style={{ color: 'var(--lime)', fontSize: '.9rem' }}>{t('form.demoNote')}</p>
            <RollingLink to={lp('/')} theme="onDark">{t('cta.backHome')}</RollingLink>
          </div>
        ) : (
          <form key={localTab} onSubmit={handleSubmit(async () => { await demoSubmit(); setDone(true); })} noValidate>
            {localTab === 'business' ? (
              <>
                {field('first', t('form.full'), { autoComplete: 'name' })}
                {field('company', t('form.company'), { autoComplete: 'organization' })}
                {field('email', t('form.email'), { type: 'email', autoComplete: 'email' })}
                {field('phone', t('form.phone'), { type: 'tel', autoComplete: 'tel' })}
              </>
            ) : localTab === 'callback' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  {field('first', t('form.first'), { autoComplete: 'given-name' })}
                  {field('last', t('form.last'), { autoComplete: 'family-name' })}
                </div>
                {field('phone', t('form.phone'), { type: 'tel', autoComplete: 'tel' })}
                <div className="field">
                  <label htmlFor="window">{t('form.window')}</label>
                  <select id="window" {...register('window')}>
                    <option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  {field('first', t('form.first'), { autoComplete: 'given-name' })}
                  {field('last', t('form.last'), { autoComplete: 'family-name' })}
                </div>
                {field('email', t('form.email'), { type: 'email', autoComplete: 'email' })}
                {field('phone', t('form.phone'), { type: 'tel', autoComplete: 'tel' })}
              </>
            )}
            <label className="check">
              <input type="checkbox" {...register('ack')} aria-invalid={!!errors.ack} />
              <span>{t('form.ack')} <Link to={lp('/privacy')}>{t('form.privacy')}</Link> *</span>
            </label>
            {errors.ack && <span className="err" role="alert" style={{ color: '#ffb4a2' }}>{t('form.err.ack')}</span>}
            <label className="check"><input type="checkbox" {...register('consentProjects')} /><span>{t('form.consentProjects')}</span></label>
            <label className="check"><input type="checkbox" {...register('consentMsg')} /><span>{t('form.consentMsg')}</span></label>
            <div style={{ marginTop: '1.6rem' }}>
              <RollingButton type="submit" theme="onDark" disabled={isSubmitting}>
                {isSubmitting ? t('form.sending') : localTab === 'callback' ? t('form.requestCall') : localTab === 'business' ? t('form.sendBusiness') : t('form.send')}
              </RollingButton>
            </div>
            <p style={{ fontSize: '.82rem', color: 'var(--muted-cream)', marginTop: '1rem' }}>{t('form.demoNote')}</p>
          </form>
        )}
      </div>
    </div>
  );
}
