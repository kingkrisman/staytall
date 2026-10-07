import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { CATEGORY, FILTERS } from '../data/products';
import { useDb } from '../context/DbContext';
import ProductCard from './ProductCard';
import { Star } from './Brand';

export default function Shop() {
  const root = useRef(null);
  const [filter, setFilter] = useState('all');
  const { visibleProducts } = useDb();
  const items = useMemo(
    () => (filter === 'all' ? visibleProducts : visibleProducts.filter((p) => CATEGORY[p.type] === filter)),
    [filter, visibleProducts]
  );

  useGSAP(
    () => {
      gsap.from('.shop__title .ch__in', {
        yPercent: 110, rotate: 8, duration: 1.2, stagger: 0.025, ease: 'expo.out',
        scrollTrigger: { trigger: '.shop__head', start: 'top 80%' },
      });
      gsap.from('.filters button', {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out',
        scrollTrigger: { trigger: '.filters', start: 'top 90%' },
      });
    },
    { scope: root }
  );

  const pick = (key) => {
    setFilter(key);
    // Pinned sections above shift when the grid height changes.
    setTimeout(() => ScrollTrigger.refresh(), 800);
  };

  return (
    <section className="shop" id="shop" ref={root}>
      <div className="shop__head">
        <div>
          <div className="mono"><Star /> 03 — Shop all</div>
          <h2 className="shop__title">
            {['THE FULL', 'COLLECTION'].map((line) => (
              <span className="shop__line" key={line}>
                {line.split('').map((c, i) => <span className="ch" key={i}><span className="ch__in">{c === ' ' ? ' ' : c}</span></span>)}
              </span>
            ))}
          </h2>
        </div>
        <LayoutGroup id="filters">
          <div className="filters" role="tablist" aria-label="Filter products">
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={filter === f.key} className={filter === f.key ? 'is-active' : ''} onClick={() => pick(f.key)}>
                {filter === f.key && <motion.span layoutId="filter-pill" className="filters__pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="filters__txt">{f.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <div className="shop__count mono">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={items.length} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
            {String(items.length).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
        &nbsp;pieces
      </div>

      <motion.div layout className="grid">
        <AnimatePresence mode="popLayout">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
