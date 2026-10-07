import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

/**
 * Blend-mode cursor ring + dot, contextual labels via [data-cursor],
 * and magnetic pull for every .magnetic element (event-delegated, so it covers late-mounted UI).
 */
export default function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    gsap.set([ring.current, dot.current], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' });
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.1, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.1, ease: 'power3' });

    let magnet = null;
    let hoverEl = null;

    const releaseMagnet = () => {
      if (!magnet) return;
      gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
      magnet = null;
    };

    const onMove = (e) => {
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);

      const m = e.target.closest?.('.magnetic');
      if (m !== magnet) releaseMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const strength = parseFloat(m.dataset.strength || 0.35);
        gsap.to(m, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.5,
          ease: 'power3.out',
        });
      }
    };

    const onOver = (e) => {
      const el = e.target.closest?.('[data-cursor], a, button, input, [role="button"]');
      if (el === hoverEl) return;
      hoverEl = el;
      const text = el?.dataset?.cursor || '';
      label.current.textContent = text;
      ring.current.classList.toggle('is-label', !!text);
      ring.current.classList.toggle('is-hover', !!el && !text);
    };

    const onDown = () => gsap.to(ring.current, { scale: 0.75, duration: 0.2 });
    const onUp = () => gsap.to(ring.current, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const onLeave = () => gsap.to([ring.current, dot.current], { opacity: 0, duration: 0.3 });
    const onEnter = () => gsap.to([ring.current, dot.current], { opacity: 1, duration: 0.3 });

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={ring}><span className="cursor__label" ref={label} /></div>
      <div className="cursor-dot" ref={dot} />
    </>
  );
}
