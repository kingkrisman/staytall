import { gsap } from './gsap';

/**
 * Clones a garment from `fromEl`, arcs it into the bag button, then bumps the bag.
 */
export function flyToCart(fromEl) {
  const target = document.getElementById('cartBtn');
  const svg = fromEl?.querySelector('svg.garment') || fromEl;
  if (!svg || !target) return;

  const a = svg.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const clone = svg.cloneNode(true);
  Object.assign(clone.style, {
    position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
    zIndex: 9000, pointerEvents: 'none', margin: 0, transform: 'none', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.5))',
  });
  document.body.appendChild(clone);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  const tl = gsap.timeline({ onComplete: () => clone.remove() });
  tl.to(clone, { x: dx, duration: 0.9, ease: 'power2.in' }, 0)
    .to(clone, { y: dy, duration: 0.9, ease: 'back.in(2.4)' }, 0)
    .to(clone, { scale: 0.08, rotation: 200, duration: 0.9, ease: 'power3.in' }, 0)
    .to(clone, { opacity: 0, duration: 0.15 }, 0.8)
    .fromTo(target, { scale: 1.35 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' }, 0.85);
}
