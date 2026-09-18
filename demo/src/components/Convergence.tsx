import { useEffect, useRef } from 'react';
import Amp from './Amp';
import { convergence } from '../lib/content';
import { gsap, REDUCED } from '../lib/motion';

/** Four separate tools slide together and fuse into one surface. */
export default function Convergence() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (REDUCED) {
      el.querySelectorAll<HTMLElement>('.conv__tile').forEach((t) => (t.style.opacity = '0'));
      el.querySelector<HTMLElement>('.conv__fused')!.style.opacity = '1';
      el.querySelector<HTMLElement>('.conv__text--before')!.style.opacity = '0';
      el.querySelector<HTMLElement>('.conv__text--after')!.style.opacity = '1';
      return;
    }
    const ctx = gsap.context(() => {
      const tiles = gsap.utils.toArray<HTMLElement>('.conv__tile');
      const scatter = [
        { x: -74, y: -66, r: -9 },
        { x: 86, y: -44, r: 7 },
        { x: -64, y: 76, r: 6 },
        { x: 92, y: 62, r: -8 },
      ];
      gsap.set(tiles, {
        x: (i) => scatter[i].x,
        y: (i) => scatter[i].y,
        rotation: (i) => scatter[i].r,
        scale: 0.9,
      });
      gsap.set('.conv__text--after', { y: 14 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 52%', toggleActions: 'play none none reverse' },
      });
      // Explicit, absolute timings so there's real time to read each line:
      // a hold before anything moves, a beat once the tiles have assembled,
      // then a crossfade into the "one system" line. Scaled proportionally
      // to land the whole sequence at exactly 3.25s, same rhythm, tighter.
      tl.to(tiles, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.28, ease: 'power3.inOut', stagger: 0.05 }, 0.51)
        .to(tiles, { opacity: 0, scale: 0.985, duration: 0.45, ease: 'power2.inOut' }, 2.29)
        .fromTo(
          '.conv__fused',
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.63, ease: 'power3.out' },
          2.42,
        )
        .to('.conv__text--before', { opacity: 0, y: -12, duration: 0.38, ease: 'power2.inOut' }, 2.23)
        .to('.conv__text--after', { opacity: 1, y: 0, duration: 0.58, ease: 'power3.out' }, 2.67);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="conv" id="why" ref={root}>
      <div className="container conv__grid">
        <div className="conv__copy">
          <div className="conv__text conv__text--before">
            <h2>{convergence.before.title}</h2>
          </div>
          <div className="conv__text conv__text--after" aria-hidden="true">
            <h2>{convergence.after.title}</h2>
            <p className="lede">{convergence.after.body}</p>
          </div>
        </div>
        <div className="conv__stage" aria-hidden="true">
          {convergence.tiles.map((t) => (
            <div className="conv__tile" key={t}>
              {t}
            </div>
          ))}
          <div className="conv__fused">
            <Amp />
            <span>Flowdeck</span>
          </div>
        </div>
      </div>
    </section>
  );
}
