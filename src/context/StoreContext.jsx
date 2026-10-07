import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { evaluateDiscount } from '../lib/db';
import { useDb } from './DbContext';

const StoreContext = createContext(null);
const STORAGE_KEY = 'staytall.bag.v1';

function loadBag() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(items) ? items.filter((i) => i && i.key && i.qty > 0) : [];
  } catch {
    return [];
  }
}

function bagReducer(items, action) {
  switch (action.type) {
    case 'add': {
      const key = `${action.id}|${action.size}`;
      const found = items.find((i) => i.key === key);
      if (found) return items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { key, id: action.id, size: action.size, qty: 1 }];
    }
    case 'qty':
      return items
        .map((i) => (i.key === action.key ? { ...i, qty: Math.max(0, Math.min(action.max ?? Infinity, i.qty + action.delta)) } : i))
        .filter((i) => i.qty > 0);
    case 'remove':
      return items.filter((i) => i.key !== action.key);
    case 'clear':
      return [];
    default:
      return items;
  }
}

export function StoreProvider({ children }) {
  const { db, productById, placeOrder } = useDb();
  const [items, dispatch] = useReducer(bagReducer, undefined, loadBag);
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState(null); // { product, origin: {x, y} }
  const [toast, setToast] = useState(null);
  const [promo, setPromo] = useState('');
  const toastTimer = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — bag just won't persist */
    }
  }, [items]);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, k: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Lines only for products that still exist and are on sale.
  const lines = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: productById(i.id) }))
        .filter((l) => l.product && l.product.status === 'active')
        .map((l) => ({ ...l, available: l.product.stock?.[l.size] ?? 0 })),
    [items, productById]
  );

  const addToBag = useCallback(
    (id, size) => {
      const p = productById(id);
      if (!p) return false;
      const available = p.stock?.[size] ?? 0;
      const inBag = items.find((i) => i.key === `${id}|${size}`)?.qty ?? 0;
      if (available <= 0) {
        showToast(`${p.name} · ${size} is sold out`);
        return false;
      }
      if (inBag >= available) {
        showToast(`Only ${available} left in ${size} — they're all in your bag`);
        return false;
      }
      dispatch({ type: 'add', id, size });
      showToast(`${p.name} · ${size} — added to bag`);
      return true;
    },
    [items, productById, showToast]
  );

  const value = useMemo(() => {
    const s = db.settings;
    const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0);
    const promoResult = evaluateDiscount(db.discounts, promo, subtotal);
    const discount = promoResult.ok ? promoResult.amount : 0;
    const shipping = subtotal === 0 || subtotal - discount >= s.freeShippingThreshold ? 0 : s.shippingFee;

    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      promo,
      promoResult,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      freeShippingThreshold: s.freeShippingThreshold,
      addToBag,
      changeQty: (key, delta) => {
        const line = lines.find((l) => l.key === key);
        if (delta > 0 && line && line.qty >= line.available) {
          showToast(`Only ${line.available} left in ${line.size}`);
          return;
        }
        dispatch({ type: 'qty', key, delta, max: line?.available });
      },
      removeLine: (key) => dispatch({ type: 'remove', key }),
      clearBag: () => dispatch({ type: 'clear' }),
      applyPromo: (code) => {
        const r = evaluateDiscount(db.discounts, code, subtotal);
        if (r.ok || r.discount) setPromo(code.trim().toUpperCase());
        return r;
      },
      clearPromo: () => setPromo(''),
      /** Creates the order in the demo database and empties the bag. */
      checkout: ({ customer, address }) => {
        const order = placeOrder({
          customer,
          address,
          items: lines.map((l) => ({
            productId: l.product.id, name: l.product.name, type: l.product.type, cw: l.product.cw,
            size: l.size, qty: Math.min(l.qty, l.available), price: l.product.price,
          })).filter((x) => x.qty > 0),
          discount: discount ? { code: promoResult.discount.code, amount: discount } : null,
          shipping,
        });
        dispatch({ type: 'clear' });
        setPromo('');
        return order;
      },
      cartOpen,
      setCartOpen,
      product,
      openProduct: (p, origin) => setProduct({ product: p, origin }),
      closeProduct: () => setProduct(null),
      toast,
      showToast,
    };
  }, [db.settings, db.discounts, lines, promo, cartOpen, product, toast, addToBag, showToast, placeOrder]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
