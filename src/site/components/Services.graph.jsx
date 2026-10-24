import { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiShoppingCart, FiTruck, FiTool, FiPackage, FiUsers,
  FiCheckSquare, FiShoppingBag, FiTrendingUp, FiPhone, FiCpu,
} from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import './Services.css';

gsap.registerPlugin(ScrollTrigger);

const W = 820, H = 540;
const CX = W / 2, CY = H / 2;

// Modules ordered clockwise from top: Revenue → Operations → People → Automation
const MODULES = [
  {
    id: 'lead', label: 'Lead & Enquiry', short: 'Leads', icon: FiPhone,
    color: '#3b82f6', cat: 'Revenue',
    desc: 'Capture every enquiry from every channel. Never miss a follow-up.',
    features: ['Multi-channel capture', 'Enquiry tracking', 'Quotation management', 'Conversion reports'],
  },
  {
    id: 'sales', label: 'Marketing & Sales', short: 'Sales', icon: FiTrendingUp,
    color: '#e11d48', cat: 'Revenue',
    desc: 'Pipeline, quotes and conversions in one view.',
    features: ['Campaign tracking', 'Sales pipeline', 'Follow-up automation', 'ROI reports'],
  },
  {
    id: 'order', label: 'Order Management', short: 'Orders', icon: FiShoppingCart,
    color: '#5c68ff', cat: 'Operations',
    desc: 'Track every order from creation to dispatch. Nothing slips.',
    features: ['Order tracking', 'Dispatch management', 'Status updates', 'Customer alerts'],
  },
  {
    id: 'purchase', label: 'Purchase', short: 'Purchase', icon: FiTruck,
    color: '#3298fa', cat: 'Operations',
    desc: 'Indents to PO to GRN. Zero spreadsheets, zero delays.',
    features: ['Vendor quotations', 'PO management', 'Approval workflows', 'GRN reconciliation'],
  },
  {
    id: 'production', label: 'Production', short: 'Production', icon: FiTool,
    color: '#10b981', cat: 'Operations',
    desc: 'Plan the shop floor. Track every job-card. Catch delays early.',
    features: ['Stage tracking', 'Bottleneck alerts', 'Timeline reports', 'Efficiency metrics'],
  },
  {
    id: 'inventory', label: 'Inventory', short: 'Inventory', icon: FiPackage,
    color: '#f59e0b', cat: 'Operations',
    desc: 'Live stock across all locations. Reorder before you run out.',
    features: ['Stock tracking', 'Low stock alerts', 'Inward / outward', 'Multi-location'],
  },
  {
    id: 'store', label: 'Store & Repair', short: 'Store', icon: FiShoppingBag,
    color: '#22c55e', cat: 'Operations',
    desc: 'After-sales tickets, AMC and on-site repairs. Proof of work, always.',
    features: ['Repair tickets', 'Spare management', 'Technician tracking', 'SLA monitoring'],
  },
  {
    id: 'task', label: 'Task & Delegation', short: 'Tasks', icon: FiCheckSquare,
    color: '#f97316', cat: 'People',
    desc: 'Every responsibility, owned and tracked. No fake done statuses.',
    features: ['Task assignment', 'Escalation system', 'Checklist validation', 'Proof uploads'],
  },
  {
    id: 'hr', label: 'HR & Attendance', short: 'HR', icon: FiUsers,
    color: '#a855f7', cat: 'People',
    desc: 'Attendance, payroll and performance from one record per employee.',
    features: ['Attendance tracking', 'Leave management', 'Payroll inputs', 'KPI scores'],
  },
  {
    id: 'whatsapp', label: 'WhatsApp Automation', short: 'WhatsApp', icon: SiWhatsapp,
    color: '#25d366', cat: 'Automation',
    desc: 'Updates and reminders on the channel customers actually read.',
    features: ['Auto replies', 'Follow-up sequences', 'Approval alerts', 'Bulk messaging'],
  },
  {
    id: 'ai', label: 'AI Agents', short: 'AI', icon: FiCpu,
    color: '#6366f1', cat: 'Automation',
    desc: 'Agents that work across every module, 24/7.',
    features: ['Sales AI Agent', 'HR AI Agent', 'Director AI Agent', 'Operations AI Agent'],
  },
];

// Curated workflow connections between modules
const LINKS = [
  ['lead', 'sales'],
  ['sales', 'order'],
  ['order', 'production'],
  ['order', 'inventory'],
  ['production', 'inventory'],
  ['purchase', 'inventory'],
  ['order', 'whatsapp'],
  ['inventory', 'store'],
  ['task', 'hr'],
  ['ai', 'whatsapp'],
  ['ai', 'lead'],
  ['ai', 'task'],
  ['sales', 'whatsapp'],
  ['production', 'task'],
  ['purchase', 'production'],
];

function curve(a, b, bend) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${(mx - dy * bend).toFixed(1)},${(my + dx * bend).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

export default function Services() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const wrapRef    = useRef(null);

  const [locked, setLocked] = useState('order');
  const [hover,  setHover]  = useState(null);
  const activeId = hover || locked;
  const active   = MODULES.find(m => m.id === activeId) || MODULES[0];
  const ActiveIcon = active.icon;

  // Elliptical node positions — slight jitter for organic feel
  const positions = useMemo(() => {
    const rx = 248, ry = 185, N = MODULES.length;
    return MODULES.map((m, i) => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      const jitter = 1 + (((i * 41) % 17) - 8) * 0.012;
      return { id: m.id, x: CX + Math.cos(t) * rx * jitter, y: CY + Math.sin(t) * ry * jitter, angle: t };
    });
  }, []);

  const posById = useMemo(() => Object.fromEntries(positions.map(p => [p.id, p])), [positions]);
  const modById = useMemo(() => Object.fromEntries(MODULES.map(m => [m.id, m])), []);

  // Set of ids that are related to activeId (active + direct neighbours)
  const relatedSet = useMemo(() => {
    const s = new Set([activeId]);
    LINKS.forEach(([a, b]) => {
      if (a === activeId) s.add(b);
      if (b === activeId) s.add(a);
    });
    return s;
  }, [activeId]);

  // Which modules connect to the active one (for the panel chips)
  const connectsWith = useMemo(() =>
    LINKS
      .filter(([a, b]) => a === activeId || b === activeId)
      .map(([a, b]) => a === activeId ? b : a),
    [activeId]
  );

  // Scroll-in animations
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

  return (
    <section className="systems" id="systems" ref={sectionRef}>
      <div className="systems-inner container">

        <div className="systems-header" ref={headRef}>
          <div className="systems-header-label">What We Build</div>
          <h2 className="systems-header-h">
            One Business OS.<br />
            <span className="systems-header-h-grad">Multiple Business Operations. Fully Connected.</span>
          </h2>
          <p className="systems-header-p">
            Every operation, every team, every workflow. All running inside one intelligent system, fully connected and built to scale.
          </p>
        </div>

        <div className="bos-layout" ref={wrapRef}>

          {/* Connected graph */}
          <div className="bos-graph-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} className="bos-graph-svg">
              <defs>
                <radialGradient id="bosGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="rgba(92,104,255,0.10)" />
                  <stop offset="65%"  stopColor="rgba(92,104,255,0.03)" />
                  <stop offset="100%" stopColor="rgba(92,104,255,0)" />
                </radialGradient>
                <pattern id="bosDots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="0.5" cy="0.5" r="0.6" fill="rgba(0,0,0,0.12)" />
                </pattern>
              </defs>

              {/* Dot grid */}
              <rect width={W} height={H} fill="url(#bosDots)" opacity="0.45" />

              {/* Core glow */}
              <circle cx={CX} cy={CY} r="210" fill="url(#bosGlow)" />

              {/* Core → node spokes */}
              {positions.map(p => {
                const isActive = p.id === activeId;
                return (
                  <line
                    key={`sp-${p.id}`}
                    x1={CX} y1={CY}
                    x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
                    stroke={isActive ? modById[p.id].color : 'rgba(0,0,0,0.08)'}
                    strokeWidth={isActive ? 1.6 : 1}
                    strokeDasharray={isActive ? undefined : '3 6'}
                    opacity={hover && !isActive ? 0.22 : 1}
                    pointerEvents="none"
                    className="bos-link"
                  />
                );
              })}

              {/* Lateral workflow links */}
              {LINKS.map(([a, b], i) => {
                const on = a === activeId || b === activeId;
                return (
                  <path
                    key={`lk-${i}`}
                    d={curve(posById[a], posById[b], 0.11 + ((i % 5) - 2) * 0.03)}
                    fill="none"
                    stroke={on ? '#5c68ff' : 'rgba(0,0,0,0.07)'}
                    strokeWidth={on ? 1.6 : 0.9}
                    opacity={hover ? (on ? 0.88 : 0.08) : 0.4}
                    pointerEvents="none"
                    className="bos-link"
                  />
                );
              })}

              {/* Botivate OS core node */}
              <g transform={`translate(${CX},${CY})`}>
                <circle r="54" fill="#fff" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
                <circle r="44" fill="#1a1a2e" />
                <circle r="64" fill="none" stroke="rgba(92,104,255,0.28)" strokeWidth="1" strokeDasharray="2 3.5" />
                <text textAnchor="middle" y="-5" fill="#fff" fontFamily="system-ui,sans-serif" fontSize="9.5" fontWeight="700" letterSpacing="0.12em">BOTIVATE</text>
                <text textAnchor="middle" y="8"  fill="rgba(255,255,255,0.5)" fontFamily="system-ui,sans-serif" fontSize="8" letterSpacing="0.08em">BUSINESS OS</text>
              </g>

              {/* Module nodes */}
              {positions.map((p, i) => {
                const m = MODULES[i];
                const isActive = m.id === activeId;
                const isDimmed = hover ? !relatedSet.has(m.id) : false;
                const cos      = Math.cos(p.angle);
                const lDist    = 37;
                const lx       = Math.cos(p.angle) * lDist;
                const ly       = Math.sin(p.angle) * lDist;
                const anchor   = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
                const nameY    = ly + (ly < -8 ? -3 : ly > 8 ? 10 : 4);
                const catY     = ly + (ly < -8 ? 8 : ly > 8 ? 22 : 16);
                const Icon     = m.icon;

                return (
                  <g
                    key={m.id}
                    transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`}
                    className="bos-node-g"
                    style={{ opacity: isDimmed ? 0.26 : 1 }}
                  >
                    {/* Hit area — sole event target; sits on top via z-order */}
                    <circle
                      r="34" fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHover(m.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setLocked(m.id)}
                    />

                    {/* All visuals have pointerEvents="none" so they never
                        fire mouseleave on the g, which caused the shake */}
                    {isActive && (
                      <circle r="28" fill="none" stroke={m.color} strokeWidth="1.5" opacity="0.35" pointerEvents="none" />
                    )}
                    <circle
                      r="21"
                      fill={isActive ? m.color : '#fff'}
                      stroke={isActive ? m.color : 'rgba(0,0,0,0.12)'}
                      strokeWidth="1.5"
                      pointerEvents="none"
                    />
                    {/* Nested SVG — no foreignObject, no HTML context switch */}
                    <Icon
                      x="-7" y="-7"
                      width="14" height="14"
                      color={isActive ? '#fff' : m.color}
                      pointerEvents="none"
                    />
                    <text
                      x={lx.toFixed(1)} y={nameY.toFixed(1)}
                      textAnchor={anchor}
                      fontFamily="system-ui,sans-serif"
                      fontSize="10.5"
                      fontWeight={isActive ? '700' : '600'}
                      fill={isActive ? m.color : '#1a1a2e'}
                      pointerEvents="none"
                    >{m.short}</text>
                    <text
                      x={lx.toFixed(1)} y={catY.toFixed(1)}
                      textAnchor={anchor}
                      fontFamily="system-ui,sans-serif"
                      fontSize="8"
                      fill="rgba(0,0,0,0.38)"
                      letterSpacing="0.06em"
                      pointerEvents="none"
                    >{m.cat.toUpperCase()}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail panel */}
          <div className="bos-panel" style={{ '--color': active.color }} key={active.id}>
            <div className="bos-panel-icon-wrap">
              <span className="bos-panel-icon"><ActiveIcon /></span>
            </div>
            <div className="bos-panel-cat">{active.cat}</div>
            <h3 className="bos-panel-title">{active.label}</h3>
            <p className="bos-panel-desc">{active.desc}</p>
            <ul className="bos-panel-features">
              {active.features.map((f, i) => (
                <li key={i}>
                  <span className="bos-panel-dot" />
                  {f}
                </li>
              ))}
            </ul>
            {connectsWith.length > 0 && (
              <div className="bos-panel-connects">
                <div className="bos-panel-connects-label">Connects with</div>
                <div className="bos-panel-chips">
                  {connectsWith.map(id => {
                    const m = modById[id];
                    const MIcon = m.icon;
                    return (
                      <button
                        key={id}
                        className="bos-panel-chip"
                        style={{ '--chip-color': m.color }}
                        onClick={() => setLocked(id)}
                        onMouseEnter={() => setHover(id)}
                        onMouseLeave={() => setHover(null)}
                      >
                        <MIcon size={11} />
                        {m.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="bos-panel-hint">Hover any module to explore its connections</p>
          </div>

        </div>

        {/* Mobile fallback */}
        <div className="bos-mobile-grid">
          {MODULES.map((m, i) => {
            const MIcon = m.icon;
            return (
              <div key={i} className="bos-mobile-item" style={{ '--color': m.color }}>
                <span className="bos-mobile-icon"><MIcon /></span>
                <span>{m.short}</span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
