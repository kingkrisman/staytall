import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { flyToCart } from '../lib/fly';
import { COLORWAYS, fmt, sizesFor, totalStock, TYPE_LABEL } from '../data/products';
import { useStore } from '../context/StoreContext';
import { useDb } from '../context/DbContext';
import { Garment } from './Brand';

/** Grid card: 3D tilt with a light sheen that tracks the pointer, quick-add sizes on hover. */
export default function ProductCard({ product: p, index, ref }) {
  const { openProduct, addToBag } = useStore();
  const { settings } = useDb();
  const card = useRef(null);
  const c = COLORWAYS[p.cw];

  // AnimatePresence's popLayout passes a ref to measure exiting cards; share the node with it.
  const setRef = useCallback(
    (node) => {
      card.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    const el = card.current;
    if (!window.matchMedia('(hover: hover)').matches) return;
    const inner = el.querySelector('.pcard__inner');
    const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3' });
    const gx = gsap.quickTo(el.querySelector('.pcard__garment'), 'x', { duration: 0.8, ease: 'power3' });
    const gy = gsap.quickTo(el.querySelector('.pcard__garment'), 'y', { duration: 0.8, ease: 'power3' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 14); ry(px * 16); gx(px * 26); gy(py * 20);
      el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
    };
    const leave = () => { rx(0); ry(0); gx(0); gy(0); };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); };
  }, []);

  const quickAdd = (e, size) => {
    e.stopPropagation();
    if (addToBag(p.id, size)) flyToCart(card.current.querySelector('.pcard__garment'));
  };

  const total = totalStock(p);
  const soldOut = total === 0;
  const low = !soldOut && total <= settings.lowStockThreshold;
  const badge = soldOut ? 'Sold out' : low ? `Only ${total} left` : p.tag;

  return (
    <motion.article
      layout
      ref={setRef}
      className="pcard"
      style={{ '--bg': c.bg, '--ink': c.ink }}
      initial={{ opacity: 0, y: 80, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)', transition: { duration: 0.3 } }}
      transition={{ duration: 0.9, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
    >
      <div
        className="pcard__inner"
        data-cursor="View"
        role="button"
        tabIndex={0}
        aria-label={`View ${p.name} in ${c.name}`}
        onClick={(e) => openProduct(p, { x: e.clientX, y: e.clientY })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const r = e.currentTarget.getBoundingClientRect();
            openProduct(p, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }
        }}
      >
        <div className={`pcard__media ${soldOut ? 'is-out' : ''}`}>
          {badge && <span className={`pcard__tag mono ${soldOut || low ? 'is-alert' : ''}`}>{badge}</span>}
          <div className="pcard__garment"><Garment product={p} /></div>
          <div className="pcard__sheen" />
          {!soldOut && (
            <div className="pcard__quick" onClick={(e) => e.stopPropagation()}>
              <span className="mono">Quick add</span>
              <div>
                {sizesFor(p.type).map((s) => {
                  const left = p.stock?.[s] ?? 0;
                  return (
                    <button key={s} onClick={(e) => quickAdd(e, s)} data-cursor={left ? 'Add' : 'Gone'} disabled={!left} aria-label={`Add size ${s}${left ? '' : ' (sold out)'}`}>
                      {s === 'One size' ? 'OS' : s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="pcard__info">
          <div>
            <h3>{p.name}</h3>
            <span className="mono">{TYPE_LABEL[p.type]} — {c.name}</span>
          </div>
          <b>
            {p.compareAt > p.price && <s>{fmt(p.compareAt)}</s>}
            {fmt(p.price)}
          </b>
        </div>
      </div>
    </motion.article>
  );
}
