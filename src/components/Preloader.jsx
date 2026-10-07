import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { Mark } from './Brand';

export default function Preloader({ onDone }) {
  const root = useRef(null);
  const num = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const counter = { v: 0 };
      const fast = prefersReducedMotion();
      // Wait for the brand fonts, but never let a slow font request hold the page hostage.
      const fontsReady = Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 1500)),
      ]);

      gsap.set(q('.m-head, .m-stem'), { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(q('.m-star'), { scale: 0, rotation: -180, transformOrigin: '50% 50%' });

      const tl = gsap.timeline({ paused: true });
      tl.to(q('.m-stem'), { scaleY: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
        .to(q('.m-head'), { scaleY: 1, duration: 0.7, ease: 'expo.out' }, '-=0.6')
        .to(q('.m-star'), { scale: 1, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.45)' }, '-=0.35')
        .from(q('.loader__word .ch__in'), { yPercent: 120, rotate: 12, duration: 0.8, ease: 'expo.out', stagger: 0.045 }, 0.2)
        .to(counter, {
          v: 100,
          duration: fast ? 0.4 : 2.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            const v = Math.round(counter.v);
            if (num.current) num.current.textContent = String(v).padStart(3, '0');
            gsap.set(q('.loader__bar i'), { scaleX: counter.v / 100 });
          },
        }, 0)
        .addLabel('out')
        .to(q('.loader__word .ch__in'), { yPercent: -120, duration: 0.6, ease: 'expo.in', stagger: 0.025 }, 'out')
        .to(q('.loader__count, .loader__bar'), { opacity: 0, y: -20, duration: 0.4 }, 'out')
        .to(q('.loader__mark'), { y: () => -window.innerHeight * 1.2, scaleY: 1.6, duration: 1.1, ease: 'expo.in' }, 'out+=0.15')
        .to(q('.loader__trail'), { scaleY: 1, duration: 0.9, ease: 'expo.in' }, 'out+=0.2')
        .to(q('.loader__panel--l'), { xPercent: -101, duration: 1.1, ease: 'expo.inOut' }, 'out+=0.75')
        .to(q('.loader__panel--r'), { xPercent: 101, duration: 1.1, ease: 'expo.inOut' }, '<')
        .to(q('.loader__trail'), { opacity: 0, duration: 0.4 }, '<+0.3')
        .add(() => onDone?.(), '<+0.2')
        .set(root.current, { display: 'none' });

      let cancelled = false;
      fontsReady.then(() => !cancelled && tl.play());
      return () => (cancelled = true);
    },
    { scope: root }
  );

  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader__panel loader__panel--l" />
      <div className="loader__panel loader__panel--r" />
      <div className="loader__trail" />
      <div className="loader__center">
        <div className="loader__mark"><Mark /></div>
        <div className="loader__word">
          {'STAY TALL'.split('').map((c, i) =>
            c === ' ' ? <span key={i} className="ch ch--space">&nbsp;</span> : <span key={i} className="ch"><span className="ch__in">{c}</span></span>
          )}
        </div>
      </div>
      <div className="loader__count mono"><span ref={num}>000</span><i>%</i></div>
      <div className="loader__bar"><i /></div>
      <div className="loader__note mono">Loading the ascent</div>
    </div>
  );
}
