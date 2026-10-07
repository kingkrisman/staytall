import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { lockScroll } from '../lib/scroll';
import { fmt } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { TLink } from '../context/TransitionContext';
import { Mark, Star } from './Brand';

const EASE = [0.16, 1, 0.3, 1];

/** Star-burst: four-point stars fired from the centre, falling back under gravity. */
function Burst() {
  const cv = useRef(null);
  useEffect(() => {
    const c = cv.current;
    const ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = (c.width = innerWidth * dpr);
    const h = (c.height = innerHeight * dpr);
    const parts = [];
    const fire = (n, delay) =>
      setTimeout(() => {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = (Math.random() * 14 + 6) * dpr;
          parts.push({ x: w / 2, y: h * 0.42, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6 * dpr, r: (Math.random() * 9 + 3) * dpr, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 1, shade: Math.random() });
        }
      }, delay);
    const timers = [fire(140, 250), fire(90, 650), fire(70, 1100)];

    const star = (x, y, r, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 - Math.PI / 2;
        const rad = k % 2 ? r * 0.22 : r;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    };

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32 * dpr;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
        if (p.life <= 0 || p.y > h + 50) { parts.splice(i, 1); continue; }
        const g = p.shade > 0.7 ? 120 : 245;
        ctx.fillStyle = `rgba(${g},${g},${g},${Math.min(1, p.life * 1.5)})`;
        star(p.x, p.y, p.r, p.rot);
      }
    };
    loop();
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, []);
  return <canvas ref={cv} className="success__burst" aria-hidden="true" />;
}

export default function Success({ order, onClose }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!order) return;
    lockScroll(true);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey); };
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          className="success"
          role="dialog"
          aria-modal="true"
          aria-label="Order placed"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        >
          <Burst />
          <div className="success__inner">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 12 }}>
              <Mark className="success__mark" />
            </motion.div>
            <h2>
              {'ORDER PLACED'.split('').map((c, i) => (
                <span className="ch" key={i}>
                  <motion.span className="ch__in" initial={{ y: '120%' }} animate={{ y: 0 }} transition={{ delay: 0.55 + i * 0.04, duration: 1, ease: EASE }}>
                    {c === ' ' ? ' ' : c}
                  </motion.span>
                </span>
              ))}
            </h2>
            <motion.p className="mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              Order #{order.id} · {fmt(order.total)} — confirmation sent to {order.customer.email}
            </motion.p>
            <motion.div className="success__actions" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.8, ease: EASE }}>
              <button className="btn magnetic" data-cursor="Back" onClick={onClose}>
                <span className="btn__fill" /><span className="btn__txt" data-text="Keep shopping">Keep shopping</span><Star className="btn__star" />
              </button>
              {user && (
                <TLink to="/account" className="btn magnetic" data-cursor="Track" onClick={onClose}>
                  <span className="btn__fill" /><span className="btn__txt" data-text="Track order">Track order</span><Star className="btn__star" />
                </TLink>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
