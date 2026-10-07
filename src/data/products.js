export const COLORWAYS = {
  onyx: { name: 'Onyx', fill: '#141414', shade: '#000000', print: '#f4f2ec', bg: '#dedbd4', ink: '#0a0a0a' },
  bone: { name: 'Bone', fill: '#efece5', shade: '#bdb9b0', print: '#0b0b0b', bg: '#161616', ink: '#f4f2ec' },
  ash:  { name: 'Ash',  fill: '#5d5d5d', shade: '#2c2c2c', print: '#f4f2ec', bg: '#c9c9c9', ink: '#0a0a0a' },
  void: { name: 'Void', fill: '#262626', shade: '#050505', print: '#f4f2ec', bg: '#3b3b3b', ink: '#f4f2ec' },
};

export const GARMENT_TYPES = ['hoodie', 'tee', 'jacket', 'pants', 'cap', 'beanie'];

export const TAGS = ['', 'New', 'Limited', 'Bestseller', 'Restock'];

/** Seed catalogue — the live catalogue lives in the demo database (see lib/db.js). */
export const SEED_PRODUCTS = [
  { id: 'ascend-hoodie-onyx', name: 'Ascend Hoodie', type: 'hoodie', cw: 'onyx', price: 85000, tag: 'Bestseller',
    desc: 'Our signature heavyweight hoodie. Double-layer hood, 3D puff Ascend mark across the chest, and a cut that stands tall on its own.' },
  { id: 'orbit-tee-bone', name: 'Orbit Tee', type: 'tee', cw: 'bone', price: 38000, tag: 'New',
    desc: 'Boxy, dense and built to outlast trends. The orbit ring wraps the back; the star sits right over your heart.' },
  { id: 'gravity-shell-onyx', name: 'Gravity Shell', type: 'jacket', cw: 'onyx', price: 145000, tag: 'Limited',
    desc: 'Water-resistant technical shell with storm collar and reflective Ascend mark. For nights when the weather tries you.' },
  { id: 'pillar-cargo-ash', name: 'Pillar Cargo', type: 'pants', cw: 'ash', price: 72000, tag: 'New',
    desc: 'Relaxed straight-leg cargo with twin pillar seams running the length of the leg. Stacks perfectly over any sneaker.' },
  { id: 'halo-cap-onyx', name: 'Halo Cap', type: 'cap', cw: 'onyx', price: 28000, tag: 'Restock',
    desc: 'Six-panel structured cap. Embroidered mark up front, halo ring stitched on the underbrim. The crown stays sharp.' },
  { id: 'tower-hoodie-void', name: 'Tower Hoodie', type: 'hoodie', cw: 'void', price: 92000, tag: 'New',
    desc: 'Void-washed hoodie with a tonal tower graphic up the spine. Looks like the night sky from a rooftop.' },
  { id: 'ascend-hoodie-bone', name: 'Ascend Hoodie', type: 'hoodie', cw: 'bone', price: 85000, tag: 'Bestseller',
    desc: 'The signature hoodie in Bone. Same 480 GSM weight, same attitude, lighter shade.' },
  { id: 'north-star-tee-ash', name: 'North Star Tee', type: 'tee', cw: 'ash', price: 38000, tag: '',
    desc: 'Garment-dyed Ash tee with a single oversized four-point star. Wear it as a reminder of which way is up.' },
  { id: 'altitude-varsity-bone', name: 'Altitude Varsity', type: 'jacket', cw: 'bone', price: 165000, tag: 'Limited',
    desc: 'Wool-blend varsity in Bone with satin lining and a chenille Ascend patch. Only 500 made. Never again.' },
  { id: 'orbit-tee-onyx', name: 'Orbit Tee', type: 'tee', cw: 'onyx', price: 38000, tag: '',
    desc: 'The Orbit Tee in classic Onyx. Boxy, heavy, quietly loud.' },
  { id: 'pillar-cargo-onyx', name: 'Pillar Cargo', type: 'pants', cw: 'onyx', price: 72000, tag: '',
    desc: 'Pillar Cargo in Onyx. Twin seams, deep pockets, zero compromises.' },
  { id: 'halo-beanie-bone', name: 'Halo Beanie', type: 'beanie', cw: 'bone', price: 24000, tag: '',
    desc: 'Chunky rib-knit beanie with a woven mark on the cuff. Keeps your head warm and high.' },
];

export const CATEGORY = { hoodie: 'hoodie', tee: 'tee', jacket: 'jacket', pants: 'pants', cap: 'head', beanie: 'head' };
export const TYPE_LABEL = { hoodie: 'Hoodie', tee: 'T-Shirt', jacket: 'Outerwear', pants: 'Bottoms', cap: 'Headwear', beanie: 'Headwear' };

export const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'tee', label: 'Tees' },
  { key: 'jacket', label: 'Outerwear' },
  { key: 'pants', label: 'Bottoms' },
  { key: 'head', label: 'Headwear' },
];

export const sizesFor = (type) =>
  type === 'cap' || type === 'beanie' ? ['One size'] : type === 'pants' ? ['28', '30', '32', '34', '36'] : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const fmt = (n) => '₦' + Math.round(n).toLocaleString('en-NG');

/** ₦1.2M / ₦85K style, for chart axes and tiles. */
export const fmtCompact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `₦${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (a >= 1e3) return `₦${Math.round(n / 1e3)}K`;
  return `₦${Math.round(n)}`;
};

export const totalStock = (p) => Object.values(p.stock || {}).reduce((n, v) => n + (Number(v) || 0), 0);
