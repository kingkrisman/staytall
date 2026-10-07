import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useStore } from '../context/StoreContext';
import { Star } from './Brand';

export function Toast() {
  const { toast } = useStore();
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.k}
            className="toast mono"
            initial={{ y: 80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <Star /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Thin vertical rail with a star that travels down as you scroll the page. */
export function ScrollRail() {
  const star = useRef(null);
  const fill = useRef(null);
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        gsap.set(fill.current, { scaleY: self.progress });
        gsap.set(star.current, { top: `${self.progress * 100}%`, rotation: self.progress * 720 });
      },
    });
    return () => st.kill();
  }, []);
  return (
    <div className="rail" aria-hidden="true">
      <i ref={fill} />
      <span ref={star}><Star /></span>
    </div>
  );
}
