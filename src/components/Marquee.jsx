import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { useDb } from '../context/DbContext';
import { Star } from './Brand';

/** Two infinite rows that run opposite ways, speed up and skew with scroll velocity, and flip with scroll direction. */
export default function Marquee() {
  const root = useRef(null);
  const { settings } = useDb();
  const rows = [settings.marqueeTop, settings.marqueeBottom].map((r) => (r?.length ? r : ['STAY TALL']));
  const key = JSON.stringify(rows);

  useGSAP(
    () => {
      const tracks = gsap.utils.toArray('.marquee__track', root.current);
      const state = tracks.map((el, i) => ({ el, x: 0, half: el.scrollWidth / 2, dir: i % 2 ? 1 : -1, wrap: null }));
      state.forEach((s) => (s.wrap = gsap.utils.wrap(-s.half, 0)));

      let boost = 1;
      let dir = 1;
      const skew = gsap.quickTo(tracks, 'skewX', { duration: 0.5, ease: 'power3' });

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          dir = self.direction;
          const v = self.getVelocity();
          boost = 1 + Math.min(Math.abs(v) / 120, 14);
          skew(gsap.utils.clamp(-14, 14, v / -150));
        },
      });

      const tick = (_, dt) => {
        boost += (1 - boost) * 0.04;
        state.forEach((s) => {
          s.x = s.wrap(s.x + s.dir * dir * boost * dt * 0.07);
          gsap.set(s.el, { x: s.x });
        });
        if (boost < 1.05) skew(0);
      };
      gsap.ticker.add(tick);

      const onResize = () => state.forEach((s) => { s.half = s.el.scrollWidth / 2; s.wrap = gsap.utils.wrap(-s.half, 0); });
      window.addEventListener('resize', onResize);
      document.fonts?.ready.then(onResize);
      return () => { gsap.ticker.remove(tick); st.kill(); window.removeEventListener('resize', onResize); };
    },
    { scope: root, dependencies: [key], revertOnUpdate: true }
  );

  return (
    <section className="marquee" ref={root} aria-hidden="true">
      {rows.map((words, r) => (
        <div className={`marquee__row ${r ? 'marquee__row--alt' : ''}`} key={r}>
          <div className="marquee__track">
            {[0, 1].map((half) => (
              <div className="marquee__half" key={half}>
                {[0, 1, 2].map((rep) =>
                  words.map((w, wi) => (
                    <span className="marquee__item" key={`${rep}-${wi}`}>
                      {w} <Star />
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
