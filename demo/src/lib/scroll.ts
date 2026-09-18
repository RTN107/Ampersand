import Lenis from 'lenis';
import { gsap, ScrollTrigger, REDUCED } from './motion';

let lenis: Lenis | null = null;

export function initScroll(): Lenis | null {
  if (lenis || REDUCED) return lenis;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollTo(target: string | HTMLElement, offset = -72): void {
  if (lenis) {
    lenis.scrollTo(target, {
      offset,
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
}

export function lockScroll(lock: boolean): void {
  if (lock) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle('is-locked', lock);
}
