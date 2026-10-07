import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { scrollToTarget } from '../lib/scroll';
import { useDb } from '../context/DbContext';
import Starfield from './Starfield';
import { Mark, SplitChars, Star } from './Brand';

export default function Hero({ ready }) {
  const root = useRef(null);
  const { settings } = useDb();

  // Hide everything until the preloader hands over.
  useGSAP(
    () => {
      gsap.set('.hero__word .ch__in', { yPercent: 130, rotateX: -90, skewX: -20 });
      gsap.set('.hero__mark .m-stem, .hero__mark .m-head', { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set('.hero__mark .m-star', { scale: 0, transformOrigin: '50% 50%' });
      gsap.set('.orbit', { scale: 0, opacity: 0 });
      gsap.set('.hero__meta, .hero__cta > *', { opacity: 0, y: 30 });
    },
    { scope: root }
  );

  // Intro + scroll choreography.
  useGSAP(
    () => {
      if (!ready) return;
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro
        .to('.hero__mark .m-stem', { scaleY: 1, duration: 1.4, stagger: 0.1 })
        .to('.hero__mark .m-head', { scaleY: 1, duration: 1.1 }, '-=1.1')
        .to('.hero__mark .m-star', { scale: 1, rotation: 360, duration: 1.6, ease: 'elastic.out(1, 0.4)' }, '-=0.8')
        .to('.hero__word--l .ch__in', { yPercent: 0, rotateX: 0, skewX: 0, duration: 1.3, stagger: { each: 0.06, from: 'end' } }, 0.2)
        .to('.hero__word--r .ch__in', { yPercent: 0, rotateX: 0, skewX: 0, duration: 1.3, stagger: 0.06 }, 0.2)
        .to('.orbit', { scale: 1, opacity: 1, duration: 1.8 }, 0.5)
        .to('.hero__meta', { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.8)
        .to('.hero__cta > *', { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.9);

      // Scroll: words split apart, the mark launches upward, orbit expands.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 1, invalidateOnRefresh: true },
      });
      tl.to('.hero__word--l', { xPercent: -60, opacity: 0, ease: 'none' }, 0)
        .to('.hero__word--r', { xPercent: 60, opacity: 0, ease: 'none' }, 0)
        .to('.hero__mark', { y: () => -window.innerHeight * 0.55, scale: 1.6, ease: 'power1.in' }, 0)
        .to('.orbit', { scale: 3.2, opacity: 0, ease: 'none' }, 0)
        .to('.hero__cta, .hero__meta', { opacity: 0, y: -60, ease: 'none' }, 0)
        .to('.hero__stars', { scale: 1.25, ease: 'none' }, 0);

      // Pointer parallax on the stage.
      const stage = root.current.querySelector('.hero__stage');
      gsap.set(stage, { transformPerspective: 1400 });
      const rx = gsap.quickTo(stage, 'rotationY', { duration: 1, ease: 'power3' });
      const ry = gsap.quickTo(stage, 'rotationX', { duration: 1, ease: 'power3' });
      const onMove = (e) => {
        rx((e.clientX / window.innerWidth - 0.5) * 14);
        ry(-(e.clientY / window.innerHeight - 0.5) * 10);
      };
      window.addEventListener('mousemove', onMove);
      return () => window.removeEventListener('mousemove', onMove);
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section className="hero" id="hero" ref={root}>
      <Starfield className="hero__stars" />
      <div className="hero__vignette" />
      <div className="hero__meta hero__meta--tl mono">FW26 / Ascend collection</div>
      <div className="hero__meta hero__meta--tr mono">06°27′N — 03°23′E</div>
      <div className="hero__meta hero__meta--bl mono"><span className="hero__scrollhint" /> Scroll to rise</div>
      <div className="hero__meta hero__meta--br mono">Lagos / Worldwide</div>

      <div className="hero__stage">
        <h1 className="hero__title">
          <span className="sr-only">Stay Tall</span>
          <SplitChars text="STAY" className="hero__word hero__word--l" />
          <span className="hero__mark">
            <Mark />
            <span className="hero__glow" />
          </span>
          <SplitChars text="TALL" className="hero__word hero__word--r" />
        </h1>
        <div className="orbit" aria-hidden="true">
          <div className="orbit__ring" />
          <div className="orbit__ring orbit__ring--2" />
          <div className="orbit__spin"><Star className="orbit__star" /></div>
        </div>
      </div>

      <div className="hero__cta">
        <p className="hero__tag">{settings.heroTagline}</p>
        <a href="#drop" className="btn magnetic" data-cursor="Go" onClick={(e) => { e.preventDefault(); scrollToTarget('#drop'); }}>
          <span className="btn__fill" />
          <span className="btn__txt" data-text={settings.heroCta}>{settings.heroCta}</span>
          <Star className="btn__star" />
        </a>
      </div>
    </section>
  );
}
