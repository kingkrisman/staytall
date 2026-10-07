import { useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { COLORWAYS, fmt } from '../data/products';
import { fmtDate, isRevenue, STATUS_LABEL } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useStore } from '../context/StoreContext';
import { TLink, useGo } from '../context/TransitionContext';
import { Garment, Mark, Star } from '../components/Brand';

const EASE = [0.16, 1, 0.3, 1];
const STEPS = ['paid', 'processing', 'shipped', 'delivered'];
const STEP_LABEL = { paid: 'Placed', processing: 'Packing', shipped: 'On the way', delivered: 'Delivered' };

function Tracker({ order }) {
  const stopped = order.status === 'cancelled' || order.status === 'refunded';
  const idx = stopped ? -1 : STEPS.indexOf(order.status);
  return (
    <div className={`track ${stopped ? 'is-stopped' : ''}`}>
      <div className="track__rail">
        <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: stopped ? 0 : idx / (STEPS.length - 1) }} transition={{ duration: 1.2, delay: 0.3, ease: EASE }} />
      </div>
      <ol>
        {STEPS.map((s, i) => (
          <li key={s} className={i <= idx ? 'is-done' : ''}>
            <motion.span className="track__dot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 400, damping: 18 }} />
            <span className="mono">{STEP_LABEL[s]}</span>
          </li>
        ))}
      </ol>
      {stopped && <p className="track__note mono">This order was {STATUS_LABEL[order.status].toLowerCase()}. Any payment has been returned.</p>}
    </div>
  );
}

function OrderCard({ order, i }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <motion.article className="aorder" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08, duration: 0.8, ease: EASE }}>
      <button className="aorder__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div>
          <span className="mono">#{order.id} · {fmtDate(order.createdAt)}</span>
          <b>{fmt(order.total)}</b>
        </div>
        <div className="aorder__thumbs">
          {order.items.slice(0, 3).map((it, k) => (
            <span key={k} style={{ '--bg': COLORWAYS[it.cw]?.bg }}><Garment product={{ type: it.type, cw: it.cw }} /></span>
          ))}
        </div>
        <span className={`spill spill--${order.status}`}>{STATUS_LABEL[order.status]}</span>
        <motion.span className="aorder__chev" animate={{ rotate: open ? 180 : 0 }} aria-hidden="true">⌄</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="aorder__body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <Tracker order={order} />
            <ul className="aorder__items">
              {order.items.map((it, k) => (
                <li key={k}>
                  <span>{it.name} <em className="mono">{COLORWAYS[it.cw]?.name} / {it.size} × {it.qty}</em></span>
                  <b>{fmt(it.price * it.qty)}</b>
                </li>
              ))}
              {order.discount && <li><span>Discount <em className="mono">{order.discount.code}</em></span><b>−{fmt(order.discount.amount)}</b></li>}
              <li><span>Shipping</span><b>{order.shipping ? fmt(order.shipping) : 'Free'}</b></li>
            </ul>
            {order.address?.line1 && <p className="aorder__addr mono">Ships to {order.address.line1}, {order.address.city}, {order.address.country}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function Account() {
  const { user, signOut, isAdmin } = useAuth();
  const { db, patchUser } = useDb();
  const { showToast } = useStore();
  const go = useGo();
  const [profile, setProfile] = useState(() => ({ name: user?.name || '', line1: user?.address?.line1 || '', city: user?.address?.city || '', country: user?.address?.country || 'NG' }));

  const orders = useMemo(
    () => (user ? db.orders.filter((o) => o.customer.userId === user.id || o.customer.email === user.email) : []),
    [db.orders, user]
  );

  if (!user) return <Navigate to="/signin?next=/account" replace />;

  const spent = orders.filter(isRevenue).reduce((n, o) => n + o.total, 0);
  const first = user.name.split(' ')[0].toUpperCase();

  const save = (e) => {
    e.preventDefault();
    patchUser(user.id, { name: profile.name.trim() || user.name, address: { line1: profile.line1.trim(), city: profile.city.trim(), country: profile.country } });
    showToast('Profile saved');
  };

  return (
    <div className="acct">
      <header className="acct__bar">
        <TLink to="/" className="acct__logo" aria-label="Back to the store"><img src="/logo.png" alt="Stay Tall" width="968" height="441" /></TLink>
        <div className="acct__actions">
          {isAdmin && <TLink to="/admin" className="abtn abtn--sm"><Star /> Admin</TLink>}
          <TLink to="/" className="abtn abtn--sm abtn--ghost">Store</TLink>
          <button className="abtn abtn--sm abtn--ghost" onClick={() => { signOut(); go('/'); }}>Sign out</button>
        </div>
      </header>

      <section className="acct__hero">
        <span className="mono"><Star /> Your account</span>
        <h1>
          {['WELCOME BACK,', `${first}.`].map((line, li) => (
            <span className="acct__line" key={li}>
              {line.split('').map((c, i) => (
                <span className="ch" key={i}>
                  <motion.span className="ch__in" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.1 + (li * 13 + i) * 0.025, duration: 1, ease: EASE }}>
                    {c === ' ' ? ' ' : c}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <Mark className="acct__mark" />
      </section>

      <div className="acct__stats">
        {[
          ['Orders', orders.length],
          ['Total spent', fmt(spent)],
          ['Member since', new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })],
        ].map(([label, v], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: EASE }}>
            <span className="mono">{label}</span>
            <b>{v}</b>
          </motion.div>
        ))}
      </div>

      <div className="acct__grid">
        <section>
          <h2 className="acct__h">Orders</h2>
          {orders.length === 0 ? (
            <div className="acct__empty">
              <p>No orders yet. The sky's still open.</p>
              <TLink to="/" className="abtn">Shop the drop →</TLink>
            </div>
          ) : (
            orders.map((o, i) => <OrderCard key={o.id} order={o} i={i} />)
          )}
        </section>

        <aside>
          <h2 className="acct__h">Profile</h2>
          <form className="acct__form" onSubmit={save}>
            <label className="cfield"><span className="mono">Name</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label className="cfield"><span className="mono">Email</span><input value={user.email} disabled /></label>
            <label className="cfield"><span className="mono">Street address</span><input value={profile.line1} onChange={(e) => setProfile({ ...profile, line1: e.target.value })} /></label>
            <label className="cfield"><span className="mono">City</span><input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
            <button className="abtn" type="submit">Save profile</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
