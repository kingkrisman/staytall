import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { COLORWAYS, fmt, fmtCompact, sizesFor } from '../../data/products';
import { isRevenue, ORDER_STATUSES, timeAgo } from '../../lib/db';
import { AnimatedNumber, Card, EASE, Icon, PageHeader, Segmented, StatusPill, Thumb } from '../../components/admin/ui';
import { Meter, RevenueChart, Sparkline } from '../../components/admin/charts';

const DAY = 86400000;
const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

function Delta({ cur, prev }) {
  if (!prev) return <span className="delta">New this period</span>;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`delta ${up ? 'is-up' : 'is-down'}`}>
      <Icon name={up ? 'up' : 'down'} size={13} />
      {Math.abs(pct).toFixed(1)}%
      <em>vs previous</em>
    </span>
  );
}

function Tile({ label, value, format, cur, prev, spark, hero, delay }) {
  return (
    <motion.div className={`tile ${hero ? 'tile--hero' : ''}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: EASE }}>
      <span className="tile__label">{label}</span>
      <b className="tile__value"><AnimatedNumber value={value} format={format} /></b>
      <div className="tile__foot">
        <Delta cur={cur} prev={prev} />
        {spark && <Sparkline values={spark} />}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { db, settings, productById } = useDb();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState(30);
  const money = useCallback((v) => fmt(v), []);
  const count = useCallback((v) => Math.round(v).toLocaleString('en-NG'), []);

  const m = useMemo(() => {
    const now = Date.now();
    const start = startOfDay(now) - (range - 1) * DAY;
    const prevStart = start - range * DAY;
    const cur = db.orders.filter((o) => o.createdAt >= start);
    const prev = db.orders.filter((o) => o.createdAt >= prevStart && o.createdAt < start);
    const paid = (list) => list.filter(isRevenue);
    const sum = (list) => paid(list).reduce((n, o) => n + o.total, 0);

    const days = Array.from({ length: range }, (_, i) => {
      const t = start + i * DAY;
      const dayOrders = paid(cur).filter((o) => o.createdAt >= t && o.createdAt < t + DAY);
      const date = new Date(t);
      return {
        t,
        label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        short: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue: dayOrders.reduce((n, o) => n + o.total, 0),
        orders: dayOrders.length,
      };
    });

    const revenue = sum(cur);
    const prevRevenue = sum(prev);
    const aov = paid(cur).length ? revenue / paid(cur).length : 0;
    const prevAov = paid(prev).length ? prevRevenue / paid(prev).length : 0;
    const customers = db.users.filter((u) => u.role === 'customer');
    const newCust = customers.filter((u) => u.createdAt >= start).length;
    const prevCust = customers.filter((u) => u.createdAt >= prevStart && u.createdAt < start).length;

    const units = {};
    paid(cur).forEach((o) => o.items.forEach((it) => {
      units[it.productId] = units[it.productId] || { id: it.productId, name: it.name, cw: it.cw, type: it.type, units: 0, revenue: 0 };
      units[it.productId].units += it.qty;
      units[it.productId].revenue += it.qty * it.price;
    }));
    const top = Object.values(units).sort((a, b) => b.units - a.units).slice(0, 5);

    const byStatus = ORDER_STATUSES.map((s) => ({ s, n: cur.filter((o) => o.status === s).length }));

    const low = [];
    db.products.forEach((p) => sizesFor(p.type).forEach((s) => {
      const left = p.stock?.[s] ?? 0;
      if (left <= settings.lowStockThreshold) low.push({ p, s, left });
    }));
    low.sort((a, b) => a.left - b.left);

    return {
      days, revenue, prevRevenue, aov, prevAov, newCust, prevCust,
      orders: cur.length, prevOrders: prev.length,
      top, byStatus, low: low.slice(0, 7), lowCount: low.length,
      recent: db.orders.slice(0, 6),
      toFulfil: db.orders.filter((o) => o.status === 'paid' || o.status === 'processing').length,
    };
  }, [db.orders, db.users, db.products, settings.lowStockThreshold, range]);

  const spark = m.days.map((d) => d.revenue).slice(-Math.max(12, Math.min(range, 30)));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const maxStatus = Math.max(...m.byStatus.map((x) => x.n), 1);
  const maxUnits = Math.max(...m.top.map((x) => x.units), 1);

  return (
    <div className="page">
      <PageHeader
        title={`${greet}, ${user.name.split(' ')[0]}`}
        sub={m.toFulfil ? `${m.toFulfil} order${m.toFulfil === 1 ? '' : 's'} waiting to be fulfilled.` : 'Every order is fulfilled. Stay tall.'}
      />

      <div className="filters-row">
        <Segmented id="range" value={range} onChange={setRange} options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} />
        <span className="filters-row__note">Compared with the {range} days before</span>
      </div>

      <div className="tiles">
        <Tile hero label="Revenue" value={m.revenue} format={money} cur={m.revenue} prev={m.prevRevenue} spark={spark} delay={0} />
        <Tile label="Orders" value={m.orders} format={count} cur={m.orders} prev={m.prevOrders} delay={0.06} />
        <Tile label="Average order" value={m.aov} format={money} cur={m.aov} prev={m.prevAov} delay={0.12} />
        <Tile label="New customers" value={m.newCust} format={count} cur={m.newCust} prev={m.prevCust} delay={0.18} />
      </div>

      <div className="dash-grid">
        <Card title="Daily revenue" sub={`${fmtCompact(m.revenue)} over the last ${range} days, excluding cancelled and refunded orders`} className="span-4" delay={0.15}>
          <RevenueChart data={m.days} animKey={range} />
        </Card>

        <Card title="Orders by status" sub={`Last ${range} days`} className="span-2" delay={0.2}>
          <ul className="statlist">
            {m.byStatus.map(({ s, n }, i) => (
              <li key={s}>
                <Link to={`/admin/orders?status=${s}`}><StatusPill status={s} /></Link>
                <Meter value={n} max={maxStatus} delay={0.3 + i * 0.05} />
                <b>{n}</b>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Best sellers" sub="Units sold in this period" delay={0.25}>
          {m.top.length === 0 ? <p className="muted">No sales in this period yet.</p> : (
            <ul className="toplist">
              {m.top.map((t, i) => (
                <li key={t.id} onClick={() => productById(t.id) && navigate(`/admin/products/${t.id}`)}>
                  <span className="toplist__rank mono">{i + 1}</span>
                  <Thumb product={t} size={40} />
                  <div className="toplist__name">
                    <b>{t.name}</b>
                    <span>{COLORWAYS[t.cw]?.name} · {fmt(t.revenue)}</span>
                  </div>
                  <Meter value={t.units} max={maxUnits} delay={0.35 + i * 0.05} />
                  <b className="toplist__n">{t.units}</b>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Low stock" sub={`${m.lowCount} size${m.lowCount === 1 ? '' : 's'} at or under ${settings.lowStockThreshold} units`} delay={0.3}
          actions={<Link className="alink" to="/admin/products?filter=low">Restock →</Link>}>
          {m.low.length === 0 ? <p className="muted">Shelves are full.</p> : (
            <ul className="lowlist">
              {m.low.map(({ p, s, left }) => (
                <li key={p.id + s} onClick={() => navigate(`/admin/products/${p.id}`)}>
                  <Thumb product={p} size={34} />
                  <span><b>{p.name}</b> <em>{COLORWAYS[p.cw].name} · {s}</em></span>
                  <span className={`stockchip ${left === 0 ? 'is-out' : 'is-low'}`}>
                    <Icon name="alert" size={12} /> {left === 0 ? 'Sold out' : `${left} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent orders" className="span-full" delay={0.35} actions={<Link className="alink" to="/admin/orders">All orders →</Link>}>
          <table className="atable">
            <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Placed</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {m.recent.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td className="mono">#{o.id}</td>
                  <td>{o.customer.name}</td>
                  <td className="hide-sm muted">{timeAgo(o.createdAt)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td className="num">{fmt(o.total)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
