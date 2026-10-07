import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { Mark } from './Brand';

/**
 * Pinned inversion: a white circle swallows the black screen, flipping
 * "WHATEVER PULLS YOU DOWN" into "STAY TALL." and handing off to the light shop section.
 */
export default function Reveal() {
  const root = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=180%', pin: true, scrub: 1 },
      });
      tl.fromTo('.reveal__circle', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'power2.in', duration: 1 }, 0)
        .fromTo('.reveal__in', { scale: 1.5, rotation: -8 }, { scale: 1, rotation: 0, ease: 'power2.out', duration: 1 }, 0)
        .to('.reveal__under h2', { scale: 0.8, opacity: 0.2, ease: 'none', duration: 1 }, 0)
        .fromTo('.reveal__in .mark', { y: 120, scale: 0.4 }, { y: 0, scale: 1, ease: 'back.out(2)', duration: 0.6 }, 0.35)
        .to({}, { duration: 0.3 });

      gsap.from('.reveal__under .ch__in', {
        yPercent: 110, duration: 1, stagger: 0.02, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      });
    },
    { scope: root }
  );

  const lines = ['WHATEVER', 'PULLS YOU', 'DOWN —'];

  return (
    <section className="reveal" ref={root}>
      <div className="reveal__under" aria-hidden="true">
        <h2>
          {lines.map((l) => (
            <span className="reveal__line" key={l}>
              {l.split('').map((c, i) => <span className="ch" key={i}><span className="ch__in">{c === ' ' ? ' ' : c}</span></span>)}
            </span>
          ))}
        </h2>
      </div>
      <div className="reveal__circle">
        <div className="reveal__in">
          <Mark />
          <h2>STAY<br />TALL.</h2>
        </div>
      </div>
    </section>
  );
}
