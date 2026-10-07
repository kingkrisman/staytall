import { useId } from 'react';
import { COLORWAYS } from '../data/products';

const STAR_D = 'M50 0C52 10 56 14 66 16 56 18 52 22 50 32 48 22 44 18 34 16 44 14 48 10 50 0Z';
const HEAD_D = 'M16 70 50 40 84 70 75 78 50 56 25 78Z';
const STEM_L = 'M41 62 48 56 48 138 34 126 34 69Z';
const STEM_R = 'M59 62 52 56 52 138 66 126 66 69Z';

/** The Stay Tall mark: four-point star over a twin-pillar arrow. */
export function Mark({ className = '', ...rest }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 100 140" fill="currentColor" aria-hidden="true" {...rest}>
      <path className="m-star" d={STAR_D} />
      <path className="m-head" d={HEAD_D} />
      <path className="m-stem m-stem--l" d={STEM_L} />
      <path className="m-stem m-stem--r" d={STEM_R} />
    </svg>
  );
}

export function Star({ className = '', ...rest }) {
  return (
    <svg className={`star ${className}`} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M16 0C17 10 22 15 32 16 22 17 17 22 16 32 15 22 10 17 0 16 10 15 15 10 16 0Z" />
    </svg>
  );
}

/** The mark drawn inside a garment SVG at (x, y) with width w. */
function MarkAt({ x, y, w, color }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${w / 100})`} fill={color}>
      <path d={STAR_D} />
      <path d={HEAD_D} />
      <path d={STEM_L} />
      <path d={STEM_R} />
    </g>
  );
}

const SHAPES = {
  tee: (c) => ({
    body: 'M30 12 L42 7 Q50 15 58 7 L70 12 L93 30 L81 45 L72 38 L72 112 L28 112 L28 38 L19 45 L7 30 Z',
    extra: <path d="M42 7 Q50 16 58 7" fill="none" stroke={c.shade} strokeWidth="2.2" />,
    mark: <MarkAt x={43} y={36} w={14} color={c.print} />,
  }),
  hoodie: (c) => ({
    body: 'M36 14 Q50 2 64 14 L76 18 L95 44 L95 106 L83 106 L80 54 L76 50 L76 114 L24 114 L24 50 L20 54 L17 106 L5 106 L5 44 L24 18 Z',
    extra: (
      <>
        <path d="M38 16 Q50 36 62 16 Q50 24 38 16Z" fill={c.shade} />
        <path d="M45 26 L44 44 M55 26 L56 44" stroke={c.print} strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
        <path d="M33 84 L67 84 L71 102 L29 102 Z" fill="none" stroke={c.shade} strokeWidth="1.2" opacity=".8" />
        <rect x="24" y="108" width="52" height="6" fill={c.shade} opacity=".35" />
      </>
    ),
    mark: <MarkAt x={43} y={48} w={14} color={c.print} />,
  }),
  jacket: (c) => ({
    body: 'M34 10 L44 8 L50 18 L56 8 L66 10 L78 16 L95 42 L95 106 L83 106 L80 52 L77 48 L77 114 L23 114 L23 48 L20 52 L17 106 L5 106 L5 42 L22 16 Z',
    extra: (
      <>
        <path d="M44 8 L50 24 L56 8" fill={c.shade} />
        <path d="M50 22 L50 114" stroke={c.print} strokeWidth="1" strokeDasharray="2 1.5" opacity=".7" />
        <rect x="23" y="106" width="54" height="8" fill={c.shade} opacity=".5" />
        <rect x="5" y="100" width="12" height="6" fill={c.shade} opacity=".5" />
        <rect x="83" y="100" width="12" height="6" fill={c.shade} opacity=".5" />
        <path d="M58 70 L70 70" stroke={c.shade} strokeWidth="1.5" />
      </>
    ),
    mark: <MarkAt x={29} y={32} w={11} color={c.print} />,
  }),
  pants: (c) => ({
    body: 'M28 6 L72 6 L80 114 L58 114 L50 42 L42 114 L20 114 Z',
    extra: (
      <>
        <rect x="28" y="6" width="44" height="7" fill={c.shade} opacity=".6" />
        <path d="M24 56 L36 56 L36 74 L24 74 Z M64 56 L76 56 L76 74 L64 74 Z" fill="none" stroke={c.shade} strokeWidth="1.2" />
        <path d="M31 20 L27 108 M69 20 L73 108" stroke={c.print} strokeWidth=".8" opacity=".35" />
      </>
    ),
    mark: <MarkAt x={62} y={18} w={7} color={c.print} />,
  }),
  cap: (c) => ({
    body: 'M18 74 Q18 32 54 30 Q88 32 88 74 Z',
    extra: (
      <>
        <path d="M54 30 Q46 50 46 74 M54 30 Q66 50 70 74" fill="none" stroke={c.shade} strokeWidth=".9" opacity=".7" />
        <path d="M14 72 Q58 62 100 82 Q92 92 60 87 Q34 82 14 78 Z" fill={c.shade} />
        <circle cx="54" cy="31" r="2.6" fill={c.shade} />
      </>
    ),
    mark: <MarkAt x={36} y={40} w={13} color={c.print} />,
  }),
  beanie: (c) => ({
    body: 'M24 84 Q22 30 50 24 Q78 30 76 84 Z',
    extra: (
      <>
        {[30, 38, 46, 54, 62, 70].map((x) => (
          <path key={x} d={`M${x} 36 Q${x} 60 ${x} 76`} stroke={c.shade} strokeWidth=".8" opacity=".5" />
        ))}
        <rect x="19" y="72" width="62" height="26" rx="3" fill={c.fill} />
        <rect x="19" y="72" width="62" height="26" rx="3" fill={c.shade} opacity=".35" />
        {[24, 30, 36, 64, 70, 76].map((x) => (
          <path key={x} d={`M${x} 74 L${x} 96`} stroke={c.shade} strokeWidth="1" />
        ))}
        <rect x="42" y="76" width="16" height="18" fill={c.shade} />
      </>
    ),
    mark: <MarkAt x={45} y={77} w={10} color={c.print} />,
  }),
};

/** Procedurally drawn garment in the product's colourway. */
export function Garment({ product, className = '' }) {
  const gid = 'g' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const c = COLORWAYS[product.cw];
  const s = SHAPES[product.type](c);
  return (
    <svg className={`garment ${className}`} viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <path d={s.body} fill={c.fill} />
      {s.extra}
      {s.mark}
      <path d={s.body} fill={`url(#${gid})`} pointerEvents="none" />
    </svg>
  );
}

/** Splits text into masked characters for GSAP to animate (`.ch > .ch__in`). */
export function SplitChars({ text, className = '' }) {
  return (
    <span className={`split ${className}`} aria-label={text}>
      {[...text].map((ch, i) =>
        ch === ' ' ? (
          <span key={i} className="ch ch--space" aria-hidden="true">&nbsp;</span>
        ) : (
          <span key={i} className="ch" aria-hidden="true"><span className="ch__in">{ch}</span></span>
        )
      )}
    </span>
  );
}
