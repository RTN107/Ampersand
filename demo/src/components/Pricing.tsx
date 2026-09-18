import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { pricing } from '../lib/content';
import {
  ORDER_LABELS,
  ORDER_OPTIONS,
  WAREHOUSE_LABELS,
  WAREHOUSE_OPTIONS,
  tierFor,
  type OrderVolume,
  type Tier,
  type WarehouseCount,
} from '../lib/tier';
import { openQuote } from '../lib/bus';
import { gsap, REDUCED } from '../lib/motion';

export default function Pricing() {
  const root = useRef<HTMLElement>(null);
  const [w, setW] = useState<WarehouseCount | null>(null);
  const [o, setO] = useState<OrderVolume | null>(null);
  const picked: Tier | null = w && o ? tierFor(w, o) : null;

  useEffect(() => {
    const el = root.current;
    if (!el || REDUCED) return;
    const ctx = gsap.context(() => {
      gsap.from('.tier', {
        y: 48,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.pricing__grid', start: 'top 78%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Cursor-following highlight on Gold.
  const spotlight = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section className="pricing" id="pricing" ref={root}>
      <div className="container">
        <div className="pricing__head">
          <h2 data-reveal>{pricing.title}</h2>
        </div>

        <div className="pricing__grid">
          {pricing.tiers.map((t, i) => {
            const gold = i === 3;
            return (
              <article
                className={`tier tier--${i}${picked === t.name ? ' is-picked' : ''}`}
                key={t.name}
                onMouseMove={gold ? spotlight : undefined}
              >
                {gold && <div className="tier__snake" aria-hidden="true" />}
                <div className="tier__name">
                  <h3>{t.name}</h3>
                  {picked === t.name && <span className="tier__pick">Fits you</span>}
                </div>
                <p className="tier__limits">
                  <span>{t.warehouses}</span>
                  <span>{t.orders}</span>
                </p>
                <ul className="tier__includes">
                  {t.includes.map((inc) => (
                    <li key={inc}>{inc}</li>
                  ))}
                </ul>
                <p className="tier__note">{t.note}</p>
                <button
                  type="button"
                  className={`btn ${gold ? 'btn--brass' : 'btn--ghost'}`}
                  onClick={() => openQuote(t.preset as WarehouseCount)}
                >
                  Get a quote
                </button>
              </article>
            );
          })}
        </div>

        <div className="picker" data-reveal>
          <div className="picker__row">
            <span className="picker__label">{pricing.picker.warehousesLabel}</span>
            <div className="seg" role="group" aria-label={pricing.picker.warehousesLabel}>
              {WAREHOUSE_OPTIONS.map((opt) => (
                <button key={opt} type="button" aria-pressed={w === opt} onClick={() => setW(opt)}>
                  {WAREHOUSE_LABELS[opt].replace(' warehouse', '')}
                </button>
              ))}
            </div>
          </div>
          <div className="picker__row">
            <span className="picker__label">{pricing.picker.ordersLabel}</span>
            <div className="seg" role="group" aria-label={pricing.picker.ordersLabel}>
              {ORDER_OPTIONS.map((opt) => (
                <button key={opt} type="button" aria-pressed={o === opt} onClick={() => setO(opt)}>
                  {ORDER_LABELS[opt].replace(' or more', '+')}
                </button>
              ))}
            </div>
          </div>
          <div className="picker__result" aria-live="polite">
            <strong className={picked === 'Gold' ? 'is-gold' : ''}>
              {picked ?? pricing.picker.title}
            </strong>
            <p>{pricing.picker.rule}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
