import { useEffect, useRef } from 'react';
import AskBar from './AskBar';
import { hero } from '../lib/content';
import { gsap, REDUCED } from '../lib/motion';
import { openQuote } from '../lib/bus';

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (REDUCED || !root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.35 });
      tl.from('.hero__line > span', {
        yPercent: 110,
        opacity: 0,
        filter: 'blur(12px)',
        duration: 1.4,
        stagger: 0.14,
        clearProps: 'filter',
      })
        .from('.hero__sub', { y: 22, opacity: 0, duration: 1.1 }, '-=0.8')
        .from('.hero__ask', { y: 18, opacity: 0, duration: 1.1 }, '-=0.8')
        .from('.hero__actions', { y: 14, opacity: 0, duration: 1 }, '-=0.8')
        .from('.hero__scrollhint', { opacity: 0, duration: 1.2 }, '-=0.5');

      // Text moves slower than the page and fades as the field dims.
      gsap.to('.hero__inner', {
        yPercent: -16,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="hero" ref={root}>
      <span id="top" />
      <div className="hero__vignette" aria-hidden="true" />
      <div className="hero__inner">
        <h1 className="hero__title">
          {hero.lines.map((line) => (
            <span className="hero__line" key={line}>
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hero__sub lede">{hero.sub}</p>
        <div className="hero__ask">
          <AskBar />
        </div>
        <div className="hero__actions">
          <button type="button" className="btn btn--ghost" onClick={() => openQuote()}>
            Get a quote
          </button>
          <span className="hero__note">{hero.note}</span>
        </div>
      </div>
      <div className="hero__scrollhint" aria-hidden="true" />
    </section>
  );
}
