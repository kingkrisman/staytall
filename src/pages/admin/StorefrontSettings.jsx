import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useDb } from '../../context/DbContext';
import { useStore } from '../../context/StoreContext';
import { COLORWAYS, fmt } from '../../data/products';
import { TLink } from '../../context/TransitionContext';
import { Button, Card, Field, Icon, PageHeader, SaveBar, Thumb, Toggle } from '../../components/admin/ui';

const KEYS = ['announcement', 'heroTagline', 'heroCta', 'marqueeTop', 'marqueeBottom', 'manifesto', 'dropTitle', 'dropYear', 'dropIds'];
const pickDraft = (s) => JSON.parse(JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, s[k]]))));

function Chips({ value, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim().toUpperCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="chips">
      <AnimatePresence initial={false}>
        {value.map((v) => (
          <motion.span key={v} className="chip" layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`}><Icon name="x" size={12} /></button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export default function StorefrontSettings() {
  const { settings, updateSettings, db, productById } = useDb();
  const { showToast } = useStore();
  const [draft, setDraft] = useState(() => pickDraft(settings));
  const [base, setBase] = useState(() => pickDraft(settings));
  const [adding, setAdding] = useState('');

  // If the settings change elsewhere (another tab), follow along unless mid-edit.
  const live = useMemo(() => pickDraft(settings), [settings]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  useEffect(() => {
    if (!dirty) { setDraft(live); setBase(live); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const save = () => {
    updateSettings(draft);
    setBase(draft);
    showToast('Storefront updated — it\'s live');
  };

  const candidates = db.products.filter((p) => p.status === 'active' && !draft.dropIds.includes(p.id));

  return (
    <div className="page">
      <PageHeader
        title="Storefront"
        sub="Edit the words and the drop your shoppers see. Changes go live when you save."
        actions={<Button as={TLink} to="/" variant="ghost" iconRight="external">Open storefront</Button>}
      />

      <div className="editor">
        <div className="editor__main">
          <Card title="Announcement bar" sub="The scrolling strip at the very top of the store." delay={0}>
            <div className="setrow">
              <div><b>Show announcement</b><span>Turn it off for a cleaner header.</span></div>
              <Toggle checked={draft.announcement.enabled} onChange={(enabled) => set({ announcement: { ...draft.announcement, enabled } })} label="Show announcement" />
            </div>
            <Field label="Message">
              <input className="ainput" value={draft.announcement.text} onChange={(e) => set({ announcement: { ...draft.announcement, text: e.target.value } })} maxLength={140} />
            </Field>
            <div className={`annprev ${draft.announcement.enabled ? '' : 'is-off'}`} aria-hidden="true">
              <div className="annprev__track">{Array.from({ length: 3 }, (_, i) => <span key={i}>{draft.announcement.text}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>)}</div>
            </div>
          </Card>

          <Card title="Hero" sub="The first thing anyone sees." delay={0.05}>
            <div className="fgrid">
              <Field label="Tagline" className="span-2">
                <input className="ainput" value={draft.heroTagline} onChange={(e) => set({ heroTagline: e.target.value })} maxLength={90} />
              </Field>
              <Field label="Button label">
                <input className="ainput" value={draft.heroCta} onChange={(e) => set({ heroCta: e.target.value })} maxLength={24} />
              </Field>
            </div>
          </Card>

          <Card title="Scrolling bands" sub="Press Enter to add a phrase. They're set in capitals." delay={0.1}>
            <Field label="Outlined band"><Chips value={draft.marqueeTop} onChange={(marqueeTop) => set({ marqueeTop })} placeholder="Add phrase…" /></Field>
            <Field label="Solid band"><Chips value={draft.marqueeBottom} onChange={(marqueeBottom) => set({ marqueeBottom })} placeholder="Add phrase…" /></Field>
          </Card>

          <Card title="Manifesto" sub="Wrap a word in *asterisks* to set it in bold italics." delay={0.15}>
            <textarea className="ainput" rows={5} value={draft.manifesto} onChange={(e) => set({ manifesto: e.target.value })} />
            <p className="manprev">
              {draft.manifesto.split(/\s+/).filter(Boolean).map((w, i) => (
                <span key={i} className={w.startsWith('*') ? 'is-em' : ''}>{w.replace(/\*/g, '')} </span>
              ))}
            </p>
          </Card>
        </div>

        <div className="editor__side">
          <Card title="The Drop" sub="Drag to reorder the horizontal gallery." delay={0.05}>
            <div className="fgrid">
              <Field label="Title"><input className="ainput" value={draft.dropTitle} onChange={(e) => set({ dropTitle: e.target.value.toUpperCase() })} maxLength={12} /></Field>
              <Field label="Season"><input className="ainput" value={draft.dropYear} onChange={(e) => set({ dropYear: e.target.value })} maxLength={4} /></Field>
            </div>

            <Reorder.Group axis="y" values={draft.dropIds.filter((x) => productById(x))} onReorder={(dropIds) => set({ dropIds })} className="droplist">
              {draft.dropIds.filter((x) => productById(x)).map((pid, i) => {
                const p = productById(pid);
                return (
                  <Reorder.Item key={pid} value={pid} className={`droplist__item ${p.status !== 'active' ? 'is-draft' : ''}`} whileDrag={{ scale: 1.03, boxShadow: '0 20px 40px rgba(0,0,0,.5)' }}>
                    <Icon name="grip" size={18} className="droplist__grip" />
                    <span className="droplist__n mono">{String(i + 1).padStart(2, '0')}</span>
                    <Thumb product={p} size={40} />
                    <div className="droplist__name">
                      <b>{p.name}</b>
                      <span>{COLORWAYS[p.cw].name} · {fmt(p.price)}{p.status !== 'active' ? ' · draft (hidden)' : ''}</span>
                    </div>
                    <button className="iconbtn" onClick={() => set({ dropIds: draft.dropIds.filter((x) => x !== pid) })} aria-label={`Remove ${p.name} from the drop`}><Icon name="x" size={15} /></button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
            {draft.dropIds.length === 0 && <p className="muted small">The drop is empty — add pieces below.</p>}

            <div className="inputrow">
              <select className="aselect" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Product to add">
                <option value="">Add a product…</option>
                {candidates.map((p) => <option key={p.id} value={p.id}>{p.name} — {COLORWAYS[p.cw].name}</option>)}
              </select>
              <Button variant="ghost" icon="plus" disabled={!adding} onClick={() => { set({ dropIds: [...draft.dropIds, adding] }); setAdding(''); }}>Add</Button>
            </div>
          </Card>
        </div>
      </div>

      <SaveBar dirty={dirty} onSave={save} onDiscard={() => setDraft(base)} label="Unpublished storefront changes" />
    </div>
  );
}
