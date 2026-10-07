import { Fragment, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { animate, AnimatePresence, motion } from 'framer-motion';
import { STATUS_LABEL } from '../../lib/db';
import { COLORWAYS } from '../../data/products';
import { Garment } from '../Brand';

export const EASE = [0.16, 1, 0.3, 1];

const ICONS = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  shirt: 'M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4',
  users: 'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1.5a4 4 0 0 0-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  layout: 'M3 4h18v16H3zM3 9h18M9 9v11',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M14 4v4M8 10v4M16 16v4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  chevron: 'M9 6l6 6-6 6',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  download: 'M12 4v12M6 10l6 6 6-6M4 20h16',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  store: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  star: 'M12 2c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
};

export function Icon({ name, size = 18, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Button({ variant = 'primary', size, icon, iconRight, loading, children, className = '', as: As = 'button', ...rest }) {
  return (
    <As className={`ab ab--${variant} ${size ? `ab--${size}` : ''} ${loading ? 'is-loading' : ''} ${className}`} {...(As === 'button' ? { type: 'button' } : {})} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children != null && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </As>
  );
}

export function Toggle({ checked, onChange, label, disabled, size }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? label : undefined}
      disabled={disabled}
      className={`tgl ${checked ? 'is-on' : ''} ${size === 'sm' ? 'tgl--sm' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    >
      <motion.span className="tgl__knob" layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
    </button>
  );
}

export function Segmented({ value, onChange, options, id, size }) {
  return (
    <div className={`seg ${size === 'sm' ? 'seg--sm' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="seg__pill" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
          <span className="seg__txt">
            {o.label}
            {o.count != null && <em>{o.count}</em>}
          </span>
        </button>
      ))}
    </div>
  );
}

const STATUS_ICON = { paid: 'receipt', processing: 'box', shipped: 'truck', delivered: 'check', cancelled: 'ban', refunded: 'undo' };

export function StatusPill({ status }) {
  return (
    <span className={`spill spill--${status}`}>
      <Icon name={STATUS_ICON[status]} size={13} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Thumb({ product, size = 44 }) {
  if (!product) return <span className="thumb" style={{ width: size, height: size }} />;
  return (
    <span className="thumb" style={{ '--bg': COLORWAYS[product.cw]?.bg, width: size, height: size }}>
      <Garment product={product} />
    </span>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`fld ${error ? 'is-error' : ''} ${className}`}>
      <span className="fld__label">{label}</span>
      {children}
      {(error || hint) && <span className={error ? 'fld__err' : 'fld__hint'}>{error || hint}</span>}
    </label>
  );
}

export function Card({ title, sub, actions, children, className = '', delay = 0 }) {
  return (
    <motion.section
      className={`acard ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {(title || actions) && (
        <header className="acard__head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="acard__actions">{actions}</div>}
        </header>
      )}
      {children}
    </motion.section>
  );
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="phead">
      <div>
        <h1 className="phead__title" aria-label={title}>
          {/* Letters animate individually but wrap only between words. */}
          {title.split(' ').map((word, wi, words) => {
            const offset = words.slice(0, wi).join(' ').length + (wi ? 1 : 0);
            return (
              <Fragment key={wi}>
                <span className="phead__word" aria-hidden="true">
                  {word.split('').map((c, i) => (
                    <span className="ch" key={i}>
                      <motion.span className="ch__in" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: (offset + i) * 0.025, duration: 0.8, ease: EASE }}>
                        {c}
                      </motion.span>
                    </span>
                  ))}
                </span>
                {wi < words.length - 1 && ' '}
              </Fragment>
            );
          })}
        </h1>
        {sub && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>{sub}</motion.p>}
      </div>
      {actions && <motion.div className="phead__actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: EASE }}>{actions}</motion.div>}
    </div>
  );
}

/** Counts from its previous value to the new one. */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-NG') }) {
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => ref.current && (ref.current.textContent = format(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, format]);
  return <span ref={ref}>{format(0)}</span>;
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="amodal" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="amodal__scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="amodal__box"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 40, scale: 0.94, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <header className="amodal__head">
              <h3>{title}</h3>
              <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
            </header>
            <div className="amodal__body">{children}</div>
            {footer && <footer className="amodal__foot">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Drawer({ open, onClose, children, label }) {
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="adrawer" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div className="adrawer__scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="adrawer__panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <button className="iconbtn adrawer__close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="amodal__text">{body}</p>
    </Modal>
  );
}

export function Empty({ icon = 'sparkle', title, children }) {
  return (
    <motion.div className="aempty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}>
      <span className="aempty__icon"><Icon name={icon} size={22} /></span>
      <b>{title}</b>
      {children && <p>{children}</p>}
    </motion.div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="asearch">
      <Icon name="search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear search"><Icon name="x" size={14} /></button>}
    </label>
  );
}

/** Sticky "unsaved changes" bar that slides up when a form is dirty. */
export function SaveBar({ dirty, onSave, onDiscard, saving, label = 'Unsaved changes' }) {
  return createPortal(
    <AnimatePresence>
      {dirty && (
        <motion.div className="savebar" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
          <span className="savebar__dot" />
          <span>{label}</span>
          <div>
            <Button variant="ghost" size="sm" onClick={onDiscard}>Discard</Button>
            <Button size="sm" icon="check" onClick={onSave} loading={saving}>Save</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
