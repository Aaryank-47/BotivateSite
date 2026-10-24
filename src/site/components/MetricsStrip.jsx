import { useEffect, useRef, useState, startTransition } from 'react';
import './MetricsStrip.css';

function Counter({ target, suffix = '', prefix = '', duration = 2000 }) {
  const spanRef   = useRef(null);
  const [started, setStarted] = useState(false);

  // One-shot IntersectionObserver — fires once, then disconnects
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { obs.disconnect(); startTransition(() => setStarted(true)); } },
      { threshold: 0.5 }
    );
    if (spanRef.current) obs.observe(spanRef.current);
    return () => obs.disconnect();
  }, []);

  // Direct DOM mutation — no setState → no React reconciliation each frame
  useEffect(() => {
    if (!started || !spanRef.current) return;
    const el = spanRef.current;
    let frame = 0;
    let rafId;
    const totalFrames = Math.round(duration / 16);
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = () => {
      frame++;
      const val = Math.round(easeOut(frame / totalFrames) * target);
      el.textContent = `${prefix}${val.toLocaleString('en-IN')}${suffix}`;
      if (frame < totalFrames) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = `${prefix}${target.toLocaleString('en-IN')}${suffix}`;
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, target, duration, prefix, suffix]);

  return <span ref={spanRef}>{prefix}0{suffix}</span>;
}

const metrics = [
  { value: 60, suffix: '%', label: 'Time Saved on Operations', desc: 'Manual tasks fully automated' },
  { value: 3, suffix: 'x', label: 'Faster Sales Conversion', desc: 'AI-driven follow-ups that close' },
  { value: 100, suffix: '%', label: 'Business Visibility', desc: 'Live dashboards, always' },
  { value: 150, suffix: '+', label: 'Businesses Automated', desc: 'Across Central India' },
];

export default function MetricsStrip() {
  return (
    <section className="metrics-strip" id="metrics">
      <div className="metrics-inner container">
        <div className="metrics-label label white">Proven Results</div>
        {metrics.map((m, i) => (
          <div key={i} className="metric-item">
            <div className="metric-number">
              <Counter target={m.value} suffix={m.suffix} />
            </div>
            <div className="metric-text">
              <span className="metric-label">{m.label}</span>
              <span className="metric-desc">{m.desc}</span>
            </div>
            {i < metrics.length - 1 && <div className="metric-divider" />}
          </div>
        ))}
      </div>
    </section>
  );
}
