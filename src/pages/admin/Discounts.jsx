import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { fmt } from '../../data/products';
import { Button, Confirm, EASE, Empty, Field, Icon, Modal, PageHeader, Segmented, Toggle } from '../../components/admin/ui';

const blank = { code: '', type: 'percent', value: 10, minSubtotal: 0, active: true };
const WORDS = ['TALL', 'RISE', 'ORBIT', 'ASCEND', 'STAR', 'HALO', 'PILLAR'];
const genCode = () => `${WORDS[Math.floor(Math.random() * WORDS.length)]}${Math.floor(10 + Math.random() * 90)}`;

function Editor({ open, initial, onClose }) {
  const { db, saveDiscount } = useDb();
  const { showToast } = useStore();
  const [d, setD] = useState(initial);
  const [err, setErr] = useState({});
  const editing = !!initial.code && db.discounts.some((x) => x.code === initial.code);

  const save = () => {
    const code = d.code.trim().toUpperCase();
    const e = {};
    if (!/^[A-Z0-9]{3,16}$/.test(code)) e.code = '3–16 letters or numbers';
    else if (code !== initial.code && db.discounts.some((x) => x.code === code)) e.code = 'That code already exists';
    if (!(d.value > 0)) e.value = 'Must be more than zero';
    else if (d.type === 'percent' && d.value > 90) e.value = 'Keep it at 90% or less';
    setErr(e);
    if (Object.keys(e).length) return;
    saveDiscount({ ...d, code, value: Number(d.value), minSubtotal: Number(d.minSubtotal) || 0 }, editing ? initial.code : undefined);
    showToast(editing ? `${code} updated` : `${code} created — share it anywhere`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial.code}` : 'New discount code'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon="check" onClick={save}>{editing ? 'Save code' : 'Create code'}</Button></>}
    >
      <div className="fgrid">
        <Field label="Code" error={err.code} className="span-2">
          <div className="inputrow">
            <input className="ainput ainput--code" value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="TALL10" autoFocus />
            <Button variant="ghost" icon="sparkle" onClick={() => setD({ ...d, code: genCode() })}>Generate</Button>
          </div>
        </Field>
        <Field label="Type" className="span-2">
          <Segmented id="dtype" value={d.type} onChange={(type) => setD({ ...d, type })} options={[{ value: 'percent', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount (₦)' }]} />
        </Field>
        <Field label={d.type === 'percent' ? 'Percent off' : 'Amount off (₦)'} error={err.value}>
          <input className="ainput" type="number" min="1" value={d.value} onChange={(e) => setD({ ...d, value: Number(e.target.value) })} />
        </Field>
        <Field label="Minimum spend (₦)" hint="0 for no minimum">
          <input className="ainput" type="number" min="0" step="1000" value={d.minSubtotal} onChange={(e) => setD({ ...d, minSubtotal: Number(e.target.value) })} />
        </Field>
        <div className="setrow span-2">
          <div><b>Active</b><span>Shoppers can use it at checkout right away.</span></div>
          <Toggle checked={d.active} onChange={(active) => setD({ ...d, active })} label="Active" />
        </div>
      </div>
    </Modal>
  );
}

export default function Discounts() {
  const { db, saveDiscount, deleteDiscount } = useDb();
  const { showToast } = useStore();
  const [editing, setEditingRaw] = useState(null);
  const [editKey, setEditKey] = useState(0);
  const [doomed, setDoomed] = useState(null);
  // A fresh key per open resets the form; staying mounted lets the modal animate out.
  const setEditing = (d) => {
    if (d) setEditKey((k) => k + 1);
    setEditingRaw(d);
  };
  const active = db.discounts.filter((d) => d.active).length;

  const copy = (code) => {
    navigator.clipboard?.writeText(code).then(() => showToast(`${code} copied`), () => showToast(code));
  };

  return (
    <div className="page">
      <PageHeader
        title="Discounts"
        sub={`${active} active code${active === 1 ? '' : 's'} · shoppers apply them in the bag`}
        actions={<Button icon="plus" onClick={() => setEditing({ ...blank, code: genCode() })}>New code</Button>}
      />

      {db.discounts.length === 0 ? (
        <Empty icon="tag" title="No discount codes yet">Create one to reward the club.</Empty>
      ) : (
        <div className="tickets">
          <AnimatePresence>
            {db.discounts.map((d, i) => (
              <motion.article
                key={d.code}
                layout
                className={`ticket ${d.active ? '' : 'is-off'}`}
                initial={{ opacity: 0, y: 30, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.6, ease: EASE }}
              >
                <div className="ticket__main">
                  <button className="ticket__code" onClick={() => copy(d.code)} title="Copy code">
                    {d.code} <Icon name="copy" size={15} />
                  </button>
                  <b className="ticket__value">{d.type === 'percent' ? `${d.value}% off` : `${fmt(d.value)} off`}</b>
                  <span className="muted small">{d.minSubtotal ? `On orders over ${fmt(d.minSubtotal)}` : 'No minimum spend'}</span>
                </div>
                <div className="ticket__side">
                  <span className="ticket__uses"><b>{d.uses}</b> use{d.uses === 1 ? '' : 's'}</span>
                  <Toggle size="sm" checked={d.active} label={`${d.code} active`} onChange={(on) => { saveDiscount({ ...d, active: on }, d.code); showToast(on ? `${d.code} is live` : `${d.code} paused`); }} />
                  <div className="ticket__acts">
                    <button className="iconbtn" onClick={() => setEditing(d)} aria-label={`Edit ${d.code}`}><Icon name="edit" size={16} /></button>
                    <button className="iconbtn iconbtn--danger" onClick={() => setDoomed(d)} aria-label={`Delete ${d.code}`}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {editKey > 0 && <Editor key={editKey} open={!!editing} initial={editing || blank} onClose={() => setEditing(null)} />}

      <Confirm
        open={!!doomed}
        onClose={() => setDoomed(null)}
        danger
        title={`Delete ${doomed?.code}?`}
        confirmLabel="Delete code"
        body="Anyone holding this code won't be able to use it. Past orders keep their discount."
        onConfirm={() => { deleteDiscount(doomed.code); showToast(`${doomed.code} deleted`); }}
      />
    </div>
  );
}
