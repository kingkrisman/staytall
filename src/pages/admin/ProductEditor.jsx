import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { blankProduct, useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { COLORWAYS, fmt, GARMENT_TYPES, sizesFor, TAGS, totalStock, TYPE_LABEL } from '../../data/products';
import { Button, Card, Confirm, EASE, Empty, Field, Icon, SaveBar, Segmented, Toggle } from '../../components/admin/ui';
import { Garment } from '../../components/Brand';

const TYPE_NAME = { hoodie: 'Hoodie', tee: 'Tee', jacket: 'Jacket', pants: 'Cargo', cap: 'Cap', beanie: 'Beanie' };

function Preview({ form }) {
  const c = COLORWAYS[form.cw];
  const total = totalStock(form);
  return (
    <div className="pv">
      <span className="pv__label mono">Storefront preview</span>
      <div className="pv__card" style={{ '--bg': c.bg, '--ink': c.ink }}>
        {(form.tag || total === 0) && <span className="pv__tag mono">{total === 0 ? 'Sold out' : form.tag}</span>}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${form.type}-${form.cw}`}
            className="pv__garment"
            initial={{ opacity: 0, scale: 0.6, rotate: -20, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20, y: -30 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="pv__float"><Garment product={form} /></div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="pv__info">
        <div>
          <b>{form.name || 'Untitled product'}</b>
          <span className="mono">{TYPE_LABEL[form.type]} — {c.name}</span>
        </div>
        <b className="pv__price">
          {form.compareAt > form.price && <s>{fmt(form.compareAt)}</s>}
          {fmt(form.price || 0)}
        </b>
      </div>
      <p className={`pv__status ${form.status === 'active' ? 'is-live' : ''}`}>
        <span /> {form.status === 'active' ? 'Visible on the storefront' : 'Draft — hidden from shoppers'}
      </p>
    </div>
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { productById, saveProduct, deleteProduct, settings, updateSettings } = useDb();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const existing = isNew ? null : productById(id);

  const initial = useMemo(
    () => (existing ? { ...existing, featured: settings.dropIds.includes(existing.id) } : { ...blankProduct(), featured: false }),
    // Re-seed only when switching products, not on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, !!existing]
  );
  const [form, setForm] = useState(initial);
  const [base, setBase] = useState(initial);
  const [errors, setErrors] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => { setForm(initial); setBase(initial); setErrors({}); }, [initial]);

  if (!isNew && !existing) {
    return (
      <div className="page">
        <Empty icon="shirt" title="This product no longer exists">
          <Button variant="ghost" onClick={() => navigate('/admin/products')}>Back to products</Button>
        </Empty>
      </div>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(base);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const sizes = sizesFor(form.type);

  const setType = (type) => {
    const next = {};
    sizesFor(type).forEach((s) => (next[s] = form.stock?.[s] ?? 10));
    set({ type, stock: next });
  };
  const setStock = (s, v) => set({ stock: { ...form.stock, [s]: Math.max(0, Math.min(9999, Math.round(Number(v) || 0))) } });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Give it a name';
    if (!(form.price > 0)) e.price = 'Price must be more than zero';
    if (form.compareAt && !(form.compareAt > form.price)) e.compareAt = 'Must be higher than the price to show as a sale';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = () => {
    if (!validate()) {
      showToast('Fix the highlighted fields');
      return;
    }
    const { featured, ...rest } = form;
    const saved = saveProduct({ ...rest, name: rest.name.trim(), desc: rest.desc.trim(), compareAt: rest.compareAt || null, id: isNew ? null : form.id });
    const inDrop = settings.dropIds.includes(saved.id);
    if (featured !== inDrop) {
      updateSettings({ dropIds: featured ? [...settings.dropIds.filter((x) => x !== saved.id), saved.id] : settings.dropIds.filter((x) => x !== saved.id) });
    }
    const fresh = { ...saved, featured };
    setForm(fresh);
    setBase(fresh);
    showToast(isNew ? `${saved.name} created` : 'Changes saved');
    if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
  };

  return (
    <div className="page">
      <div className="editor-head">
        <button className="backlink mono" onClick={() => navigate('/admin/products')}>← Products</button>
        <div className="editor-head__row">
          <h1 className="editor-head__title">{isNew ? 'New product' : form.name || 'Untitled'}</h1>
          <div className="editor-head__actions">
            {!isNew && <Button variant="ghost" icon="trash" onClick={() => setConfirmDel(true)}>Delete</Button>}
            <Button icon="check" onClick={save}>{isNew ? 'Create product' : 'Save'}</Button>
          </div>
        </div>
      </div>

      <div className="editor">
        <div className="editor__main">
          <Card title="Details" delay={0}>
            <div className="fgrid">
              <Field label="Name" error={errors.name} className="span-2">
                <input className="ainput" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ascend Hoodie" autoFocus={isNew} />
              </Field>
              <Field label="Description" className="span-2" hint="Shown on the product view.">
                <textarea className="ainput" rows={4} value={form.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="What makes it stand tall?" />
              </Field>
            </div>
          </Card>

          <Card title="Look" sub="The storefront draws the garment from these choices." delay={0.05}>
            <span className="fld__label">Garment</span>
            <div className="typepick">
              {GARMENT_TYPES.map((t) => (
                <button key={t} type="button" className={form.type === t ? 'is-on' : ''} onClick={() => setType(t)} aria-pressed={form.type === t}>
                  {form.type === t && <motion.span layoutId="typepick" className="typepick__pill" transition={{ type: 'spring', stiffness: 450, damping: 34 }} />}
                  <Garment product={{ type: t, cw: form.cw }} />
                  <span>{TYPE_NAME[t]}</span>
                </button>
              ))}
            </div>
            <span className="fld__label">Colourway</span>
            <div className="cwpick">
              {Object.entries(COLORWAYS).map(([k, c]) => (
                <button key={k} type="button" className={form.cw === k ? 'is-on' : ''} onClick={() => set({ cw: k })} aria-pressed={form.cw === k}>
                  <i style={{ background: c.fill, boxShadow: `inset 0 0 0 1px rgba(255,255,255,.15), 0 0 0 4px ${c.bg}` }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Pricing" delay={0.1}>
            <div className="fgrid">
              <Field label="Price (₦)" error={errors.price}>
                <input className="ainput" type="number" min="0" step="500" value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} />
              </Field>
              <Field label="Compare-at price (₦)" error={errors.compareAt} hint="Optional. Shows the price struck through, as a sale.">
                <input className="ainput" type="number" min="0" step="500" value={form.compareAt || ''} onChange={(e) => set({ compareAt: e.target.value ? Number(e.target.value) : null })} placeholder="—" />
              </Field>
              <Field label="Badge" className="span-2">
                <Segmented id="tag" size="sm" value={form.tag} onChange={(tag) => set({ tag })} options={TAGS.map((t) => ({ value: t, label: t || 'None' }))} />
              </Field>
            </div>
          </Card>

          <Card
            title="Inventory"
            sub={`${totalStock(form)} units across ${sizes.length} size${sizes.length === 1 ? '' : 's'}`}
            delay={0.15}
            actions={
              <div className="inv-quick">
                <Button variant="ghost" size="sm" onClick={() => set({ stock: Object.fromEntries(sizes.map((s) => [s, 0])) })}>Zero</Button>
                <Button variant="ghost" size="sm" onClick={() => set({ stock: Object.fromEntries(sizes.map((s) => [s, (form.stock?.[s] ?? 0) + 10])) })}>+10 all</Button>
              </div>
            }
          >
            <div className="stockgrid">
              {sizes.map((s, i) => {
                const n = form.stock?.[s] ?? 0;
                return (
                  <motion.div key={`${form.type}-${s}`} className={`stockcell ${n === 0 ? 'is-out' : n <= settings.lowStockThreshold ? 'is-low' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <span className="mono">{s}</span>
                    <input type="number" min="0" value={n} onChange={(e) => setStock(s, e.target.value)} aria-label={`Stock for size ${s}`} />
                    <div>
                      <button type="button" onClick={() => setStock(s, n - 1)} aria-label={`One fewer ${s}`}>−</button>
                      <button type="button" onClick={() => setStock(s, n + 1)} aria-label={`One more ${s}`}>+</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="editor__side">
          <Card delay={0.05}>
            <Preview form={form} />
          </Card>
          <Card title="Visibility" delay={0.1}>
            <div className="setrow">
              <div><b>Live on storefront</b><span>Drafts stay hidden from shoppers.</span></div>
              <Toggle checked={form.status === 'active'} onChange={(on) => set({ status: on ? 'active' : 'draft' })} label="Live on storefront" />
            </div>
            <div className="setrow">
              <div><b>Feature in The Drop</b><span>Adds it to the horizontal gallery on the homepage.</span></div>
              <Toggle checked={!!form.featured} onChange={(featured) => set({ featured })} label="Feature in The Drop" />
            </div>
          </Card>
          {!isNew && (
            <Card delay={0.15}>
              <p className="muted small"><Icon name="clock" size={14} /> Created {new Date(form.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </Card>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} onDiscard={() => { setForm(base); setErrors({}); }} />

      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        danger
        title="Delete product?"
        confirmLabel="Delete"
        body={`${form.name} will be removed from the store. Past orders keep their record.`}
        onConfirm={() => { deleteProduct(form.id); showToast(`${form.name} deleted`); navigate('/admin/products'); }}
      />
    </div>
  );
}
