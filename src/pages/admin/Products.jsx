import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { CATEGORY, COLORWAYS, fmt, sizesFor, totalStock, TYPE_LABEL } from '../../data/products';
import { Button, Confirm, Empty, Icon, PageHeader, SearchInput, Segmented, Thumb, Toggle } from '../../components/admin/ui';

const CATS = [['all', 'All categories'], ['hoodie', 'Hoodies'], ['tee', 'Tees'], ['jacket', 'Outerwear'], ['pants', 'Bottoms'], ['head', 'Headwear']];

function StockBar({ p, low }) {
  const sizes = sizesFor(p.type);
  const total = totalStock(p);
  return (
    <div className="stockbar" title={sizes.map((s) => `${s}: ${p.stock?.[s] ?? 0}`).join('  ·  ')}>
      <div className="stockbar__cells">
        {sizes.map((s) => {
          const n = p.stock?.[s] ?? 0;
          return <i key={s} className={n === 0 ? 'is-out' : n <= low ? 'is-low' : ''} />;
        })}
      </div>
      <span className={total === 0 ? 'is-out' : ''}>{total === 0 ? 'Sold out' : `${total} in stock`}</span>
    </div>
  );
}

export default function Products() {
  const { db, settings, patchProduct, deleteProduct, toggleDrop } = useDb();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [doomed, setDoomed] = useState(null);
  const filter = params.get('filter') || 'all';
  const low = settings.lowStockThreshold;

  const isLow = (p) => sizesFor(p.type).some((s) => (p.stock?.[s] ?? 0) <= low);
  const counts = {
    all: db.products.length,
    active: db.products.filter((p) => p.status === 'active').length,
    draft: db.products.filter((p) => p.status === 'draft').length,
    low: db.products.filter(isLow).length,
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.products.filter((p) => {
      if (filter === 'active' && p.status !== 'active') return false;
      if (filter === 'draft' && p.status !== 'draft') return false;
      if (filter === 'low' && !isLow(p)) return false;
      if (cat !== 'all' && CATEGORY[p.type] !== cat) return false;
      if (term && !`${p.name} ${COLORWAYS[p.cw].name} ${p.type} ${p.tag}`.toLowerCase().includes(term)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.products, q, cat, filter, low]);

  const setFilter = (f) => setParams(f === 'all' ? {} : { filter: f }, { replace: true });

  return (
    <div className="page">
      <PageHeader
        title="Products"
        sub={`${counts.active} live on the storefront · ${counts.draft} draft${counts.draft === 1 ? '' : 's'}`}
        actions={<Button icon="plus" onClick={() => navigate('/admin/products/new')}>New product</Button>}
      />

      <div className="filters-row">
        <Segmented id="pfilter" value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'active', label: 'Active', count: counts.active },
          { value: 'draft', label: 'Drafts', count: counts.draft },
          { value: 'low', label: 'Low stock', count: counts.low },
        ]} />
        <div className="filters-row__right">
          <select className="aselect" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <SearchInput value={q} onChange={setQ} placeholder="Search products" />
        </div>
      </div>

      <div className="acard acard--flush">
        {list.length === 0 ? (
          <Empty icon="shirt" title="No products match">Try a different filter, or create a new product.</Empty>
        ) : (
          <table className="atable atable--products">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hide-sm">Price</th>
                <th className="hide-md">Inventory</th>
                <th className="center">In drop</th>
                <th className="center">Live</th>
                <th className="right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={true}>
                {list.map((p, i) => {
                  const inDrop = settings.dropIds.includes(p.id);
                  return (
                    <motion.tr
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.03, duration: 0.45 } }}
                      exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
                      onClick={() => navigate(`/admin/products/${p.id}`)}
                    >
                      <td>
                        <div className="prow">
                          <Thumb product={p} size={52} />
                          <div>
                            <b>{p.name}</b>
                            <span>{TYPE_LABEL[p.type]} · {COLORWAYS[p.cw].name}{p.tag ? ` · ${p.tag}` : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hide-sm num-l">
                        {fmt(p.price)}
                        {p.compareAt > p.price && <s className="muted"> {fmt(p.compareAt)}</s>}
                      </td>
                      <td className="hide-md"><StockBar p={p} low={low} /></td>
                      <td className="center">
                        <button
                          className={`starbtn ${inDrop ? 'is-on' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleDrop(p.id); showToast(inDrop ? `${p.name} removed from the drop` : `${p.name} added to the drop`); }}
                          aria-pressed={inDrop}
                          aria-label={inDrop ? 'Remove from the drop' : 'Add to the drop'}
                        >
                          <Icon name="star" size={18} />
                        </button>
                      </td>
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <Toggle
                          size="sm"
                          checked={p.status === 'active'}
                          label={`${p.name} visible on storefront`}
                          onChange={(on) => { patchProduct(p.id, { status: on ? 'active' : 'draft' }); showToast(on ? `${p.name} is live` : `${p.name} hidden from the store`); }}
                        />
                      </td>
                      <td className="right">
                        <div className="rowacts" onClick={(e) => e.stopPropagation()}>
                          <button className="iconbtn" onClick={() => navigate(`/admin/products/${p.id}`)} aria-label={`Edit ${p.name}`}><Icon name="edit" size={16} /></button>
                          <button className="iconbtn iconbtn--danger" onClick={() => setDoomed(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <Confirm
        open={!!doomed}
        onClose={() => setDoomed(null)}
        danger
        title="Delete product?"
        confirmLabel="Delete"
        body={doomed ? `${doomed.name} (${COLORWAYS[doomed.cw].name}) will be removed from the store and the drop. Past orders keep their record.` : ''}
        onConfirm={() => { deleteProduct(doomed.id); showToast(`${doomed.name} deleted`); }}
      />
    </div>
  );
}
