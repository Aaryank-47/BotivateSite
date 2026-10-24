import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ProductBanner.css';

gsap.registerPlugin(ScrollTrigger);

const TAGLINES = [
  'Growth on Autopilot',
  'Your Growth, On Autopilot',
  'Automate More. Grow More.',
  'Launch Fast. Grow Faster.',
];

// Cycles through phrases — starts only when enabled
function useCyclingTypewriter(phrases, enabled, typeSpeed = 52, deleteSpeed = 26, pause = 2600) {
  const [text, setText]         = useState('');
  const [idx, setIdx]           = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const phrase = phrases[idx];
    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setIdx(i => (i + 1) % phrases.length);
      return;
    }
    const speed = deleting ? deleteSpeed : typeSpeed;
    const t = setTimeout(() => {
      setText(deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [text, idx, deleting, enabled, phrases, typeSpeed, deleteSpeed, pause]);

  return text;
}

export default function ProductBanner() {
  const sectionRef    = useRef(null);
  const canvasRef     = useRef(null);
  const introRef      = useRef(null);
  const nameRef       = useRef(null);
  const ripple1Ref    = useRef(null);
  const ripple2Ref    = useRef(null);
  const ripple3Ref    = useRef(null);
  const typewriterRef = useRef(null);
  const descRef       = useRef(null);
  const chipsRef      = useRef(null);
  const actionsRef    = useRef(null);

  const [introEnabled,  setIntroEnabled]  = useState(false);
  const [introDone,     setIntroDone]     = useState(false);
  const [taglineEnabled, setTaglineEnabled] = useState(false);

  useEffect(() => {
    if (!introEnabled) return;
    const t = setTimeout(() => {
      setIntroDone(true);
    }, 900); // matches the 0.9s CSS animation duration
    return () => clearTimeout(t);
  }, [introEnabled]);

  const tagline = useCyclingTypewriter(TAGLINES, taglineEnabled);

  // ── Canvas water wave ───────────────────────────
  const startWave = useCallback((waveY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let rafId       = null;
    let active      = false;
    let elapsed     = 0;       // accumulated time while running
    let lastTs      = null;    // timestamp of last frame

    const WAVES = [
      { A: 9.0, f: 0.016, s:  1.30, p: 0.0  },
      { A: 5.0, f: 0.031, s: -0.80, p: 1.8  },
      { A: 7.0, f: 0.008, s:  0.55, p: 3.2  },
      { A: 3.5, f: 0.044, s:  1.90, p: 0.7  },
      { A: 4.0, f: 0.023, s: -1.10, p: 2.5  },
      { A: 2.0, f: 0.062, s:  2.30, p: 1.1  },
      { A: 5.5, f: 0.012, s:  0.70, p: 4.1  },
      { A: 1.5, f: 0.089, s: -2.80, p: 5.4  },
      { A: 2.5, f: 0.053, s:  1.60, p: 2.9  },
      { A: 1.2, f: 0.072, s: -1.50, p: 0.4  },
    ];

    function getY(x, t, offsetY = 0, speedMult = 1) {
      return waveY + offsetY + WAVES.reduce(
        (sum, w) => sum + w.A * Math.sin(x * w.f + t * w.s * speedMult + w.p), 0
      );
    }

    // Pre-build gradients once; rebuild only when canvas dimensions change
    let deepFill, midFill, surfFill;
    function buildGradients() {
      const h = canvas.height;
      deepFill = ctx.createLinearGradient(0, waveY + 16, 0, h);
      deepFill.addColorStop(0,   'rgba(79,  70, 229, 0.10)');
      deepFill.addColorStop(0.5, 'rgba(50, 152, 250, 0.07)');
      deepFill.addColorStop(1,   'rgba(74, 209, 251, 0.03)');

      midFill = ctx.createLinearGradient(0, waveY + 6, 0, h);
      midFill.addColorStop(0,   'rgba(92, 104, 255, 0.11)');
      midFill.addColorStop(0.5, 'rgba(50, 152, 250, 0.08)');
      midFill.addColorStop(1,   'rgba(74, 209, 251, 0.03)');

      surfFill = ctx.createLinearGradient(0, waveY - 10, 0, h);
      surfFill.addColorStop(0,   'rgba(92, 104, 255, 0.09)');
      surfFill.addColorStop(0.4, 'rgba(50, 152, 250, 0.12)');
      surfFill.addColorStop(1,   'rgba(74, 209, 251, 0.04)');
    }

    let resizeTimer = null;
    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildGradients();
    }
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    }
    resize();
    window.addEventListener('resize', onResize);

    function frame(ts) {
      if (!active) return;
      if (lastTs !== null) elapsed += (ts - lastTs) * 0.001;
      lastTs = ts;
      const t = elapsed;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Massively optimized: loop with a 4px horizontal step and cache all wave coordinates in a single pass.
      // This slashes trigonometry calculations by over 85%, freeing up massive CPU overhead.
      const step = 4;
      const xCoords = [];
      const deepY   = [];
      const midY    = [];
      const surfY   = [];

      for (let x = 0; x <= w + step; x += step) {
        xCoords.push(x);
        deepY.push(getY(x, t, 16, 0.55));
        midY.push(getY(x, t, 6, 0.78));
        surfY.push(getY(x, t));
      }

      const len = xCoords.length;

      // Draw Layer 1 — Deep wave fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < len; i++) {
        ctx.lineTo(xCoords[i], deepY[i]);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = deepFill;
      ctx.fill();

      // Draw Layer 2 — Mid wave fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < len; i++) {
        ctx.lineTo(xCoords[i], midY[i]);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = midFill;
      ctx.fill();

      // Draw Layer 3 — Surface wave fill
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < len; i++) {
        ctx.lineTo(xCoords[i], surfY[i]);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = surfFill;
      ctx.fill();

      // Draw Layer 4 — Surface stroke (colored)
      ctx.beginPath();
      ctx.moveTo(xCoords[0], surfY[0]);
      for (let i = 1; i < len; i++) {
        ctx.lineTo(xCoords[i], surfY[i]);
      }
      ctx.strokeStyle = 'rgba(92, 104, 255, 0.30)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Draw Layer 5 — Surface highlight (white top rim)
      ctx.beginPath();
      ctx.moveTo(xCoords[0], surfY[0] - 1.5);
      for (let i = 1; i < len; i++) {
        ctx.lineTo(xCoords[i], surfY[i] - 1.5);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.60)';
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // Draw Layer 6 — Sparkles and peaks
      ctx.save();
      for (let x = 18; x < w; x += 40) {
        const xd = x + Math.sin(x * 0.07 + t * 0.8) * 10;
        const y  = getY(xd, t);
        const yL = getY(xd - 4, t);
        const yR = getY(xd + 4, t);

        if (y < yL && y < yR) {
          const pulse = 0.2 + 0.6 * Math.abs(Math.sin(xd * 0.18 + t * 2.8));

          ctx.beginPath();
          ctx.ellipse(xd, y - 3, 4, 1.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.85})`;
          ctx.fill();

          if (pulse > 0.55) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
            ctx.lineWidth   = 0.9;
            ctx.beginPath();
            ctx.moveTo(xd - 5, y - 3);
            ctx.lineTo(xd + 5, y - 3);
            ctx.moveTo(xd, y - 8);
            ctx.lineTo(xd, y + 1);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    }

    return {
      resume() {
        if (active) return;
        active = true;
        lastTs = null;          // reset delta so paused time isn't counted
        rafId  = requestAnimationFrame(frame);
      },
      pause() {
        active = false;
        cancelAnimationFrame(rafId);
        rafId  = null;
      },
      stop() {
        active = false;
        cancelAnimationFrame(rafId);
        rafId  = null;
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
      },
    };
  }, []);

  // ── Animation timeline ──────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    const name    = nameRef.current;
    if (!section || !name) return;

    const secRect  = section.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    const waveY    = nameRect.bottom - secRect.top + 28;

    const wave = startWave(waveY);

    // Only run canvas when section is visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) wave?.resume();
        else                      wave?.pause();
      },
      { threshold: 0.1 }
    );
    observer.observe(section);

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray('.pb-word', section);

      gsap.set(nameRef.current,
        { y: 90, opacity: 0, filter: 'blur(8px)' });
      gsap.set(
        [typewriterRef.current, actionsRef.current],
        { y: 16, opacity: 0 });
      gsap.set(words, { opacity: 0, y: 10 });
      gsap.set(chipsRef.current, { opacity: 0, y: 12 });
      gsap.set(
        [ripple1Ref.current, ripple2Ref.current, ripple3Ref.current],
        { scale: 0.2, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      });

      // Phase 1 — "Introducing" types out  (~11 chars × 82ms ≈ 900ms)
      tl.call(() => setIntroEnabled(true), [], 0);

      // Phase 2 — "Botivate OS" rises from water
      tl.to(nameRef.current, {
        y: 0, opacity: 1, filter: 'blur(0px)',
        duration: 1.6, ease: 'expo.out',
      }, 2.0);

      // Ripple rings expand at the waterline
      tl.to(ripple1Ref.current, { scale: 2.8, opacity: 0, duration: 1.4, ease: 'power1.out' }, 2.4);
      tl.to(ripple2Ref.current, { scale: 2.8, opacity: 0, duration: 1.4, ease: 'power1.out' }, 2.6);
      tl.to(ripple3Ref.current, { scale: 2.8, opacity: 0, duration: 1.4, ease: 'power1.out' }, 2.8);

      // Phase 3 — tagline fades up, then words stagger in, then chips, then buttons
      tl.to(typewriterRef.current, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power2.out',
        onComplete: () => setTaglineEnabled(true),
      }, 3.2);
      tl.to(words, {
        opacity: 1, y: 0, duration: 0.35, stagger: 0.032, ease: 'power2.out',
      }, 3.4);
      tl.to(chipsRef.current, {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
      }, 3.4 + words.length * 0.032 + 0.05);
      tl.to(actionsRef.current, {
        y: 0, opacity: 1, duration: 0.45, ease: 'power2.out',
      }, 3.4 + words.length * 0.032 + 0.25);

    }, sectionRef);

    return () => {
      wave?.stop();
      observer.disconnect();
      ctx.revert();
    };
  }, [startWave]);

  return (
    <section className="pb" ref={sectionRef}>

      <div className="pb-grid"        aria-hidden="true" />
      <canvas className="pb-canvas"   ref={canvasRef}    aria-hidden="true" />

      <div className="pb-content">

        {/* Phase 1 — "Introducing" types out */}
        <div className={`pb-intro${introEnabled ? ' pb-intro--active' : ''}${introDone ? ' pb-intro--done' : ''}`} ref={introRef}>
          <span className="pb-intro-text">Introducing</span>
        </div>

        {/* Phase 2 — name emerges from water */}
        <div className="pb-name-wrap">
          <h2 className="pb-name" ref={nameRef}>
            <span className="pb-name-grad">Auto</span>
            <span className="pb-name-black">Rocket<span className="pb-name-tm">TM</span></span>
          </h2>
          <div className="pb-ripples" aria-hidden="true">
            <span className="pb-ripple" ref={ripple1Ref} />
            <span className="pb-ripple" ref={ripple2Ref} />
            <span className="pb-ripple" ref={ripple3Ref} />
          </div>
        </div>

        {/* Phase 3 — tagline, description, buttons */}
        <div className="pb-typewriter" ref={typewriterRef} aria-live="polite">
          <span className="pb-typewriter-text">{tagline}</span>
          <span className="pb-cursor" aria-hidden="true" />
        </div>

        <div className="pb-desc-block">
          <p className="pb-desc" ref={descRef}>
            {['A', 'complete', 'Business', 'Execution', 'Operating', 'System', 'tailored', 'to', 'how', 'you', 'actually', 'work.'].map((word, i, arr) => (
              <span key={i}>
                <span className="pb-word">{word}</span>
                {i < arr.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
          <div className="pb-chips" ref={chipsRef}>
            {['Sales & CRM', 'Production', 'HR', 'Inventory', 'Approvals', 'AI Agents', 'WhatsApp'].map(label => (
              <span key={label} className="pb-chip">{label}</span>
            ))}
            <span className="pb-chip pb-chip--more">& more</span>
          </div>
        </div>

        <div className="pb-actions" ref={actionsRef}>
          {/* <a
            href="https://wa.me/918871527519?text=Hi%20Botivate%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Book Free Demo
          </a> */}
          <a href="https://www.autorocket.in/" className="btn btn-primary">
            Explore AutoRocket
          </a>
        </div>

      </div>
    </section>
  );
}
