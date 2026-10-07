import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { scrollToTarget } from '../lib/scroll';
import { useGo } from '../context/TransitionContext';
import { Mark } from './Brand';

const COLS = [
  { h: 'Shop', links: [['All products', '#shop'], ['FW26 Drop', '#drop'], ['Manifesto', '#manifesto']] },
  { h: 'Help', links: [['Your account', '/account'], ['Shipping', '#'], ['Returns', '#'], ['Owner login', '/admin']] },
  { h: 'Follow', links: [['Instagram', '#'], ['TikTok', '#'], ['X / Twitter', '#']] },
];

function LagosClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tick = () => setT(f.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="footer__time">{t}</span>;
}

export default function Footer() {
  const root = useRef(null);
  const navigate = useGo();

  useGSAP(
    () => {
      gsap.fromTo(
        '.footer__giant .fl',
        { yPercent: 100, rotate: (i) => (i < 4 ? -12 : 12) },
        {
          yPercent: 0, rotate: 0, stagger: { each: 0.06, from: 'center' }, ease: 'none',
          scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
        }
      );
      gsap.fromTo('.footer__giant .mark', { yPercent: 120, scale: 0.4 }, {
        yPercent: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
      });
      gsap.from('.footer__cols > div', {
        y: 50, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 85%' },
      });
    },
    { scope: root }
  );

  const go = (e, href) => {
    e.preventDefault();
    if (href === '#') return;
    if (href.startsWith('/')) return navigate(href);
    scrollToTarget(href);
  };

  return (
    <footer className="footer" ref={root}>
      <div className="footer__cols">
        {COLS.map((c) => (
          <div key={c.h}>
            <h4 className="mono">{c.h}</h4>
            {c.links.map(([label, href]) => (
              <a key={label} href={href} className="roll" onClick={(e) => go(e, href)}><span data-text={label}>{label}</span></a>
            ))}
          </div>
        ))}
        <div>
          <h4 className="mono">Lagos time</h4>
          <LagosClock />
        </div>
      </div>

      <div className="footer__giant" aria-label="Stay Tall">
        {'STAY'.split('').map((c, i) => <span className="fl-wrap" key={`a${i}`}><span className="fl">{c}</span></span>)}
        <Mark />
        {'TALL'.split('').map((c, i) => <span className="fl-wrap" key={`b${i}`}><span className="fl">{c}</span></span>)}
      </div>

      <div className="footer__base mono">
        <span>© 2026 STAY TALL™ — All rights reserved.</span>
        <a href="#top" className="magnetic" data-cursor="Up" onClick={(e) => { e.preventDefault(); scrollToTarget(0, { duration: 2.6 }); }}>Back to top ↑</a>
      </div>
    </footer>
  );
}
