import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, useGSAP } from '../lib/gsap';
import { Star } from './Brand';

export default function Club() {
  const root = useRef(null);
  const [joined, setJoined] = useState(false);
  const stars = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({ i, x: Math.random() * 100, y: Math.random() * 100, s: Math.random() * 14 + 4, d: Math.random() * 4, t: Math.random() * 3 + 2 })),
    []
  );

  useGSAP(
    () => {
      gsap.from('.club__title .ch__in', {
        yPercent: 100, rotationX: -100, opacity: 0, transformOrigin: '50% 100%', duration: 1.4, stagger: 0.05, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });
      gsap.from('.club__sub, .club__form', {
        y: 40, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 60%' },
      });
      gsap.to('.club__stars', {
        yPercent: -25, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
    { scope: root }
  );

  const submit = (e) => {
    e.preventDefault();
    setJoined(true);
    gsap.fromTo('.club__star', { scale: 1 }, { scale: 2.4, opacity: 1, duration: 0.5, yoyo: true, repeat: 1, stagger: { each: 0.01, from: 'center' }, ease: 'power2.out' });
  };

  return (
    <section className="club" id="club" ref={root}>
      <div className="club__stars" aria-hidden="true">
        {stars.map((s) => (
          <Star key={s.i} className="club__star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />
        ))}
      </div>
      <div className="mono club__label"><Star /> 04 — The Tall Club</div>
      <h2 className="club__title">
        {'GET IN EARLY'.split('').map((c, i) => <span className="ch" key={i}><span className="ch__in">{c === ' ' ? ' ' : c}</span></span>)}
      </h2>
      <p className="club__sub">Drops sell out in minutes. Members get the link 24 hours before everyone else.</p>
      <AnimatePresence mode="wait">
        {!joined ? (
          <motion.form key="form" className="club__form" onSubmit={submit} exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}>
            <input type="email" required placeholder="your@email.com" aria-label="Email address" />
            <button type="submit" className="magnetic" data-cursor="Join" data-strength="0.25"><span>Join</span><Star /></button>
          </motion.form>
        ) : (
          <motion.p key="ok" className="club__ok" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
            <Star /> You're on the list. Stay tall.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
