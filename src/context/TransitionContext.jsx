import { createContext, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import { Mark } from '../components/Brand';

const TransitionContext = createContext(null);
const STRIPS = 6;

/**
 * Route changes play a curtain: black strips rise, the mark flashes, the page swaps
 * underneath, then the strips lift away.
 */
export function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const root = useRef(null);
  const busy = useRef(false);

  const go = useCallback(
    (to, { replace = false } = {}) => {
      if (busy.current) return;
      if (prefersReducedMotion() || !root.current) {
        navigate(to, { replace });
        window.scrollTo(0, 0);
        return;
      }
      busy.current = true;
      const strips = root.current.querySelectorAll('.curtain__strip');
      const mark = root.current.querySelector('.curtain__mark');
      gsap
        .timeline({ onComplete: () => (busy.current = false) })
        .set(root.current, { display: 'block' })
        .fromTo(strips, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, stagger: 0.045, ease: 'expo.inOut' })
        .fromTo(mark, { opacity: 0, y: 40, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, '-=0.25')
        .add(() => {
          navigate(to, { replace });
          window.scrollTo(0, 0);
        })
        .to({}, { duration: 0.3 })
        .to(mark, { opacity: 0, y: -60, scaleY: 1.4, duration: 0.4, ease: 'expo.in' })
        .to(strips, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, stagger: 0.045, ease: 'expo.inOut' }, '-=0.15')
        .set(root.current, { display: 'none' });
    },
    [navigate]
  );

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div className="curtain" ref={root} aria-hidden="true">
        {Array.from({ length: STRIPS }, (_, i) => <div key={i} className="curtain__strip" />)}
        <div className="curtain__mark"><Mark /></div>
      </div>
    </TransitionContext.Provider>
  );
}

export const useGo = () => useContext(TransitionContext);

/** A Link that plays the curtain (modifier-clicks still open new tabs normally). */
export function TLink({ to, onClick, children, ...rest }) {
  const go = useGo();
  return (
    <Link
      to={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
