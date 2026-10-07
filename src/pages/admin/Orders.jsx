import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { COLORWAYS, fmt } from '../../data/products';
import { fmtDate, STATUS_LABEL, timeAgo } from '../../lib/db';
import { Button, Confirm, Drawer, EASE, Empty, Icon, PageHeader, SearchInput, Segmented, StatusPill, Thumb } from '../../components/admin/ui';

const NEXT = {
  paid: { to: 'processing', label: 'Start packing', icon: 'box' },
  processing: { to: 'shipped', label: 'Mark as shipped', icon: 'truck' },
  shipped: { to: 'delivered', label: 'Mark as delivered', icon: 'check' },
};
const COUNTRY = { NG: 'Nigeria', GH: 'Ghana', GB: 'United Kingdom', US: 'United States', ZA: 'South Africa', CA: 'Canada' };

function OrderDetail({ order }) {
  const { setOrderStatus, setOrderNote, db } = useDb();
  const { showToast } = useStore();
  const [note, setNote] = useState(order.note || '');
  const [ask, setAsk] = useState(null); // 'cancelled' | 'refunded'
  const next = NEXT[order.status];
  const customer = db.users.find((u) => u.id === order.customer.userId);

  const move = (status) => {
    setOrderStatus(order.id, status);
    showToast(`#${order.id} — ${STATUS_LABEL[status]}${status === 'cancelled' || status === 'refunded' ? ', items restocked' : ''}`);
  };

  return (
    <div className="odetail">
      <header className="odetail__head">
        <span className="mono muted">Order</span>
        <h2>#{order.id}</h2>
        <div className="odetail__meta">
          <StatusPill status={order.status} />
          <span className="muted">{fmtDate(order.createdAt, true)}</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={order.status} className="odetail__actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {next && <Button icon={next.icon} onClick={() => move(next.to)}>{next.label}</Button>}
          {(order.status === 'paid' || order.status === 'processing') && <Button variant="ghost" icon="ban" onClick={() => setAsk('cancelled')}>Cancel</Button>}
          {(order.status === 'shipped' || order.status === 'delivered') && <Button variant="ghost" icon="undo" onClick={() => setAsk('refunded')}>Refund</Button>}
          {!next && (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'delivered') && (
            <span className="muted small">{order.status === 'delivered' ? 'Delivered — nothing left to do.' : 'Closed. Items were returned to stock.'}</span>
          )}
        </motion.div>
      </AnimatePresence>

      <section className="odetail__sec">
        <h4>Items</h4>
        <ul className="oitems">
          {order.items.map((it, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05, ease: EASE }}>
              <Thumb product={it} size={48} />
              <div>
                <b>{it.name}</b>
                <span>{COLORWAYS[it.cw]?.name} · {it.size} · × {it.qty}</span>
              </div>
              <b className="num">{fmt(it.price * it.qty)}</b>
            </motion.li>
          ))}
        </ul>
        <dl className="osum">
          <div><dt>Subtotal</dt><dd>{fmt(order.subtotal)}</dd></div>
          {order.discount && <div><dt>Discount <code>{order.discount.code}</code></dt><dd>−{fmt(order.discount.amount)}</dd></div>}
          <div><dt>Shipping</dt><dd>{order.shipping ? fmt(order.shipping) : 'Free'}</dd></div>
          <div className="osum__total"><dt>Total</dt><dd>{fmt(order.total)}</dd></div>
        </dl>
      </section>

      <section className="odetail__sec odetail__two">
        <div>
          <h4>Customer</h4>
          <p><b>{order.customer.name}</b></p>
          <p className="muted">{order.customer.email}</p>
          {customer ? <Link className="alink" to={`/admin/customers/${customer.id}`}>View profile →</Link> : <span className="tagchip">Guest checkout</span>}
        </div>
        <div>
          <h4>Ship to</h4>
          {order.address?.line1 ? (
            <p className="muted">{order.address.line1}<br />{order.address.city}<br />{COUNTRY[order.address.country] || order.address.country}</p>
          ) : <p className="muted">No address</p>}
        </div>
      </section>

      <section className="odetail__sec">
        <h4>Timeline</h4>
        <ol className="otime">
          {[...order.timeline].reverse().map((t, i) => (
            <motion.li key={`${t.status}-${t.at}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <span className={`otime__dot otime__dot--${t.status}`} />
              <div>
                <b>{STATUS_LABEL[t.status]}</b>
                <span className="muted">{fmtDate(t.at, true)}</span>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="odetail__sec">
        <h4>Private note</h4>
        <textarea
          className="ainput"
          rows={3}
          value={note}
          placeholder="Only you can see this."
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (order.note || '') && (setOrderNote(order.id, note), showToast('Note saved'))}
        />
      </section>

      <Confirm
        open={!!ask}
        onClose={() => setAsk(null)}
        danger
        title={ask === 'refunded' ? `Refund #${order.id}?` : `Cancel #${order.id}?`}
        confirmLabel={ask === 'refunded' ? 'Refund order' : 'Cancel order'}
        body={`${fmt(order.total)} goes back to ${order.customer.name}, and the items return to stock. (Demo — no money moves.)`}
        onConfirm={() => move(ask)}
      />
    </div>
  );
}

export default function Orders() {
  const { db } = useDb();
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const status = params.get('status') || 'all';
  const open = id ? db.orders.find((o) => o.id === id) : null;

  const counts = useMemo(() => {
    const c = { all: db.orders.length };
    db.orders.forEach((o) => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [db.orders]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.orders.filter((o) => {
      if (status === 'closed' ? !(o.status === 'cancelled' || o.status === 'refunded') : status !== 'all' && o.status !== status) return false;
      if (term && !`${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [db.orders, q, status]);

  const revenue = list.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded').reduce((n, o) => n + o.total, 0);
  const setStatus = (s) => setParams(s === 'all' ? {} : { status: s }, { replace: true });
  const qs = params.toString() ? `?${params}` : '';

  return (
    <div className="page">
      <PageHeader title="Orders" sub={`${counts.paid || 0} new · ${counts.processing || 0} packing · ${counts.shipped || 0} on the way`} />

      <div className="filters-row">
        <Segmented id="ostatus" value={status} onChange={setStatus} options={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'paid', label: 'New', count: counts.paid || 0 },
          { value: 'processing', label: 'Packing', count: counts.processing || 0 },
          { value: 'shipped', label: 'Shipped', count: counts.shipped || 0 },
          { value: 'delivered', label: 'Delivered', count: counts.delivered || 0 },
          { value: 'closed', label: 'Closed', count: (counts.cancelled || 0) + (counts.refunded || 0) },
        ]} />
        <div className="filters-row__right">
          <SearchInput value={q} onChange={setQ} placeholder="Order # or customer" />
        </div>
      </div>

      <div className="acard acard--flush">
        {list.length === 0 ? (
          <Empty icon="receipt" title="No orders here">Nothing matches this filter yet.</Empty>
        ) : (
          <>
            <table className="atable">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="hide-sm">Placed</th>
                  <th className="hide-md">Items</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 80).map((o, i) => (
                  <motion.tr
                    key={o.id}
                    className={id === o.id ? 'is-selected' : ''}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 15) * 0.025 }}
                    onClick={() => navigate(`/admin/orders/${o.id}${qs}`)}
                  >
                    <td className="mono">#{o.id}</td>
                    <td>
                      <div className="cust">
                        <b>{o.customer.name}</b>
                        <span className="hide-sm">{o.customer.email}</span>
                      </div>
                    </td>
                    <td className="hide-sm muted" title={fmtDate(o.createdAt, true)}>{timeAgo(o.createdAt)}</td>
                    <td className="hide-md">
                      <div className="minithumbs">
                        {o.items.slice(0, 3).map((it, k) => <Thumb key={k} product={it} size={30} />)}
                        {o.items.length > 3 && <em>+{o.items.length - 3}</em>}
                      </div>
                    </td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="num">{fmt(o.total)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="atable__foot muted small">
              Showing {Math.min(80, list.length)} of {list.length} · {fmt(revenue)} in revenue
            </div>
          </>
        )}
      </div>

      <Drawer open={!!open} onClose={() => navigate(`/admin/orders${qs}`)} label={open ? `Order ${open.id}` : 'Order'}>
        {open && <OrderDetail key={open.id} order={open} />}
      </Drawer>
    </div>
  );
}
