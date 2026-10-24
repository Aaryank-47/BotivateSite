import { useEffect, useRef } from 'react';
import './FrogPlanner.css';
import frogImg from '../assets/1f438.webp';
import gsap from 'gsap';

export default function FrogPlanner() {
  const containerRef = useRef(null);
  const tongueRef    = useRef(null);
  const floatRef     = useRef(null);
  const isLickingRef = useRef(false);

  // ─── Splat particles ────────────────────────────────────────────────
  const createSplat = () => {
    const wrapper = containerRef.current;
    const title   = wrapper?.querySelector('.fp-title');
    if (!wrapper || !title) return;

    const wR = wrapper.getBoundingClientRect();
    const tR = title.getBoundingClientRect();
    const cx = tR.left - wR.left + tR.width / 2;
    const cy = tR.top  - wR.top  + 12;

    const colors = ['#ff5e8c', '#ff8fab', '#ff2060', '#22c55e', '#86efac', '#fbbf24', '#fff'];

    for (let i = 0; i < 18; i++) {
      const dot  = document.createElement('div');
      const size = Math.random() * 14 + 4;
      Object.assign(dot.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        background: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: '50%',
        left: `${cx}px`,
        top: `${cy}px`,
        pointerEvents: 'none',
        zIndex: '20',
        opacity: '1',
        transform: 'translate(-50%, -50%)',
      });
      wrapper.appendChild(dot);

      const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
      const dist  = 60 + Math.random() * 110;
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 25,
        opacity: 0,
        scale: 0,
        duration: 0.55 + Math.random() * 0.35,
        ease: 'power2.out',
        onComplete: () => dot.remove(),
      });
    }
  };

  // ─── Drool drip ─────────────────────────────────────────────────────
  const createDrip = () => {
    const wrapper = containerRef.current;
    const frog    = wrapper?.querySelector('.fp-logo-container');
    if (!wrapper || !frog) return;

    const wR = wrapper.getBoundingClientRect();
    const fR = frog.getBoundingClientRect();
    const cx = fR.left - wR.left + fR.width / 2;
    const cy = fR.top  - wR.top  + fR.height - 4;

    const drip = document.createElement('div');
    Object.assign(drip.style, {
      position: 'absolute',
      width: '8px',
      height: '14px',
      background: 'linear-gradient(180deg, #ff5e8c, #ff2060)',
      borderRadius: '50% 50% 65% 65%',
      left: `${cx - 4}px`,
      top: `${cy}px`,
      pointerEvents: 'none',
      zIndex: '20',
      boxShadow: '0 0 8px rgba(255, 94, 140, 0.7)',
    });
    wrapper.appendChild(drip);

    gsap.to(drip, {
      y: 110,
      scaleY: 1.6,
      scaleX: 0.6,
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => drip.remove(),
    });
  };

  // ─── Main lick ──────────────────────────────────────────────────────
  const triggerLick = () => {
    if (!tongueRef.current || isLickingRef.current) return;
    isLickingRef.current = true;
    floatRef.current?.pause();

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set('.fp-logo-container', { y: 0 });
        floatRef.current?.restart();
        isLickingRef.current = false;
      },
    });

    // Snap out of any 3D tilt
    tl.to('.fp-logo-container', {
      rotationX: 0, rotationY: 0,
      duration: 0.12, ease: 'power2.out',
    });

    // Wind-up: lean back + vertical stretch
    tl.to('.fp-logo-container', {
      y: -16, scaleX: 0.86, scaleY: 1.14,
      duration: 0.15, ease: 'power3.out',
    });

    // Pause at peak (inhale moment)
    tl.to({}, { duration: 0.06 });

    // Slam forward: horizontal stretch, vertical squash
    tl.to('.fp-logo-container', {
      y: 20, scaleX: 1.18, scaleY: 0.82, rotation: 4,
      duration: 0.08, ease: 'power4.in',
    });

    // Tongue shoots out with whip skew
    tl.to(tongueRef.current, {
      scaleY: 1, skewX: 14,
      duration: 0.055, ease: 'power4.in',
    }, '-=0.025');
    tl.to(tongueRef.current, { skewX: -9,  duration: 0.04 });
    tl.to(tongueRef.current, { skewX: 5,   duration: 0.03 });
    tl.to(tongueRef.current, { skewX: 0,   duration: 0.03 });

    // IMPACT
    tl.add(() => {
      // Screen flash
      gsap.to('.fp-wrapper', {
        backgroundColor: '#150510',
        duration: 0.05, yoyo: true, repeat: 1,
      });

      // Per-letter scatter — from center outward
      gsap.to('.fp-letter', {
        y:        'random(-35, -8)',
        x:        'random(-12, 12)',
        rotation: 'random(-28, 28)',
        scale:    'random(0.55, 1.45)',
        duration: 0.14,
        stagger:  { each: 0.016, from: 'center' },
        ease: 'power3.out',
      });

      createSplat();
    });

    // Hold at contact
    tl.to({}, { duration: 0.08 });

    // Retract tongue
    tl.to(tongueRef.current, {
      scaleY: 0.35, duration: 0.045, ease: 'power3.in',
    });
    tl.to(tongueRef.current, {
      scaleY: 0, duration: 0.13, ease: 'power2.in',
    });

    // Letters snap back with elastic stagger
    tl.to('.fp-letter', {
      y: 0, x: 0, rotation: 0, scale: 1,
      duration: 0.75,
      stagger: { each: 0.022, from: 'center' },
      ease: 'elastic.out(1, 0.36)',
    }, '-=0.07');

    // Frog bounces back
    tl.to('.fp-logo-container', {
      y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      duration: 0.45, ease: 'back.out(3.8)',
    }, '-=0.5');

    // Drool drip
    tl.add(() => createDrip(), '-=0.35');

    // Celebration wiggle
    tl.to('.fp-logo-container', { rotation: -7,  duration: 0.09, ease: 'power1.inOut' }, '+=0.04');
    tl.to('.fp-logo-container', { rotation:  6,  duration: 0.09 });
    tl.to('.fp-logo-container', { rotation: -3,  duration: 0.07 });
    tl.to('.fp-logo-container', { rotation:  0,  duration: 0.18, ease: 'power2.out' });
  };

  // ─── Mouse 3D tracking ──────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (isLickingRef.current) return;
      const el = document.querySelector('.fp-logo-container');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth  * 0.5);
      const dy = (e.clientY - cy) / (window.innerHeight * 0.5);
      gsap.to('.fp-logo-container', {
        rotationY:  dx * 22,
        rotationX: -dy * 22,
        duration:   0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ─── Enter + float + auto-lick ──────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 3D perspective setup
      gsap.set('.fp-logo-container', { transformPerspective: 500 });

      // Entry
      gsap.fromTo('.fp-logo-container',
        { opacity: 0, scale: 0.65, y: -24 },
        { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'elastic.out(1, 0.6)', delay: 0.1 },
      );
      gsap.fromTo('.fp-tag',
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', delay: 0.22 },
      );
      gsap.fromTo('.fp-letter',
        { opacity: 0, y: 45, rotation: -6 },
        { opacity: 1, y: 0, rotation: 0, duration: 0.85, ease: 'power4.out',
          stagger: { each: 0.028, from: 'start' }, delay: 0.3 },
      );
      gsap.fromTo('.fp-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: 0.62 },
      );
      gsap.fromTo('.fp-desc',
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.82 },
      );
      gsap.fromTo('.fp-waitlist',
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)', delay: 1 },
      );
      gsap.fromTo('.fp-glow-orb',
        { opacity: 0, scale: 0.5 },
        { opacity: 0.35, scale: 1, duration: 2, ease: 'power2.out', stagger: 0.3 },
      );

      // GSAP float (replaces CSS keyframe — no transform conflicts)
      const startFloat = () => {
        floatRef.current = gsap.to('.fp-logo-container', {
          y: -11, duration: 2.6, ease: 'sine.inOut',
          yoyo: true, repeat: -1,
        });
      };
      setTimeout(startFloat, 1500);

      // First auto-lick
      const t = setTimeout(() => triggerLick(), 2000);
      return () => clearTimeout(t);
    }, containerRef);

    const interval = setInterval(() => triggerLick(), 9000);

    return () => {
      ctx.revert();
      clearInterval(interval);
      floatRef.current?.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! You have been added to the Frog Planner early access list.');
    e.target.reset();
  };

  return (
    <div className="fp-wrapper" ref={containerRef}>
      <div className="fp-glow-orb fp-orb-1" />
      <div className="fp-glow-orb fp-orb-2" />
      <div className="fp-mesh-grid" />

      <div className="fp-container">
        <div
          className="fp-logo-container"
          onClick={triggerLick}
          title="Click the frog!"
        >
          <img src={frogImg} alt="Frog" className="fp-logo-image" />
          <div className="fp-tongue" ref={tongueRef} />
        </div>

        <span className="fp-tag">NEW PRODUCT PREVIEW</span>

        <h1 className="fp-title" aria-label="Frog Planner">
          {'Frog'.split('').map((c, i) => (
            <span key={`f${i}`} className="fp-letter">{c}</span>
          ))}
          <span className="fp-letter fp-space">&nbsp;</span>
          <span className="fp-accent">
            {'Planner'.split('').map((c, i) => (
              <span key={`p${i}`} className="fp-letter">{c}</span>
            ))}
          </span>
        </h1>

        <h2 className="fp-subtitle">Smart Operations &amp; Team Scheduling</h2>
        <p className="fp-desc">
          Reimagining how teams coordinate daily workflows, assign tasks, and track resource velocity in real time. Designed to operate independently, or stack seamlessly with Botivate OS.
        </p>

        <div className="fp-waitlist">
          <h3 className="fp-waitlist-title">Get Early Access</h3>
          <form className="fp-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your work email"
              required
              className="fp-input"
            />
            <button type="submit" className="btn btn-primary">
              Join Waitlist
            </button>
          </form>
          <span className="fp-waitlist-note">
            Launch Q4 2026 &bull; Free pilot for existing Botivate OS customers
          </span>
        </div>
      </div>
    </div>
  );
}
