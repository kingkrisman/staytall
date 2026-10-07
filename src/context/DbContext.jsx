import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DB_KEY, loadDb, saveDb, seedDb, slugify } from '../lib/db';
import { sizesFor } from '../data/products';

const DbContext = createContext(null);

/**
 * The demo backend. State is mirrored to localStorage and synced across tabs,
 * so an owner editing in /admin sees the storefront in another tab update live.
 */
export function DbProvider({ children }) {
  const [db, setDb] = useState(loadDb);
  const ref = useRef(db);
  ref.current = db;

  useEffect(() => saveDb(db), [db]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== DB_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue);
        ref.current = next;
        setDb(next);
      } catch {
        /* ignore malformed writes */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const commit = useCallback((recipe) => {
    const next = recipe(ref.current);
    ref.current = next;
    setDb(next);
    return next;
  }, []);

  const actions = useMemo(
    () => ({
      saveProduct(input) {
        let saved;
        commit((d) => {
          const exists = d.products.some((p) => p.id === input.id);
          if (exists) {
            saved = { ...d.products.find((p) => p.id === input.id), ...input };
            return { ...d, products: d.products.map((p) => (p.id === input.id ? saved : p)) };
          }
          let id = slugify(`${input.name}-${input.cw}`);
          while (d.products.some((p) => p.id === id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
          saved = { ...input, id, createdAt: Date.now() };
          return { ...d, products: [saved, ...d.products] };
        });
        return saved;
      },
      deleteProduct(id) {
        commit((d) => ({
          ...d,
          products: d.products.filter((p) => p.id !== id),
          settings: { ...d.settings, dropIds: d.settings.dropIds.filter((x) => x !== id) },
        }));
      },
      patchProduct(id, patch) {
        commit((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      },
      toggleDrop(id) {
        commit((d) => {
          const has = d.settings.dropIds.includes(id);
          const dropIds = has ? d.settings.dropIds.filter((x) => x !== id) : [...d.settings.dropIds, id];
          return { ...d, settings: { ...d.settings, dropIds } };
        });
      },
      placeOrder({ customer, address, items, discount, shipping }) {
        let order;
        commit((d) => {
          const number = Math.max(1000, ...d.orders.map((o) => o.number)) + 1;
          const subtotal = items.reduce((n, x) => n + x.price * x.qty, 0);
          const now = Date.now();
          order = {
            id: `ST-${number}`, number, createdAt: now, customer, address, items, subtotal, discount, shipping,
            total: subtotal - (discount?.amount || 0) + shipping,
            status: 'paid', timeline: [{ status: 'paid', at: now }], note: '',
          };
          const products = d.products.map((p) => {
            const mine = items.filter((x) => x.productId === p.id);
            if (!mine.length) return p;
            const stock = { ...p.stock };
            mine.forEach((x) => (stock[x.size] = Math.max(0, (stock[x.size] || 0) - x.qty)));
            return { ...p, stock };
          });
          const discounts = discount
            ? d.discounts.map((x) => (x.code === discount.code ? { ...x, uses: x.uses + 1 } : x))
            : d.discounts;
          return { ...d, orders: [order, ...d.orders], products, discounts };
        });
        return order;
      },
      setOrderStatus(id, status) {
        commit((d) => {
          const order = d.orders.find((o) => o.id === id);
          if (!order || order.status === status) return d;
          // Cancelling or refunding puts the units back on the shelf (once).
          const restock = (status === 'cancelled' || status === 'refunded') && order.status !== 'cancelled' && order.status !== 'refunded';
          const products = restock
            ? d.products.map((p) => {
                const mine = order.items.filter((x) => x.productId === p.id);
                if (!mine.length) return p;
                const stock = { ...p.stock };
                mine.forEach((x) => (stock[x.size] = (stock[x.size] || 0) + x.qty));
                return { ...p, stock };
              })
            : d.products;
          const orders = d.orders.map((o) =>
            o.id === id ? { ...o, status, timeline: [...o.timeline, { status, at: Date.now() }] } : o
          );
          return { ...d, orders, products };
        });
      },
      setOrderNote(id, note) {
        commit((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, note } : o)) }));
      },
      saveDiscount(input, originalCode) {
        commit((d) => {
          const code = input.code.trim().toUpperCase();
          const rest = d.discounts.filter((x) => x.code !== (originalCode || code));
          const prev = d.discounts.find((x) => x.code === (originalCode || code));
          return { ...d, discounts: [{ uses: 0, createdAt: Date.now(), ...prev, ...input, code }, ...rest] };
        });
      },
      deleteDiscount(code) {
        commit((d) => ({ ...d, discounts: d.discounts.filter((x) => x.code !== code) }));
      },
      updateSettings(patch) {
        commit((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      },
      addUser(user) {
        commit((d) => ({ ...d, users: [...d.users, user] }));
      },
      patchUser(id, patch) {
        commit((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
      },
      resetDemo() {
        commit(() => seedDb());
      },
    }),
    [commit]
  );

  const value = useMemo(() => {
    const productById = (id) => db.products.find((p) => p.id === id);
    const visibleProducts = db.products.filter((p) => p.status === 'active');
    const dropProducts = db.settings.dropIds.map(productById).filter((p) => p && p.status === 'active');
    return { db, settings: db.settings, productById, visibleProducts, dropProducts, getRef: () => ref.current, ...actions };
  }, [db, actions]);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export const useDb = () => useContext(DbContext);

/** Fresh product template for the editor. */
export const blankProduct = () => ({
  id: null,
  name: '',
  type: 'hoodie',
  cw: 'onyx',
  price: 50000,
  compareAt: null,
  tag: 'New',
  desc: '',
  status: 'draft',
  stock: Object.fromEntries(sizesFor('hoodie').map((s) => [s, 10])),
});
