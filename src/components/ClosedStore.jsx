import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDb } from '../context/DbContext';
import { TLink } from '../context/TransitionContext';
import Starfield from './Starfield';
import { Mark, Star } from './Brand';

const EASE = [0.16, 1, 0.3, 1];

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  return {
    done: ms === 0,
    parts: [
      ['Days', Math.floor(ms / 86400000)],
      ['Hours', Math.floor(ms / 3600000) % 24],
      ['Mins', Math.floor(ms / 60000) % 60],
      ['Secs', Math.floor(ms / 1000) % 60],
    ],
  };
}

/** What the public sees while the owner has the store closed. */
export default function ClosedStore() {
  const { settings } = useDb();
  const { parts, done } = useCountdown(settings.nextDropAt);
  const [joined, setJoined] = useState(false);

  return (
    <div className="closed">
      <Starfield className="closed__stars" density={0.8} />
      <div className="closed__inner">
        <motion.div initial={{ y: 80, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE }}>
          <Mark className="closed__mark" />
        </motion.div>
        <h1 className="closed__title">
          {"WE'LL BE BACK".split('').map((c, i) => (
            <span className="ch" key={i}>
              <motion.span className="ch__in" initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ delay: 0.3 + i * 0.04, duration: 1, ease: EASE }}>
                {c === ' ' ? ' ' : c}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="closed__msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {settings.closedMessage}
        </motion.p>

        {!done && (
          <motion.div className="closed__count" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.9, ease: EASE }}>
            {parts.map(([label, v]) => (
              <div key={label}>
                <b>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={v} initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                      {String(v).padStart(2, '0')}
                    </motion.span>
                  </AnimatePresence>
                </b>
                <span className="mono">{label}</span>
              </div>
            ))}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {joined ? (
            <motion.p key="ok" className="closed__ok mono" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Star /> You'll hear first. Stay tall.
            </motion.p>
          ) : (
            <motion.form key="form" className="club__form closed__form" onSubmit={(e) => { e.preventDefault(); setJoined(true); }} exit={{ opacity: 0, y: -10 }}>
              <input type="email" required placeholder="Email me when it drops" aria-label="Email address" />
              <button type="submit"><span>Notify</span><Star /></button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      <TLink to="/signin?next=/admin" className="closed__owner mono">Owner sign in →</TLink>
    </div>
  );
}
