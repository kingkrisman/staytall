import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { lockScroll, scrollToTarget } from '../lib/scroll';
import { initials } from '../lib/db';
import { useStore } from '../context/StoreContext';
import { useDb } from '../context/DbContext';
import { useAuth } from '../context/AuthContext';
import { useGo } from '../context/TransitionContext';
import { Star } from './Brand';

const LINKS = [
  { href: '#drop', label: 'The Drop' },
  { href: '#shop', label: 'Shop' },
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#club', label: 'Club' },
];

export default function Nav({ ready }) {
  const { count, setCartOpen } = useStore();
  const { settings } = useDb();
  const { user, isAdmin } = useAuth();
  const go = useGo();
  const [menu, setMenu] = useState(false);
  const nav = useRef(null);
  const bar = settings.announcement;

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 120,
      end: 'max',
      onUpdate: (self) => {
        gsap.to(nav.current, { yPercent: self.direction === 1 ? -130 : 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      },
      onLeaveBack: () => gsap.to(nav.current, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' }),
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    if (!menu) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [menu]);

  const jump = (e, href) => {
    e.preventDefault();
    setMenu(false);
    gsap.to(nav.current, { yPercent: 0, duration: 0.4 });
    setTimeout(() => scrollToTarget(href), menu ? 450 : 0);
  };

  const route = (e, to) => {
    e.preventDefault();
    setMenu(false);
    go(to);
  };

  const accountHref = user ? '/account' : '/signin';

  return (
    <>
      <header className={`nav ${ready ? 'is-ready' : ''}`} ref={nav}>
        {bar.enabled && bar.text && (
          <div className="nav__bar mono" aria-label={bar.text}>
            <div className="nav__bar-track" aria-hidden="true">
              {[0, 1].map((h) => (
                <span key={h}>
                  {Array.from({ length: 4 }, (_, i) => <span key={i}>{bar.text}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>)}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="nav__row">
          <a href="#top" className="nav__logo magnetic" data-cursor="Top" data-strength="0.2" onClick={(e) => jump(e, 0)} aria-label="Stay Tall — back to top">
            <img src="/logo.png" alt="Stay Tall" width="968" height="441" />
          </a>
          <nav className="nav__links" aria-label="Primary">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="roll magnetic" onClick={(e) => jump(e, l.href)}>
                <span data-text={l.label}>{l.label}</span>
              </a>
            ))}
          </nav>
          <div className="nav__right">
            {isAdmin && (
              <a href="/admin" className="nav__pill magnetic" data-cursor="Admin" onClick={(e) => route(e, '/admin')}>
                <Star /> <span>Admin</span>
              </a>
            )}
            <a
              href={accountHref}
              className={`nav__acct magnetic ${user ? 'is-user' : ''}`}
              data-cursor={user ? 'Account' : 'Sign in'}
              onClick={(e) => route(e, accountHref)}
              aria-label={user ? `Your account, ${user.name}` : 'Sign in'}
            >
              {user ? <b>{initials(user.name)}</b> : <span className="roll"><span data-text="Sign in">Sign in</span></span>}
            </a>
            <button className="nav__cart magnetic" id="cartBtn" data-cursor="Bag" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${count} items`}>
              <span>Bag</span>
              <b className="nav__count">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    initial={{ y: '110%', rotate: 20 }}
                    animate={{ y: 0, rotate: 0 }}
                    exit={{ y: '-110%', rotate: -20 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </b>
            </button>
            <button className={`nav__burger ${menu ? 'is-open' : ''}`} onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
              <i /><i />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="menu"
            initial={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 40px) 40px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav>
              {[...LINKS, { href: accountHref, label: user ? 'Account' : 'Sign in', route: true }, ...(isAdmin ? [{ href: '/admin', label: 'Admin', route: true }] : [])].map((l, i) => (
                <div className="menu__row" key={l.href}>
                  <motion.a
                    href={l.href}
                    onClick={(e) => (l.route ? route(e, l.href) : jump(e, l.href))}
                    initial={{ y: '110%', rotate: 6 }}
                    animate={{ y: 0, rotate: 0 }}
                    exit={{ y: '-110%' }}
                    transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <small className="mono">0{i + 1}</small>{l.label}
                  </motion.a>
                </div>
              ))}
            </nav>
            <motion.div className="menu__foot mono" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.7 } }} exit={{ opacity: 0 }}>
              <Star /> Stay tall — FW26 Ascend
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
