import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { fmt } from '../../data/products';
import { fmtDate, initials, isRevenue, timeAgo } from '../../lib/db';
import { Drawer, Empty, PageHeader, SearchInput, Segmented, StatusPill, Toggle } from '../../components/admin/ui';

function useCustomerStats() {
  const { db } = useDb();
  return useMemo(() => {
    const stats = {};
    db.users.forEach((u) => (stats[u.id] = { orders: [], spent: 0, last: null }));
    db.orders.forEach((o) => {
      const u = db.users.find((x) => x.id === o.customer.userId || x.email === o.customer.email);
      if (!u) return;
      const s = stats[u.id];
      s.orders.push(o);
      if (isRevenue(o)) s.spent += o.total;
      s.last = Math.max(s.last || 0, o.createdAt);
    });
    return stats;
  }, [db.users, db.orders]);
}

function Profile({ person, stats }) {
  const { patchUser } = useDb();
  const { user } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const self = person.id === user.id;
  const aov = stats.orders.filter(isRevenue).length ? stats.spent / stats.orders.filter(isRevenue).length : 0;

  return (
    <div className="odetail">
      <header className="profile__head">
        <motion.span className="profile__avatar" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
          {initials(person.name)}
        </motion.span>
        <div>
          <h2>{person.name}</h2>
          <p className="muted">{person.email}</p>
        </div>
      </header>

      <div className="profile__stats">
        <div><span>Orders</span><b>{stats.orders.length}</b></div>
        <div><span>Spent</span><b>{fmt(stats.spent)}</b></div>
        <div><span>Avg order</span><b>{fmt(aov)}</b></div>
      </div>

      <section className="odetail__sec">
        <div className="setrow">
          <div>
            <b>Owner access</b>
            <span>{self ? "You can't remove your own access." : 'Lets this person open the admin console.'}</span>
          </div>
          <Toggle
            checked={person.role === 'admin'}
            disabled={self}
            label="Owner access"
            onChange={(on) => { patchUser(person.id, { role: on ? 'admin' : 'customer' }); showToast(on ? `${person.name} is now an admin` : `${person.name} is a customer again`); }}
          />
        </div>
      </section>

      <section className="odetail__sec">
        <h4>Details</h4>
        <p className="muted">Joined {fmtDate(person.createdAt)}{person.passwordHash ? '' : ' · no password set (imported customer)'}</p>
        {person.address?.line1 && <p className="muted">{person.address.line1}, {person.address.city}, {person.address.country}</p>}
      </section>

      <section className="odetail__sec">
        <h4>Orders</h4>
        {stats.orders.length === 0 ? <p className="muted">No orders yet.</p> : (
          <ul className="plist">
            {stats.orders.map((o) => (
              <li key={o.id} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                <span className="mono">#{o.id}</span>
                <span className="muted">{fmtDate(o.createdAt)}</span>
                <StatusPill status={o.status} />
                <b className="num">{fmt(o.total)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Customers() {
  const { db } = useDb();
  const { id } = useParams();
  const navigate = useNavigate();
  const stats = useCustomerStats();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('spent');
  const open = id ? db.users.find((u) => u.id === id) : null;

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.users
      .filter((u) => !term || `${u.name} ${u.email}`.toLowerCase().includes(term))
      .sort((a, b) =>
        sort === 'spent' ? stats[b.id].spent - stats[a.id].spent
          : sort === 'recent' ? b.createdAt - a.createdAt
            : stats[b.id].orders.length - stats[a.id].orders.length
      );
  }, [db.users, q, sort, stats]);

  const buyers = db.users.filter((u) => stats[u.id].orders.length > 0).length;

  return (
    <div className="page">
      <PageHeader title="Customers" sub={`${db.users.length} accounts · ${buyers} have ordered`} />

      <div className="filters-row">
        <Segmented id="csort" value={sort} onChange={setSort} options={[{ value: 'spent', label: 'Top spenders' }, { value: 'orders', label: 'Most orders' }, { value: 'recent', label: 'Newest' }]} />
        <div className="filters-row__right"><SearchInput value={q} onChange={setQ} placeholder="Name or email" /></div>
      </div>

      <div className="acard acard--flush">
        {list.length === 0 ? <Empty icon="users" title="No one matches that search" /> : (
          <table className="atable">
            <thead>
              <tr><th>Customer</th><th className="num">Orders</th><th className="num">Spent</th><th className="hide-sm">Last order</th><th className="hide-md">Joined</th></tr>
            </thead>
            <tbody>
              {list.map((u, i) => {
                const s = stats[u.id];
                return (
                  <motion.tr key={u.id} layout className={id === u.id ? 'is-selected' : ''} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.025 }} onClick={() => navigate(`/admin/customers/${u.id}`)}>
                    <td>
                      <div className="crow">
                        <span className="crow__avatar">{initials(u.name)}</span>
                        <div>
                          <b>{u.name} {u.role === 'admin' && <span className="tagchip">Owner</span>}</b>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num">{s.orders.length}</td>
                    <td className="num">{fmt(s.spent)}</td>
                    <td className="hide-sm muted">{s.last ? timeAgo(s.last) : '—'}</td>
                    <td className="hide-md muted">{fmtDate(u.createdAt)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={!!open} onClose={() => navigate('/admin/customers')} label={open ? open.name : 'Customer'}>
        {open && <Profile key={open.id} person={open} stats={stats[open.id]} />}
      </Drawer>
    </div>
  );
}
