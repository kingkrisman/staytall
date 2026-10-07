import { Fragment, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useDb } from '../context/DbContext';
import { Star } from './Brand';

const STATS = [
  { to: 26, label: 'Pieces in the drop' },
  { to: 500, label: 'Units per style. Ever.' },
  { to: 480, label: 'GSM heavyweight cotton' },
];

export default function Manifesto() {
  const root = useRef(null);
  const { settings } = useDb();
  const text = settings.manifesto || '';

  useGSAP(
    () => {
      // Words light up one by one as you scroll through.
      gsap.fromTo(
        '.manifesto__w',
        { opacity: 0.1, y: 12, filter: 'blur(6px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true },
        }
      );
    },
    { scope: root, dependencies: [text], revertOnUpdate: true }
  );

  useGSAP(
    () => {
      gsap.from('.manifesto__label', {
        x: -40, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 80%' },
      });

      gsap.utils.toArray('.count', root.current).forEach((el) => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: Number(el.dataset.to), duration: 2.2, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          onUpdate: () => (el.textContent = Math.round(obj.v)),
        });
      });

      gsap.from('.manifesto__stat', {
        y: 80, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out',
        scrollTrigger: { trigger: '.manifesto__stats', start: 'top 90%' },
      });

      gsap.to('.manifesto__bgmark', {
        yPercent: -30, rotation: 8, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section className="manifesto" id="manifesto" ref={root}>
      <div className="manifesto__bgmark" aria-hidden="true"><Star /></div>
      <div className="manifesto__label mono"><Star /> 01 — Manifesto</div>
      <p className="manifesto__text">
        {text.split(/\s+/).filter(Boolean).map((w, i) => {
          const em = w.startsWith('*');
          return (
            <Fragment key={i}>
              <span className={`manifesto__w ${em ? 'is-em' : ''}`}>{w.replace(/\*/g, '')}</span>{' '}
            </Fragment>
          );
        })}
      </p>
      <div className="manifesto__stats">
        {STATS.map((s) => (
          <div className="manifesto__stat" key={s.label}>
            <b className="count" data-to={s.to}>0</b>
            <span className="mono">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
