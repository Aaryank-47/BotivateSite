import { useEffect, useRef, startTransition } from 'react';
import './Hero.css';
import AutoRocketDemo from './AutoRocketDemo';

const BADGE_TEXT = "Central India's No.1 Business Automation Company";

export default function HeroPipeline() {
  const sectionRef = useRef(null);
  const badgeTypedRef = useRef(null);

  // ── Typewriter badge ──
  useEffect(() => {
    const el = badgeTypedRef.current;
    if (!el) return;
    let rafId, startTime = null;
    const type = (ts) => {
      if (!startTime) startTime = ts;
      const i = Math.min(Math.floor((ts - startTime) / 38), BADGE_TEXT.length);
      el.textContent = BADGE_TEXT.slice(0, i);
      if (i < BADGE_TEXT.length) rafId = requestAnimationFrame(type);
      else el.parentElement?.classList.add('hero-badge--done');
    };
    const t = setTimeout(() => { rafId = requestAnimationFrame(type); }, 500);
    return () => { clearTimeout(t); cancelAnimationFrame(rafId); };
  }, []);

  // ── Pause when off-screen (hero-modules ticker etc.) ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => { startTransition(() => section.classList.toggle('hero--paused', !e.isIntersecting)); },
      { threshold: 0.1 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-inner container">

        {/* ── Left ── */}
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-star">*</span>
            <span ref={badgeTypedRef} />
            <span className="hero-badge-cursor" aria-hidden="true" />
          </div>

          <h1 className="hero-headline">
            Transform Your <span className="hero-headline-grad">Business Operations</span>
          </h1>

          <div className="hero-modules">
            <div className="hero-modules-track">
              {['Sales', 'Purchase', 'Inventory', 'Production', 'Tasks', 'HR', 'MIS', 'Reporting', 'WhatsApp', 'AI Agents', 'Maintenance', 'Approvals', 'PC', 'EA',
                'Sales', 'Purchase', 'Inventory', 'Production', 'Tasks', 'HR', 'MIS', 'Reporting', 'WhatsApp', 'AI Agents', 'Maintenance', 'Approvals', 'PC', 'EA'].map((label, i) => (
                <span key={`${label}-${i}`} className="hero-module-chip">{label}</span>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary btn-lg">Book A Free Business Automation Demo</a>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item"><strong>150+</strong><span>Clients Automated</span></div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item"><strong>98%</strong><span>Retention Rate</span></div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item"><strong>3+ yrs</strong><span>Business Automation</span></div>
          </div>
        </div>

        {/* ── Right: Live Process Pipeline demo ── */}
        <div className="hero-right">
          <AutoRocketDemo />
        </div>

      </div>
    </section>
  );
}
