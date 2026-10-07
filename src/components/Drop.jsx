import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap';
import { scrollToTarget } from '../lib/scroll';
import { COLORWAYS, fmt, totalStock, TYPE_LABEL } from '../data/products';
import { useStore } from '../context/StoreContext';
import { useDb } from '../context/DbContext';
import { Garment, Star } from './Brand';

/** Pinned horizontal gallery of the pieces the owner has curated into the drop. */
export default function Drop() {
  const root = useRef(null);
  const { openProduct } = useStore();
  const { dropProducts, settings } = useDb();
  const key = dropProducts.map((p) => p.id).join() + settings.dropTitle + settings.dropYear;
  const count = dropProducts.length;
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

  useGSAP(
    () => {
      const track = root.current.querySelector('.drop__track');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const bar = root.current.querySelector('.drop__progress i');
      const cards = gsap.utils.toArray('.dcard', root.current);
      const skew = cards.length ? gsap.quickTo(cards, 'skewX', { duration: 0.6, ease: 'power3' }) : () => {};

      const move = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar, { scaleX: self.progress });
            skew(gsap.utils.clamp(-6, 6, self.getVelocity() / -400));
          },
          onScrubComplete: () => skew(0),
        },
      });

      cards.forEach((card) => {
        const st = { trigger: card, containerAnimation: move, start: 'left right', end: 'right left', scrub: true };
        gsap.fromTo(card.querySelector('.dcard__garment'), { xPercent: 35, rotation: 14 }, { xPercent: -35, rotation: -14, ease: 'none', scrollTrigger: st });
        gsap.fromTo(card.querySelector('.dcard__num'), { xPercent: -30 }, { xPercent: 30, ease: 'none', scrollTrigger: { ...st } });
        gsap.from(card.querySelectorAll('.dcard__info > *'), {
          y: 60, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: card, containerAnimation: move, start: 'left 70%' },
        });
      });

      gsap.from('.drop__title .ch__in', {
        yPercent: 110, duration: 1.2, stagger: 0.05, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });

      // Pins below this one moved when the track width changed.
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [key], revertOnUpdate: true }
  );

  return (
    <section className="drop" id="drop" ref={root}>
      <div className="drop__head">
        <div className="mono"><Star /> 02 — The Drop</div>
        <h2 className="drop__title">
          {settings.dropTitle.split('').map((c, i) => <span className="ch" key={i}><span className="ch__in">{c === ' ' ? ' ' : c}</span></span>)}
          {settings.dropYear && <em>/{settings.dropYear}</em>}
        </h2>
      </div>

      <div className="drop__track">
        <div className="drop__intro">
          <p>{words[count] || count} piece{count === 1 ? '' : 's'}.<br />Five hundred units each.<br /><em>When they're gone, they're gone.</em></p>
          <span className="mono drop__hint">Keep scrolling →</span>
        </div>

        {dropProducts.map((p, i) => {
          const c = COLORWAYS[p.cw];
          const soldOut = totalStock(p) === 0;
          return (
            <article
              key={p.id}
              className={`dcard ${soldOut ? 'is-out' : ''}`}
              style={{ '--bg': c.bg, '--ink': c.ink }}
              data-cursor="View"
              onClick={(e) => openProduct(p, { x: e.clientX, y: e.clientY })}
            >
              <div className="dcard__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
              <div className="dcard__garment"><Garment product={p} /></div>
              <div className="dcard__info">
                <span className="mono dcard__tag">{soldOut ? 'Sold out' : p.tag || TYPE_LABEL[p.type]}</span>
                <h3>{p.name}</h3>
                <div className="dcard__meta mono"><span>{c.name}</span><span>{fmt(p.price)}</span></div>
              </div>
            </article>
          );
        })}

        <a href="#shop" className="drop__outro" data-cursor="Shop" onClick={(e) => { e.preventDefault(); scrollToTarget('#shop'); }}>
          <span>See<br />every<br />piece</span>
          <i>→</i>
        </a>
      </div>

      <div className="drop__progress"><i /></div>
    </section>
  );
}
