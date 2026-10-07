import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '../lib/gsap';
import { lockScroll } from '../lib/scroll';
import { flyToCart } from '../lib/fly';
import { COLORWAYS, fmt, sizesFor, totalStock, TYPE_LABEL } from '../data/products';
import { useStore } from '../context/StoreContext';
import { useDb } from '../context/DbContext';
import { Garment, Star } from './Brand';

const EASE = [0.16, 1, 0.3, 1];

export default function ProductOverlay({ product: snapshot, origin }) {
  const { closeProduct, openProduct, addToBag, showToast } = useStore();
  const { productById, visibleProducts, settings } = useDb();
  const p = productById(snapshot.id) || snapshot; // stay live if the owner edits it meanwhile
  const c = COLORWAYS[p.cw];
  const sizes = sizesFor(p.type);
  const firstInStock = sizes.find((s) => (p.stock?.[s] ?? 0) > 0);
  const [size, setSize] = useState(sizes.length === 1 && firstInStock ? sizes[0] : null);
  const stage = useRef(null);
  const sizesRef = useRef(null);
  const related = visibleProducts.filter((x) => x.id !== p.id && (x.type === p.type || x.cw === p.cw)).slice(0, 3);
  const at = `${origin?.x ?? window.innerWidth / 2}px ${origin?.y ?? window.innerHeight / 2}px`;
  const soldOut = totalStock(p) === 0;
  const left = size ? p.stock?.[size] ?? 0 : null;

  useEffect(() => {
    lockScroll(true);
    const onKey = (e) => e.key === 'Escape' && closeProduct();
    window.addEventListener('keydown', onKey);
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey); };
  }, [closeProduct]);

  // Garment follows the pointer in 3D.
  useEffect(() => {
    const el = stage.current?.querySelector('.pdp__tilt');
    if (!el) return;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 1, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 1, ease: 'power3' });
    const move = (e) => {
      ry((e.clientX / window.innerWidth - 0.5) * 40);
      rx(-(e.clientY / window.innerHeight - 0.5) * 24);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const add = () => {
    if (soldOut) return;
    if (!size) {
      gsap.fromTo(sizesRef.current, { x: -14 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.25)' });
      showToast('Pick a size first');
      return;
    }
    if (addToBag(p.id, size)) flyToCart(stage.current.querySelector('.pdp__garment'));
  };

  const words = p.name.toUpperCase().split(' ');

  return (
    <motion.div
      className="pdp"
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
      data-lenis-prevent
      style={{ '--bg': c.bg, '--ink': c.ink }}
      initial={{ clipPath: `circle(0% at ${at})` }}
      animate={{ clipPath: `circle(150% at ${at})` }}
      exit={{ clipPath: `circle(0% at ${at})`, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="pdp__ghost" aria-hidden="true">
        <div className="pdp__ghost-track">
          {Array.from({ length: 6 }, (_, i) => <span key={i}>{p.name} <Star /> </span>)}
        </div>
      </div>

      <button className="pdp__close magnetic" data-cursor="Close" onClick={closeProduct} aria-label="Close">
        <span /><span />
      </button>

      <div className="pdp__inner">
        <div className="pdp__visual" ref={stage}>
          <motion.div className="pdp__orbit" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.6, delay: 0.3, ease: EASE }} />
          <motion.div
            className="pdp__garment"
            initial={{ y: 260, rotate: -30, scale: 0.5, opacity: 0 }}
            animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.35, ease: EASE }}
          >
            <div className="pdp__tilt"><div className="pdp__float"><Garment product={p} /></div></div>
          </motion.div>
          <div className="pdp__shadow" />
        </div>

        <div className="pdp__info">
          <motion.div className="mono pdp__cat" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
            <Star /> {TYPE_LABEL[p.type]} — {c.name} {soldOut ? <em>Sold out</em> : p.tag && <em>{p.tag}</em>}
          </motion.div>

          <h2 className="pdp__name">
            {words.map((w, wi) => (
              <span className="pdp__word" key={wi}>
                {w.split('').map((ch, i) => (
                  <span className="ch" key={i}>
                    <motion.span
                      className="ch__in"
                      initial={{ y: '115%', rotate: 10 }}
                      animate={{ y: 0, rotate: 0 }}
                      transition={{ delay: 0.45 + (wi * 6 + i) * 0.035, duration: 0.9, ease: EASE }}
                    >
                      {ch}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
          </h2>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.9, ease: EASE }}>
            <div className="pdp__price">
              {p.compareAt > p.price && <s>{fmt(p.compareAt)}</s>}
              {fmt(p.price)}
            </div>
            <p className="pdp__desc">{p.desc}</p>

            <div className="mono pdp__lbl">
              <span>Size</span>
              <span>
                {soldOut
                  ? 'Every size is gone'
                  : size
                    ? left <= settings.lowStockThreshold ? `${size} — only ${left} left` : `Selected: ${size}`
                    : 'Choose one'}
              </span>
            </div>
            <div className="sizes" ref={sizesRef}>
              {sizes.map((s) => {
                const out = (p.stock?.[s] ?? 0) <= 0;
                return (
                  <button key={s} className={`${size === s ? 'is-on' : ''} ${out ? 'is-out' : ''}`} onClick={() => !out && setSize(s)} aria-pressed={size === s} disabled={out} aria-label={`${s}${out ? ', sold out' : ''}`}>
                    {size === s && <motion.span layoutId={`size-pill-${p.id}`} className="sizes__pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="sizes__txt">{s}</span>
                  </button>
                );
              })}
            </div>

            <button className="btn btn--full btn--ink magnetic" data-strength="0.15" data-cursor={soldOut ? 'Gone' : 'Add'} onClick={add} disabled={soldOut}>
              <span className="btn__fill" />
              <span className="btn__txt" data-text={soldOut ? 'Sold out' : 'Add to bag'}>{soldOut ? 'Sold out' : 'Add to bag'}</span>
              <Star className="btn__star" />
            </button>

            <ul className="pdp__specs mono">
              <li>480 GSM heavyweight cotton</li>
              <li>Oversized drop-shoulder fit</li>
              <li>3D puff-print Ascend mark</li>
              <li>Free shipping over {fmt(settings.freeShippingThreshold)}</li>
            </ul>
          </motion.div>

          {related.length > 0 && (
            <motion.div className="pdp__related" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <div className="mono pdp__lbl"><span>Pairs well with</span></div>
              <div className="pdp__rel-row">
                {related.map((r) => (
                  <button
                    key={r.id}
                    className="pdp__rel"
                    style={{ '--rbg': COLORWAYS[r.cw].bg }}
                    data-cursor="View"
                    onClick={(e) => openProduct(r, { x: e.clientX, y: e.clientY })}
                    aria-label={`View ${r.name} in ${COLORWAYS[r.cw].name}`}
                  >
                    <Garment product={r} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
