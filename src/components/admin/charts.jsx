import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fmt, fmtCompact } from '../../data/products';
import { Segmented } from './ui';

function niceScale(max, count = 4) {
  const raw = Math.max(max, 1) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
}

/** Column with a 4px rounded data-end and a square foot on the baseline. */
function barPath(x, yTop, w, base) {
  const h = base - yTop;
  if (h <= 0.5) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${base}V${yTop + r}Q${x},${yTop} ${x + r},${yTop}H${x + w - r}Q${x + w},${yTop} ${x + w},${yTop + r}V${base}Z`;
}

/**
 * Daily revenue — one series, so no legend box (the card title names it).
 * Hover or arrow-key through days; the table view carries every value without hovering.
 */
export function RevenueChart({ data, animKey }) {
  const wrap = useRef(null);
  const [w, setW] = useState(720);
  const [active, setActive] = useState(null);
  const [view, setView] = useState('chart');

  useLayoutEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [view]);

  const H = 280;
  const M = { t: 30, r: 8, b: 30, l: 52 };
  const pw = Math.max(10, w - M.l - M.r);
  const ph = H - M.t - M.b;
  const { top, ticks } = niceScale(Math.max(...data.map((d) => d.revenue), 0));
  const band = pw / data.length;
  const bw = Math.max(2, Math.min(24, band - 2));
  const base = M.t + ph;
  const y = (v) => base - (v / top) * ph;
  const peak = data.reduce((best, d, i) => (d.revenue > data[best].revenue ? i : best), 0);
  const every = Math.max(1, Math.ceil(data.length / 6));
  const act = active != null ? data[active] : null;

  const onKey = (e) => {
    const last = data.length - 1;
    if (e.key === 'ArrowRight') setActive((a) => (a == null ? last : Math.min(last, a + 1)));
    else if (e.key === 'ArrowLeft') setActive((a) => (a == null ? last : Math.max(0, a - 1)));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(last);
    else return;
    e.preventDefault();
  };

  return (
    <div className="rc">
      <div className="rc__bar-top">
        <Segmented id="rc-view" size="sm" value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} />
      </div>

      {view === 'chart' ? (
        <div className={`rc__wrap ${act ? 'has-active' : ''}`} ref={wrap}>
          <svg
            width={w}
            height={H}
            tabIndex={0}
            role="group"
            aria-label={`Daily revenue for the last ${data.length} days. Use the arrow keys to read each day.`}
            onKeyDown={onKey}
            onFocus={() => setActive((a) => (a == null ? data.length - 1 : a))}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line className={t === 0 ? 'rc__base' : 'rc__grid'} x1={M.l} x2={M.l + pw} y1={y(t)} y2={y(t)} />
                <text className="rc__tick" x={M.l - 10} y={y(t)} dy="0.32em" textAnchor="end">{fmtCompact(t)}</text>
              </g>
            ))}

            <g key={animKey}>
              {data.map((d, i) => (
                <motion.path
                  key={i}
                  className={`rc__col ${active === i ? 'is-active' : ''}`}
                  d={barPath(M.l + i * band + (band - bw) / 2, y(d.revenue), bw, base)}
                  style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.7, delay: (i / data.length) * 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </g>

            {data[peak].revenue > 0 && !act && (
              <text className="rc__peak" x={M.l + peak * band + band / 2} y={y(data[peak].revenue) - 8} textAnchor="middle">
                {fmtCompact(data[peak].revenue)}
              </text>
            )}

            {data.map((d, i) =>
              i % every === 0 || i === data.length - 1 ? (
                <text key={i} className="rc__tick" x={M.l + i * band + band / 2} y={base + 20} textAnchor="middle">{d.short}</text>
              ) : null
            )}

            {/* Hit targets: the whole day column, wider than the painted bar. */}
            {data.map((d, i) => (
              <rect key={i} x={M.l + i * band} y={M.t} width={band} height={ph} fill="transparent" onPointerEnter={() => setActive(i)} />
            ))}
          </svg>

          {act && (
            <div
              className="rc__tip"
              style={{ left: Math.min(w - 90, Math.max(90, M.l + active * band + band / 2)), top: y(act.revenue) - 12 }}
              role="status"
            >
              <b>{fmt(act.revenue)}</b>
              <span>{act.label} · {act.orders} order{act.orders === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rc__table">
          <table className="vtable">
            <thead><tr><th>Day</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.t}><td>{d.label}</td><td>{d.orders}</td><td>{fmt(d.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 12+ point trend for a stat tile — de-emphasis line, the current day as the accent dot. */
export function Sparkline({ values, width = 120, height = 34 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 6) + 3, height - 4 - (v / max) * (height - 8)]);
  const d = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`).join('');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="spark" width={width} height={height} aria-hidden="true">
      <motion.path d={d} className="spark__line" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      <motion.circle cx={lx} cy={ly} r={4} className="spark__dot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 400, damping: 15 }} />
    </svg>
  );
}

/** Thin same-ramp meter: filled part carries the value, the track is the lighter step. */
export function Meter({ value, max, delay = 0 }) {
  return (
    <span className="meter2">
      <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: max ? Math.min(1, value / max) : 0 }} transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }} />
    </span>
  );
}
