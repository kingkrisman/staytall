import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { fmt } from '../../data/products';
import { fmtDate } from '../../lib/db';
import { Button, Card, Confirm, Field, Icon, PageHeader, SaveBar, Toggle } from '../../components/admin/ui';

const KEYS = ['storeOpen', 'closedMessage', 'nextDropAt', 'freeShippingThreshold', 'shippingFee', 'lowStockThreshold'];
const pick = (s) => Object.fromEntries(KEYS.map((k) => [k, s[k]]));

export default function Settings() {
  const { db, settings, updateSettings, resetDemo } = useDb();
  const { showToast } = useStore();
  const live = useMemo(() => pick(settings), [settings]);
  const [draft, setDraft] = useState(live);
  const [base, setBase] = useState(live);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);

  useEffect(() => {
    if (!dirty) { setDraft(live); setBase(live); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const save = () => {
    updateSettings({
      ...draft,
      freeShippingThreshold: Math.max(0, Number(draft.freeShippingThreshold) || 0),
      shippingFee: Math.max(0, Number(draft.shippingFee) || 0),
      lowStockThreshold: Math.max(0, Number(draft.lowStockThreshold) || 0),
    });
    setBase(draft);
    showToast('Settings saved');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `staytall-store-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Store data exported');
  };

  return (
    <div className="page">
      <PageHeader title="Settings" sub="Control the store itself — opening hours, shipping and inventory alerts." />

      <div className="settings">
        <Card title="Store status" delay={0}>
          <motion.div className={`statusbig ${draft.storeOpen ? 'is-open' : ''}`} layout>
            <span className="statusbig__dot" />
            <div>
              <b>{draft.storeOpen ? 'Open for business' : 'Closed to the public'}</b>
              <span>{draft.storeOpen ? 'Anyone can browse and buy.' : 'Visitors see a countdown page. You can still preview the store while signed in.'}</span>
            </div>
            <Toggle checked={draft.storeOpen} onChange={(storeOpen) => set({ storeOpen })} label="Store open" />
          </motion.div>
          <div className="fgrid">
            <Field label="Closed-page message" className="span-2">
              <input className="ainput" value={draft.closedMessage} onChange={(e) => set({ closedMessage: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Next drop (countdown target)" hint={draft.nextDropAt ? fmtDate(new Date(draft.nextDropAt).getTime(), true) : ''}>
              <input className="ainput" type="datetime-local" value={draft.nextDropAt} onChange={(e) => set({ nextDropAt: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Shipping" sub="Applied in the bag and at checkout." delay={0.05}>
          <div className="fgrid">
            <Field label="Free shipping over (₦)" hint={`Currently ${fmt(Number(draft.freeShippingThreshold) || 0)}`}>
              <input className="ainput" type="number" min="0" step="5000" value={draft.freeShippingThreshold} onChange={(e) => set({ freeShippingThreshold: e.target.value })} />
            </Field>
            <Field label="Flat shipping fee (₦)">
              <input className="ainput" type="number" min="0" step="500" value={draft.shippingFee} onChange={(e) => set({ shippingFee: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Inventory alerts" delay={0.1}>
          <Field label="Low-stock threshold" hint="A size at or under this count shows as low stock, and shoppers see “only N left”.">
            <input className="ainput" type="number" min="0" max="100" value={draft.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: e.target.value })} />
          </Field>
        </Card>

        <Card title="Demo data" sub="Everything lives in this browser's storage." delay={0.15}>
          <div className="setrow">
            <div><b>Export store data</b><span>Download products, orders, customers and settings as JSON.</span></div>
            <Button variant="ghost" icon="download" onClick={exportData}>Export</Button>
          </div>
          <div className="setrow">
            <div><b>Reset demo</b><span>Restore the original catalogue, orders and settings. Your demo sign-in keeps working.</span></div>
            <Button variant="danger" icon="refresh" onClick={() => setConfirmReset(true)}>Reset</Button>
          </div>
          <p className="muted small"><Icon name="shield" size={14} /> {db.products.length} products · {db.orders.length} orders · {db.users.length} accounts · seeded {fmtDate(db.seededAt)}</p>
        </Card>
      </div>

      <SaveBar dirty={dirty} onSave={save} onDiscard={() => setDraft(base)} />

      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        danger
        title="Reset all demo data?"
        confirmLabel="Reset everything"
        body="Products, orders, customers, discount codes and storefront text go back to how they started. Accounts created on sign-up are removed."
        onConfirm={() => { resetDemo(); showToast('Demo data reset'); }}
      />
    </div>
  );
}
