import { useEffect, useRef } from 'react';
import { getLenis } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/gsap';

/**
 * Warp-speed starfield. Scroll velocity punches the stars into light-speed streaks;
 * the vanishing point follows the pointer.
 */
export default function Starfield({ className = '', density = 1 }) {
  const canvas = useRef(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext('2d');
    const reduce = prefersReducedMotion();
    let w, h, dpr, raf, visible = true;
    let stars = [];
    let speed = 0.6;
    const center = { x: 0, y: 0, tx: 0, ty: 0 };

    const spawn = (s, far = false) => {
      s.x = (Math.random() - 0.5) * w * 2;
      s.y = (Math.random() - 0.5) * h * 2;
      s.z = far ? w : Math.random() * w;
      s.pz = s.z;
      s.r = Math.random() * 1.2 + 0.3;
      s.tw = Math.random() * Math.PI * 2;
      return s;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(900, (w * h) / 1800) * density);
      stars = Array.from({ length: n }, () => spawn({}));
      center.x = center.tx = w / 2; center.y = center.ty = h / 2;
    };

    const onMove = (e) => {
      const r = cv.getBoundingClientRect();
      center.tx = w / 2 + (e.clientX - r.left - w / 2) * 0.35;
      center.ty = h / 2 + (e.clientY - r.top - h / 2) * 0.35;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const v = Math.abs(getLenis()?.velocity || 0);
      const target = reduce ? 0.15 : 0.6 + Math.min(v * 1.4, 38);
      speed += (target - speed) * 0.08;
      center.x += (center.tx - center.x) * 0.05;
      center.y += (center.ty - center.y) * 0.05;

      ctx.fillStyle = speed > 6 ? 'rgba(5,5,5,0.35)' : 'rgba(5,5,5,1)';
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z < 1) { spawn(s, true); continue; }
        const k = 220 / s.z;
        const x = center.x + s.x * k * 0.5;
        const y = center.y + s.y * k * 0.5;
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { spawn(s, true); continue; }
        const pk = 220 / s.pz;
        const px = center.x + s.x * pk * 0.5;
        const py = center.y + s.y * pk * 0.5;
        const depth = 1 - s.z / w;
        s.tw += 0.05;
        const alpha = Math.min(1, depth * 1.4) * (0.65 + Math.sin(s.tw) * 0.35);
        const size = s.r * (0.4 + depth * 2.2);

        if (speed > 2.5) {
          ctx.strokeStyle = `rgba(244,242,236,${alpha})`;
          ctx.lineWidth = size;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(244,242,236,${alpha})`;
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    resize();
    frame();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [density]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
