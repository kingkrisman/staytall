import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion';
import { lockScroll, scrollToTarget } from '../lib/scroll';
import { COLORWAYS, fmt } from '../data/products';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { TLink } from '../context/TransitionContext';
import { Garment, Mark, Star } from './Brand';

const EASE = [0.16, 1, 0.3, 1];
const COUNTRIES = [['NG', 'Nigeria'], ['GH', 'Ghana'], ['GB', 'United Kingdom'], ['US', 'United States'], ['ZA', 'South Africa'], ['CA', 'Canada']];

function Money({ value }) {
  const spring = useSpring(value, { stiffness: 120, damping: 20 });
  const text = useTransform(spring, (v) => fmt(v));
  useEffect(() => spring.set(value), [spring, value]);
  return <motion.b>{text}</motion.b>;
}

function BagStep({ onNext }) {
  const { lines, subtotal, discount, shipping, total, promo, promoResult, applyPromo, clearPromo, changeQty, removeLine, setCartOpen, freeShippingThreshold } = useStore();
  const [code, setCode] = useState('');
  const [codeOpen, setCodeOpen] = useState(!!promo);
  const [codeErr, setCodeErr] = useState('');
  const afterDiscount = subtotal - discount;
  const left = Math.max(0, freeShippingThreshold - afterDiscount);

  const submitCode = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const r = applyPromo(code);
    setCodeErr(r.ok ? '' : r.error);
    if (r.ok) setCode('');
  };

  return (
    <>
      <div className="cart__ship mono">
        <span>{left > 0 ? <>Spend <b>{fmt(left)}</b> more for free shipping</> : <><Star /> You've unlocked free shipping</>}</span>
        <i><motion.b animate={{ scaleX: Math.min(1, afterDiscount / freeShippingThreshold) }} transition={{ duration: 1, ease: EASE }} /></i>
      </div>

      <div className="cart__items" data-lenis-prevent>
        {lines.length === 0 && (
          <motion.div className="cart__empty" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: EASE }}>
            <Mark />
            <p>Your bag is empty.<br /><em>Rise to the occasion.</em></p>
            <button className="btn magnetic" data-cursor="Shop" onClick={() => { setCartOpen(false); setTimeout(() => scrollToTarget('#shop'), 500); }}>
              <span className="btn__fill" /><span className="btn__txt" data-text="Shop now">Shop now</span><Star className="btn__star" />
            </button>
          </motion.div>
        )}
        <AnimatePresence initial={true}>
          {lines.map((l, i) => {
            const c = COLORWAYS[l.product.cw];
            return (
              <motion.div
                key={l.key}
                layout
                className="line"
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.25 + i * 0.07, duration: 0.8, ease: EASE } }}
                exit={{ opacity: 0, x: 120, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.45, ease: EASE } }}
              >
                <div className="line__thumb" style={{ '--bg': c.bg }}><Garment product={l.product} /></div>
                <div className="line__body">
                  <div className="line__top">
                    <h4>{l.product.name}</h4>
                    <Money value={l.product.price * l.qty} />
                  </div>
                  <span className="mono line__meta">
                    {c.name} / {l.size}
                    {l.qty > l.available && <em className="line__warn"> — only {l.available} left</em>}
                  </span>
                  <div className="line__ctrl">
                    <div className="qty">
                      <button onClick={() => changeQty(l.key, -1)} aria-label="Decrease quantity">−</button>
                      <span className="qty__n">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span key={l.qty} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                            {l.qty}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <button onClick={() => changeQty(l.key, 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <button className="line__rm mono" onClick={() => removeLine(l.key)}>Remove</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {lines.length > 0 && (
        <div className="cart__foot">
          <div className="promo">
            {promoResult.ok ? (
              <motion.div className="promo__applied mono" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Star /> {promo} applied
                <button onClick={() => { clearPromo(); setCodeErr(''); }} aria-label="Remove code">Remove</button>
              </motion.div>
            ) : codeOpen ? (
              <form className="promo__form" onSubmit={submitCode}>
                <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeErr(''); }} placeholder="Promo code" aria-label="Promo code" autoFocus />
                <button type="submit" className="mono">Apply</button>
              </form>
            ) : (
              <button className="promo__toggle mono" onClick={() => setCodeOpen(true)}>Have a promo code?</button>
            )}
            <AnimatePresence>
              {(codeErr || (promo && !promoResult.ok && promoResult.error)) && (
                <motion.p className="promo__err mono" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {codeErr || promoResult.error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <dl className="cart__sum">
            <div><dt>Subtotal</dt><dd><Money value={subtotal} /></dd></div>
            <AnimatePresence>
              {discount > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <dt>Discount</dt><dd>−{fmt(discount)}</dd>
                </motion.div>
              )}
            </AnimatePresence>
            <div><dt>Shipping</dt><dd>{shipping ? fmt(shipping) : 'Free'}</dd></div>
          </dl>
          <div className="cart__total"><span>Total</span><Money value={total} /></div>
          <button className="btn btn--full btn--inv magnetic" data-strength="0.12" data-cursor="Next" onClick={onNext}>
            <span className="btn__fill" />
            <span className="btn__txt" data-text="Checkout">Checkout</span>
            <Star className="btn__star" />
          </button>
        </div>
      )}
    </>
  );
}

function DetailsStep({ onBack, onPlaced }) {
  const { user } = useAuth();
  const { total, checkout, lines, setCartOpen } = useStore();
  const [f, setF] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    line1: user?.address?.line1 || '',
    city: user?.address?.city || '',
    country: user?.address?.country || 'NG',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const place = (e) => {
    e.preventDefault();
    if (!lines.length) return;
    setBusy(true);
    setTimeout(() => {
      const order = checkout({
        customer: { userId: user?.id || null, name: f.name.trim(), email: f.email.trim().toLowerCase() },
        address: { line1: f.line1.trim(), city: f.city.trim(), country: f.country },
      });
      onPlaced(order);
    }, 1100);
  };

  return (
    <form className="checkout" onSubmit={place} data-lenis-prevent>
      <button type="button" className="checkout__back mono" onClick={onBack}>← Back to bag</button>
      {user ? (
        <p className="checkout__who mono"><Star /> Signed in as {user.email}</p>
      ) : (
        <p className="checkout__who mono">
          Checking out as a guest. <TLink to="/signin" onClick={() => setCartOpen(false)}>Sign in</TLink> to track this order.
        </p>
      )}
      {[
        ['name', 'Full name', 'text', 'name'],
        ['email', 'Email', 'email', 'email'],
        ['line1', 'Street address', 'text', 'street-address'],
        ['city', 'City', 'text', 'address-level2'],
      ].map(([k, label, type, auto], i) => (
        <motion.label key={k} className="cfield" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: EASE }}>
          <span className="mono">{label}</span>
          <input type={type} required value={f[k]} onChange={set(k)} autoComplete={auto} />
        </motion.label>
      ))}
      <motion.label className="cfield" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6, ease: EASE }}>
        <span className="mono">Country</span>
        <select value={f.country} onChange={set('country')}>
          {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </motion.label>

      <motion.div className="card-demo" initial={{ opacity: 0, rotateX: -30 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }}>
        <div className="card-demo__top"><Mark /><span className="mono">Demo card</span></div>
        <div className="card-demo__num mono">4242 4242 4242 4242</div>
        <div className="card-demo__foot mono"><span>{f.name || 'YOUR NAME'}</span><span>12/29</span></div>
      </motion.div>
      <p className="checkout__note mono">Demo store — no payment is taken and nothing ships.</p>

      <button className={`btn btn--full btn--inv magnetic ${busy ? 'is-busy' : ''}`} data-strength="0.12" data-cursor="Pay" type="submit" disabled={busy}>
        <span className="btn__fill" />
        <span className="btn__txt" data-text={busy ? 'Placing order…' : `Pay ${fmt(total)}`}>{busy ? 'Placing order…' : `Pay ${fmt(total)}`}</span>
        <Star className="btn__star" />
      </button>
    </form>
  );
}

function Panel({ onPlaced }) {
  const { count, setCartOpen } = useStore();
  const [step, setStep] = useState('bag');
  const close = () => setCartOpen(false);

  useEffect(() => {
    lockScroll(true);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => { lockScroll(false); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <motion.div className="scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
      <motion.aside
        className="cart"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        data-lenis-prevent
        initial={{ x: '105%', skewX: -6 }}
        animate={{ x: 0, skewX: 0 }}
        exit={{ x: '105%', skewX: 6 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="cart__head">
          <h3>{step === 'bag' ? <>Your bag <sup>{count}</sup></> : 'Delivery'}</h3>
          <button className="cart__close magnetic" data-cursor="Close" onClick={close} aria-label="Close bag"><span /><span /></button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="cart__step"
            initial={{ x: step === 'bag' ? -60 : 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: step === 'bag' ? -60 : 60, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {step === 'bag' ? <BagStep onNext={() => setStep('details')} /> : <DetailsStep onBack={() => setStep('bag')} onPlaced={onPlaced} />}
          </motion.div>
        </AnimatePresence>
      </motion.aside>
    </>
  );
}

export default function CartDrawer({ onPlaced }) {
  const { cartOpen } = useStore();
  return <AnimatePresence>{cartOpen && <Panel key="cart" onPlaced={onPlaced} />}</AnimatePresence>;
}
