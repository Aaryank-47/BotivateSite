import { cloneElement, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  SiReact, SiNodedotjs, SiDocker,
  SiPostgresql, SiStripe, SiNextdotjs, SiMongodb,
  SiRazorpay, SiPython, SiRedis,
  SiTailwindcss, SiGraphql, SiFirebase,
  SiZapier, SiTwilio,
  SiKubernetes, SiCloudflare, SiNginx,
  SiSupabase, SiHostinger, SiResend,
  SiGooglesheets, SiGoogleappsscript, SiGoogle, SiFlutter,
} from 'react-icons/si';
import { FaAws, FaJava } from 'react-icons/fa6';
import { TbApi } from 'react-icons/tb';
import { MdOutlinePayment, MdOutlineCreditCard } from 'react-icons/md';
import './Technologies.css';

gsap.registerPlugin(ScrollTrigger);

// ── Wheel geometry ─────────────────────────────────────────────
const SIZE   = 880;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const HUB_R  = 108;
const RING_A = [130, 192];
const RING_B = [198, 278];
const RING_C = [284, 378];
const GAP    = 6;

// ── Motion / interaction tunables ──────────────────────────────
const INNER_DPS     =  360 / 60;   // +6°/s clockwise
const OUTER_DPS     = -360 / 90;   // -4°/s counter-clockwise
const RESET_RATE    =  6;          // ease-home decay rate

function rad(deg) { return ((deg - 90) * Math.PI) / 180; }
function xy(r, deg) {
  return { x: CX + r * Math.cos(rad(deg)), y: CY + r * Math.sin(rad(deg)) };
}
function arc(r1, r2, a1, a2) {
  const p1 = xy(r1, a1), p2 = xy(r1, a2);
  const p3 = xy(r2, a2), p4 = xy(r2, a1);
  const lg = (a2 - a1) > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${r1} ${r1} 0 ${lg} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${r2} ${r2} 0 ${lg} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}
function pillStyle(r, angleDeg) {
  const p = xy(r, angleDeg);
  return { left: `${(p.x / SIZE * 100).toFixed(2)}%`, top: `${(p.y / SIZE * 100).toFixed(2)}%` };
}

// ── Data ───────────────────────────────────────────────────────
const categories = [
  {
    label: 'Frontend', angle: 0, color: '#3b82f6',
    fill: 'rgba(59,130,246,0.14)', fillB: 'rgba(59,130,246,0.08)', fillC: 'rgba(59,130,246,0.04)',
    innerTechs: [
      { icon: <SiReact />,       label: 'React',      brand: '#61dafb', offset: -16 },
      { icon: <SiNextdotjs />,   label: 'Next.js',    brand: '#000',    offset:  16 },
    ],
    outerTechs: [
      { icon: <SiReact />,       label: 'React Native', brand: '#61dafb', offset: -18 },
      { icon: <SiFlutter />,     label: 'Flutter',    brand: '#02569b', offset:   0 },
      { icon: <SiTailwindcss />, label: 'Tailwind',   brand: '#06b6d4', offset:  18 },
    ],
  },
  {
    label: 'Backend', angle: 60, color: '#22c55e',
    fill: 'rgba(34,197,94,0.14)', fillB: 'rgba(34,197,94,0.08)', fillC: 'rgba(34,197,94,0.04)',
    innerTechs: [
      { icon: <SiNodedotjs />, label: 'Node.js', brand: '#339933', offset: -14 },
      { icon: <SiPython />,    label: 'Python',  brand: '#3776ab', offset:  14 },
    ],
    outerTechs: [
      { icon: <FaJava />,      label: 'Java',     brand: '#f89820', offset: -20 },
      { icon: <SiGraphql />,   label: 'GraphQL',  brand: '#e10098', offset:   0 },
      { icon: <TbApi />,       label: 'REST',     brand: '#2563eb', offset:  20 },
    ],
  },
  {
    label: 'Database', angle: 120, color: '#f59e0b',
    fill: 'rgba(245,158,11,0.14)', fillB: 'rgba(245,158,11,0.08)', fillC: 'rgba(245,158,11,0.04)',
    innerTechs: [
      { icon: <SiMongodb />,    label: 'MongoDB',    brand: '#47a248', offset: -14 },
      { icon: <SiPostgresql />, label: 'PostgreSQL', brand: '#336791', offset:  14 },
    ],
    outerTechs: [
      { icon: <SiRedis />,    label: 'Redis',    brand: '#dc382d', offset: -20 },
      { icon: <SiSupabase />, label: 'Supabase', brand: '#3ecf8e', offset:   0 },
      { icon: <SiFirebase />, label: 'Firebase', brand: '#ffca28', offset:  20 },
    ],
  },
  {
    label: 'Cloud & DevOps', angle: 180, color: '#f97316',
    fill: 'rgba(249,115,22,0.14)', fillB: 'rgba(249,115,22,0.08)', fillC: 'rgba(249,115,22,0.04)',
    innerTechs: [
      { icon: <FaAws />,         label: 'AWS',        brand: '#ff9900', offset: -14 },
      { icon: <SiKubernetes />,  label: 'Kubernetes', brand: '#326ce5', offset:  14 },
    ],
    outerTechs: [
      { icon: <SiDocker />,     label: 'Docker',     brand: '#2496ed', offset: -22 },
      { icon: <SiNginx />,      label: 'Nginx',      brand: '#009639', offset:  -8 },
      { icon: <SiHostinger />,  label: 'Hostinger',  brand: '#673ee5', offset:   8 },
      { icon: <SiCloudflare />, label: 'Cloudflare', brand: '#f38020', offset:  22 },
    ],
  },
  {
    label: 'Payments', angle: 240, color: '#a855f7',
    fill: 'rgba(168,85,247,0.14)', fillB: 'rgba(168,85,247,0.08)', fillC: 'rgba(168,85,247,0.04)',
    innerTechs: [
      { icon: <SiStripe />,   label: 'Stripe',   brand: '#635bff', offset: -14 },
      { icon: <SiRazorpay />, label: 'Razorpay', brand: '#3395ff', offset:  14 },
    ],
    outerTechs: [
      { icon: <MdOutlinePayment />, label: 'PayU',   brand: '#8ac03f', offset: -14 },
      { icon: <MdOutlineCreditCard />, label: 'EnKash', brand: '#4730d3', offset:  14 },
    ],
  },
  {
    label: 'AI & Automation', angle: 300, color: '#10b981',
    fill: 'rgba(16,185,129,0.14)', fillB: 'rgba(16,185,129,0.08)', fillC: 'rgba(16,185,129,0.04)',
    innerTechs: [
      { icon: <SiGooglesheets />, label: 'Google Sheets', brand: '#0f9d58', offset: -12 },
      { icon: <SiZapier />,       label: 'Zapier',        brand: '#ff4a00', offset:  12 },
    ],
    outerTechs: [
      { icon: <SiTwilio />,           label: 'Twilio',    brand: '#f22f46', offset: -21 },
      { icon: <SiGoogleappsscript />, label: 'AppScript', brand: '#34a853', offset:  -7 },
      { icon: <SiGoogle />,           label: 'Workspace', brand: '#4285f4', offset:   7 },
      { icon: <SiResend />,           label: 'Resend',    brand: '#000000', offset:  21 },
    ],
  },
];

const midR = ([r1, r2]) => (r1 + r2) / 2;

export default function Technologies() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);

  // Wheel + interaction refs
  const [running, setRunning] = useState(true);
  const wrapRef       = useRef(null);
  const innerRingRef  = useRef(null);
  const outerRingRef  = useRef(null);
  const innerPillsRef = useRef([]);
  const outerPillsRef = useRef([]);
  const runningRef    = useRef(running);

  useEffect(() => { runningRef.current = running; }, [running]);

  // ── Scroll-in fade ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
      );
      gsap.fromTo(wrapRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', toggleActions: 'play none none none' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ── rAF loop: rotation ──
  useEffect(() => {
    const innerRing = innerRingRef.current, outerRing = outerRingRef.current;
    if (!innerRing || !outerRing) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let innerAngle = 0, outerAngle = 0;

    let raf = 0, lastT = performance.now();
    const tick = (t) => {
      const dt = Math.min(50, t - lastT) / 1000; lastT = t;

      if (reduceMotion) { innerAngle = 0; outerAngle = 0; }
      else if (runningRef.current) {
        innerAngle = (innerAngle + INNER_DPS * dt) % 360;
        outerAngle = (outerAngle + OUTER_DPS * dt) % 360;
      } else {
        const wrapA = a => ((a + 540) % 360) - 180;
        const k = 1 - Math.exp(-RESET_RATE * dt);
        innerAngle += (-wrapA(innerAngle)) * k;
        outerAngle += (-wrapA(outerAngle)) * k;
        if (Math.abs(innerAngle) < 0.05) innerAngle = 0;
        if (Math.abs(outerAngle) < 0.05) outerAngle = 0;
      }
      innerRing.style.transform = `rotate(${innerAngle.toFixed(3)}deg)`;
      outerRing.style.transform = `rotate(${outerAngle.toFixed(3)}deg)`;


      const innerPills = innerPillsRef.current.filter(Boolean);
      const outerPills = outerPillsRef.current.filter(Boolean);
      innerPills.forEach(p => p.spin && (p.spin.style.transform = `rotate(${(-innerAngle).toFixed(3)}deg)`));
      outerPills.forEach(p => p.spin && (p.spin.style.transform = `rotate(${(-outerAngle).toFixed(3)}deg)`));


      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, []);

  // Reset pill arrays each render so refs collect fresh
  innerPillsRef.current = [];
  outerPillsRef.current = [];

  return (
    <section className="technologies" id="technologies" ref={sectionRef}>
      <div className="technologies-header" ref={headRef}>
        <h2 className="section-title">
          Technologies We <span className="gradient-text">Master</span>
        </h2>
        <p className="section-subtitle">
          Every tool chosen for a reason. Built to scale, integrate, and perform.
        </p>
      </div>

      <div className={`tech-wheel-wrap ${running ? 'is-running' : 'is-stopped'}`} ref={wrapRef}>
        <div className="tech-wheel">

          <svg className="tech-wheel-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} xmlns="http://www.w3.org/2000/svg">
            {[RING_A[0], RING_B[0], RING_C[0], RING_C[1]].map(r => (
              <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
            ))}
            {categories.map((cat) => {
              const a1 = cat.angle - 30 + GAP / 2;
              const a2 = cat.angle + 30 - GAP / 2;
              return (
                <g key={cat.label}>
                  <path d={arc(RING_A[0], RING_A[1], a1, a2)} fill={cat.fill} />
                  <path d={arc(RING_B[0], RING_B[1], a1, a2)} fill={cat.fillB} />
                  <path d={arc(RING_C[0], RING_C[1], a1, a2)} fill={cat.fillC} />
                  {(() => {
                    const inner = xy(HUB_R + 2, cat.angle);
                    const outer = xy(RING_C[1], cat.angle);
                    return (
                      <line x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
                            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
                            stroke={cat.color} strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 4" />
                    );
                  })()}
                </g>
              );
            })}
            <circle cx={CX} cy={CY} r={HUB_R} fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
          </svg>

          {/* Hub — click to stop/resume */}
          <button
            type="button"
            className="tech-hub"
            onClick={() => setRunning(r => !r)}
            aria-pressed={!running}
            aria-label={running ? 'Stop and reset stack' : 'Resume stack rotation'}
          >
            <div className="tech-hub-ring" />
            <span className="tech-hub-label">Botivate</span>
            <span className="tech-hub-sub">Tech Stack</span>
          </button>

          {/* Category labels (non-rotating) */}
          {categories.map((cat) => {
            const rot = ((cat.angle + 90) % 180) - 90;
            return (
              <div
                key={`label-${cat.label}`}
                className="tech-cat-label"
                style={{
                  ...pillStyle(midR(RING_A), cat.angle),
                  '--cat-color': cat.color,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                }}
              >
                {cat.label}
              </div>
            );
          })}

          {/* Inner ring */}
          <div className="tech-ring tech-ring--inner" ref={innerRingRef}>
            {categories.flatMap((cat) => cat.innerTechs.map((tech, j) => {
              const idx = innerPillsRef.current.length;
              innerPillsRef.current.push({});
              return (
                <div
                  key={`inner-${cat.label}-${j}`}
                  className="tech-node"
                  style={{ ...pillStyle(midR(RING_B), cat.angle + tech.offset), '--brand': tech.brand }}
                  ref={el => { if (innerPillsRef.current[idx]) innerPillsRef.current[idx].node = el; }}
                >
                  <div className="tech-node-spin" ref={el => { if (innerPillsRef.current[idx]) innerPillsRef.current[idx].spin = el; }}>
                    <div className="tech-node-magnet">
                      <span className="tech-node-icon">{tech.icon}</span>
                      <span className="tech-node-label">{tech.label}</span>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Outer ring */}
          <div className="tech-ring tech-ring--outer" ref={outerRingRef}>
            {categories.flatMap((cat) => cat.outerTechs.map((tech, j) => {
              const idx = outerPillsRef.current.length;
              outerPillsRef.current.push({});
              return (
                <div
                  key={`outer-${cat.label}-${j}`}
                  className="tech-node tech-node--outer"
                  style={{ ...pillStyle(midR(RING_C), cat.angle + tech.offset), '--brand': tech.brand }}
                  ref={el => { if (outerPillsRef.current[idx]) outerPillsRef.current[idx].node = el; }}
                >
                  <div className="tech-node-spin" ref={el => { if (outerPillsRef.current[idx]) outerPillsRef.current[idx].spin = el; }}>
                    <div className="tech-node-magnet">
                      <span className="tech-node-icon">{tech.icon}</span>
                      <span className="tech-node-label">{tech.label}</span>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="tech-mobile-grid">
        {categories.map((cat) => (
          <div key={`mob-${cat.label}`} className="tech-mobile-cat" style={{ '--cat-color': cat.color }}>
            <div className="tech-mobile-cat-label">{cat.label}</div>
            <div className="tech-mobile-pills">
              {[...cat.innerTechs, ...cat.outerTechs].map((t, i) => (
                <div key={i} className="tech-mobile-pill" style={{ '--brand': t.brand }}>
                  {cloneElement(t.icon, { 'aria-hidden': 'true', focusable: 'false' })} {t.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
