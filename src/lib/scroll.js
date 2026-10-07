import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

let lenis = null;
let locks = 0;

/** Smooth scroll wired into GSAP's ticker so ScrollTrigger and Lenis share one clock. */
export function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: !prefersReducedMotion() });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  if (locks > 0) lenis.stop();

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = null;
  };
}

export const getLenis = () => lenis;

export function scrollToTarget(target, opts = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  }
}

/** Ref-counted scroll lock so overlapping overlays don't unlock each other. */
export function lockScroll(lock) {
  locks = Math.max(0, locks + (lock ? 1 : -1));
  const locked = locks > 0;
  document.documentElement.classList.toggle('is-locked', locked);
  if (lenis) locked ? lenis.stop() : lenis.start();
}
