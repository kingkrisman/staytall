/**
 * Demo "database": everything lives in localStorage in this browser.
 * Seeded deterministically so the admin dashboard has a believable history.
 */
import { SEED_PRODUCTS, sizesFor } from '../data/products';
import { sha256 } from './sha256';

export const DB_KEY = 'staytall.db.v2';
export const DB_VERSION = 2;
const DAY = 86400000;

export const DEMO_ACCOUNTS = {
  admin: { email: 'owner@staytall.com', password: 'staytall123', label: 'Store owner (admin)' },
  customer: { email: 'ada@example.com', password: 'password123', label: 'Customer' },
};

export const hashPassword = (email, password) => sha256(`${email.trim().toLowerCase()}::${password}`);

export const ORDER_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const STATUS_LABEL = {
  paid: 'Paid', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};
/** Statuses whose revenue counts. */
export const isRevenue = (o) => o.status !== 'cancelled' && o.status !== 'refunded';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PEOPLE = [
  ['Ada Obi', 'ada@example.com', '14 Admiralty Way', 'Lagos', 'NG'],
  ['Tunde Bakare', 'tunde.b@example.com', '3 Ozumba Mbadiwe Ave', 'Lagos', 'NG'],
  ['Zainab Musa', 'zainab.musa@example.com', '21 Aminu Kano Cres', 'Abuja', 'NG'],
  ['Chidi Okeke', 'chidi@example.com', '8 Aba Road', 'Port Harcourt', 'NG'],
  ['Kemi Adeyemi', 'kemi.a@example.com', '45 Allen Avenue', 'Lagos', 'NG'],
  ['Emeka Nwosu', 'emeka.n@example.com', '12 Ogui Road', 'Enugu', 'NG'],
  ['Amara Eze', 'amara@example.com', '7 Bourdillon Rd', 'Lagos', 'NG'],
  ['Kwame Mensah', 'kwame.m@example.com', '19 Oxford St', 'Accra', 'GH'],
  ['Funmi Lawal', 'funmi.l@example.com', '2 Ring Road', 'Ibadan', 'NG'],
  ['David Okafor', 'd.okafor@example.com', '88 Peckham High St', 'London', 'GB'],
  ['Bisi Ogun', 'bisi.ogun@example.com', '30 Awolowo Rd', 'Lagos', 'NG'],
  ['Musa Bello', 'musa.bello@example.com', '5 Ahmadu Bello Way', 'Kaduna', 'NG'],
  ['Ifeoma Uche', 'ifeoma@example.com', '11 Atlantic Ave', 'Brooklyn', 'US'],
  ['Seyi Johnson', 'seyi.j@example.com', '64 Herbert Macaulay Way', 'Lagos', 'NG'],
];

export function defaultSettings(now = Date.now()) {
  return {
    storeName: 'STAY TALL',
    storeOpen: true,
    closedMessage: "We're restocking the sky. The next drop lands soon.",
    nextDropAt: new Date(now + 9 * DAY).toISOString().slice(0, 16),
    announcement: { enabled: true, text: 'Free shipping on orders over ₦150,000 ✦ FW26 Ascend is live ✦ 500 units per style' },
    heroTagline: 'Streetwear for the ones who refuse to shrink.',
    heroCta: 'Shop the drop',
    marqueeTop: ['STAY TALL', 'RISE ABOVE', 'NEVER BOW', 'ASCEND'],
    marqueeBottom: ['FW26 COLLECTION', 'LIMITED UNITS', 'WORLDWIDE SHIPPING', 'NO RESTOCKS'],
    manifesto:
      'Gravity is a *suggestion.* We cut cloth for the ones who stand up when the room sits down — who carry the night sky on their shoulders and still look up. Every stitch is a promise: whatever pulls you down, you *stay* *tall.*',
    dropTitle: 'ASCEND',
    dropYear: '26',
    dropIds: SEED_PRODUCTS.slice(0, 6).map((p) => p.id),
    freeShippingThreshold: 150000,
    shippingFee: 5000,
    lowStockThreshold: 5,
  };
}

export function seedDb(now = Date.now()) {
  const rand = mulberry32(2026);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

  // Catalogue with stock — a few sizes sold out and one style running low, so alerts have something to say.
  const products = SEED_PRODUCTS.map((p, i) => {
    const stock = {};
    sizesFor(p.type).forEach((s) => (stock[s] = int(4, 34)));
    if (p.id === 'gravity-shell-onyx') { stock.XS = 0; stock.XXL = 2; stock.S = 3; }
    if (p.id === 'altitude-varsity-bone') Object.keys(stock).forEach((s) => (stock[s] = int(0, 3)));
    if (p.id === 'halo-cap-onyx') stock['One size'] = 4;
    return {
      ...p,
      compareAt: p.id === 'north-star-tee-ash' ? 45000 : null,
      status: 'active',
      stock,
      createdAt: now - (60 - i) * DAY,
    };
  });

  const users = [
    {
      id: 'u-owner', name: 'Owner', email: DEMO_ACCOUNTS.admin.email, role: 'admin',
      passwordHash: hashPassword(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password),
      createdAt: now - 120 * DAY, address: { line1: 'Studio 4, 9 Bishop Aboyade Cole St', city: 'Lagos', country: 'NG' },
    },
    ...PEOPLE.map(([name, email, line1, city, country], i) => ({
      id: `u-${i + 1}`, name, email, role: 'customer',
      passwordHash: email === DEMO_ACCOUNTS.customer.email ? hashPassword(email, DEMO_ACCOUNTS.customer.password) : null,
      createdAt: now - int(20, 110) * DAY, address: { line1, city, country },
    })),
  ];
  const customers = users.filter((u) => u.role === 'customer');

  const orders = [];
  const N = 54;
  for (let i = 0; i < N; i++) {
    // Skew toward recent days so the trend climbs into the drop.
    const age = Math.floor(rand() ** 1.6 * 88) * DAY + int(0, 23) * 3600000 + int(0, 59) * 60000;
    const createdAt = now - age - (i < 3 ? 0 : 3600000);
    const buyer = i < 3 ? customers[0] : pick(customers);
    const items = [];
    const lines = rand() < 0.62 ? 1 : rand() < 0.75 ? 2 : 3;
    for (let l = 0; l < lines; l++) {
      const p = pick(products);
      const size = pick(sizesFor(p.type));
      const existing = items.find((x) => x.productId === p.id && x.size === size);
      if (existing) existing.qty += 1;
      else items.push({ productId: p.id, name: p.name, type: p.type, cw: p.cw, size, qty: rand() < 0.12 ? 2 : 1, price: p.price });
    }
    const subtotal = items.reduce((n, x) => n + x.price * x.qty, 0);
    const useCode = rand() < 0.18;
    const discount = useCode ? { code: 'TALL10', amount: Math.round(subtotal * 0.1) } : null;
    const shipping = subtotal >= 150000 ? 0 : 5000;
    const days = age / DAY;
    let status;
    if (days > 10) status = rand() < 0.08 ? 'refunded' : rand() < 0.06 ? 'cancelled' : 'delivered';
    else if (days > 4) status = rand() < 0.55 ? 'delivered' : 'shipped';
    else if (days > 1) status = rand() < 0.5 ? 'shipped' : 'processing';
    else status = rand() < 0.5 ? 'processing' : 'paid';

    const flow = { paid: ['paid'], processing: ['paid', 'processing'], shipped: ['paid', 'processing', 'shipped'],
      delivered: ['paid', 'processing', 'shipped', 'delivered'], cancelled: ['paid', 'cancelled'], refunded: ['paid', 'processing', 'shipped', 'delivered', 'refunded'] }[status];
    let t = createdAt;
    const gap = Math.min(DAY, age / (flow.length + 1));
    const timeline = flow.map((s, k) => {
      if (k > 0) t += gap * (0.6 + rand() * 0.8) * (s === 'refunded' ? 3 : 1);
      return { status: s, at: Math.min(now, Math.round(t)) };
    });

    orders.push({
      id: '', number: 0, createdAt,
      customer: { userId: buyer.id, name: buyer.name, email: buyer.email },
      address: buyer.address,
      items, subtotal, discount, shipping,
      total: subtotal - (discount?.amount || 0) + shipping,
      status, timeline, note: '',
    });
  }
  orders.sort((a, b) => a.createdAt - b.createdAt);
  orders.forEach((o, i) => { o.number = 1001 + i; o.id = `ST-${o.number}`; });
  orders.reverse(); // newest first

  const discounts = [
    { code: 'TALL10', type: 'percent', value: 10, minSubtotal: 0, active: true, uses: orders.filter((o) => o.discount?.code === 'TALL10').length, createdAt: now - 80 * DAY },
    { code: 'WELCOME5K', type: 'fixed', value: 5000, minSubtotal: 50000, active: true, uses: 0, createdAt: now - 30 * DAY },
    { code: 'ASCEND25', type: 'percent', value: 25, minSubtotal: 100000, active: false, uses: 0, createdAt: now - 12 * DAY },
  ];

  return { version: DB_VERSION, seededAt: now, products, users, orders, discounts, settings: defaultSettings(now) };
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (db?.version === DB_VERSION) return { ...db, settings: { ...defaultSettings(), ...db.settings } };
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return seedDb();
}

export function saveDb(db) {
  try {
    const raw = JSON.stringify(db);
    if (localStorage.getItem(DB_KEY) !== raw) localStorage.setItem(DB_KEY, raw);
  } catch {
    /* storage full or blocked — the session still works in memory */
  }
}

/** Discount for a code against a subtotal: { ok, amount, error, discount }. */
export function evaluateDiscount(discounts, code, subtotal) {
  if (!code) return { ok: false, amount: 0 };
  const d = discounts.find((x) => x.code === code.trim().toUpperCase());
  if (!d) return { ok: false, amount: 0, error: "That code doesn't exist" };
  if (!d.active) return { ok: false, amount: 0, error: 'That code has expired' };
  if (subtotal < d.minSubtotal) return { ok: false, amount: 0, error: `Spend ₦${d.minSubtotal.toLocaleString('en-NG')} to use ${d.code}`, discount: d };
  const amount = d.type === 'percent' ? Math.round((subtotal * d.value) / 100) : Math.min(d.value, subtotal);
  return { ok: true, amount, discount: d };
}

export const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'product';

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export const timeAgo = (ts, now = Date.now()) => {
  const s = Math.max(1, Math.round((now - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const fmtDate = (ts, withTime = false) =>
  new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
