import { useEffect, useState } from 'react';
import {
  FiSettings, FiGitMerge, FiLock, FiShare2,
  FiSmartphone, FiMonitor, FiServer, FiDatabase,
} from 'react-icons/fi';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import './OperationalLayers.css';


const SiRedisLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="#DC382D" {...props}>
    <path d="M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 0 0 5.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z" />
  </svg>
);

const SiSupabaseLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="#3ECF8E" {...props}>
    <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z" />
  </svg>
);

const SiAWSChip = (props) => (
  <svg viewBox="0 0 58 30" {...props}>
    <rect x="0.5" y="0.5" width="57" height="29" rx="7" fill="#232F3E" stroke="#232F3E" />
    <text x="29" y="20" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="13" fill="#FF9900" letterSpacing="0.5">AWS</text>
  </svg>
);

const SiAzureChip = (props) => (
  <svg viewBox="0 0 58 30" {...props}>
    <rect x="0.5" y="0.5" width="57" height="29" rx="7" fill="#0078D4" stroke="#0078D4" />
    <text x="29" y="19" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="10.5" fill="#ffffff" letterSpacing="0.2">Azure</text>
  </svg>
);

// Laptop custom SVG icon (Feather style)
const FiLaptop = (props) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="4" width="20" height="12" rx="2" ry="2" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

// Botivate logo SVG icon
const BotivateShieldLogo = () => (
  <svg viewBox="0 0 100 100" className="op-shield-logo-svg" width="36" height="36">
    <path d="M50 15 L80 30 L80 65 L50 85 L20 65 L20 30 Z" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M50 15 L50 85" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M20 30 L80 65" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M80 30 L20 65" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <polygon points="50,22 74,34 74,48 50,36" fill="#3b82f6" opacity="0.8" />
    <polygon points="50,36 74,48 74,62 50,50" fill="#a855f7" opacity="0.8" />
    <polygon points="50,50 74,62 50,78 26,62" fill="#10b981" opacity="0.8" />
    <polygon points="26,62 26,48 50,36 50,50" fill="#f59e0b" opacity="0.8" />
    <polygon points="26,48 26,34 50,22 50,36" fill="#ec4899" opacity="0.8" />
  </svg>
);

// Pastel palette matched to the reference architecture diagram
const PALETTE = {
  teal: '#14b8a6',
  orange: '#f97316',
  green: '#22c55e',
  gold: '#eab308',
  violet: '#8b5cf6',
  blue: '#3b82f6',
};

// Darker shade of each phase color, used for text/icons that need contrast on white
const TEXT_SHADE = {
  teal: '#0f766e',
  orange: '#c2410c',
  green: '#15803d',
  gold: '#a16207',
  violet: '#6d28d9',
  blue: '#1d4ed8',
};

// 6 sectors spanning the 180° arc, 30° each
const SECTORS_DATA = [
  {
    name: 'Service',
    icon: FiSettings,
    color: PALETTE.teal,
    textColor: TEXT_SHADE.teal,
    angleStart: 180,
    angleEnd: 150,
    title: 'Service Operations & Automation',
    desc: 'Provides automated incident control, SLA monitoring, and request dispatching. This layer replaces manual tracking and coordination with intelligent task routing and escalation paths to ensure operational speed.',
    highlights: ['99.9% SLA compliance met', '85% manual tickets eliminated', 'Real-time ticket routing & escalations'],
    capabilities: [
      { name: 'SLA Management', lines: ['SLA', 'Management'], r: 400, angle: 175 },
      { name: 'Incident Control', lines: ['Incident', 'Control'], r: 300, angle: 170 },
      { name: 'Request Handling', lines: ['Request', 'Handling'], r: 395, angle: 160 },
      { name: 'Workflow Automation', lines: ['Workflow', 'Automation'], r: 300, angle: 155 },
    ]
  },
  {
    name: 'App Development',
    icon: FiSmartphone,
    color: PALETTE.orange,
    textColor: TEXT_SHADE.orange,
    angleStart: 150,
    angleEnd: 120,
    title: 'Application Development & Delivery',
    desc: 'Designs and ships cross-platform mobile and web applications end-to-end — from UI/UX to API integration — with a streamlined release pipeline to app stores and production environments.',
    highlights: ['50+ apps shipped to production', 'Seamless API & third-party integrations', 'Pixel-perfect UI/UX design systems'],
    capabilities: [
      { name: 'Cross-Platform Development', lines: ['Cross-Platform', 'Development'], r: 400, angle: 145 },
      { name: 'API Integration', lines: ['API', 'Integration'], r: 300, angle: 140 },
      { name: 'UI/UX Engineering', lines: ['UI/UX', 'Engineering'], r: 395, angle: 130 },
      { name: 'Release Management', lines: ['Release', 'Management'], r: 300, angle: 125 },
    ]
  },
  {
    name: 'Infrastructure',
    icon: FiGitMerge,
    color: PALETTE.green,
    textColor: TEXT_SHADE.green,
    angleStart: 120,
    angleEnd: 90,
    title: 'Infrastructure & Telemetry Control',
    desc: 'Monitors the health and uptime of all services, databases, and third-party APIs. Automatically maps internal software dependencies and provides deep telemetry insights to prevent downtime.',
    highlights: ['99.99% uptime assurance', 'Sub-second anomaly detection', 'Dynamic dependency mapping'],
    capabilities: [
      { name: 'Dependency Mapping', lines: ['Dependency', 'Mapping'], r: 400, angle: 115 },
      { name: 'Uptime Assurance', lines: ['Uptime', 'Assurance'], r: 300, angle: 110 },
      { name: 'Performance Monitoring', lines: ['Performance', 'Monitoring'], r: 395, angle: 100 },
      { name: 'Telemetry Insights', lines: ['Telemetry', 'Insights'], r: 300, angle: 95 },
    ]
  },
  {
    name: 'Security',
    icon: FiLock,
    color: PALETTE.gold,
    textColor: TEXT_SHADE.gold,
    angleStart: 90,
    angleEnd: 60,
    title: 'Security Monitoring & Threat Shield',
    desc: 'Defends your enterprise against evolving threats with continuous access monitoring and automated response protocols that trigger the moment anomalies or leaks are detected.',
    highlights: ['Automated threat containment in <3s', '24/7 credential & access audits', 'Zero-standing-privilege enforcement'],
    capabilities: [
      { name: 'Response Automation', lines: ['Response', 'Automation'], r: 370, angle: 82 },
      { name: 'Access Control', lines: ['Access', 'Control'], r: 300, angle: 68 },
    ]
  },
  {
    name: 'Server',
    icon: FiServer,
    color: PALETTE.violet,
    textColor: TEXT_SHADE.violet,
    angleStart: 60,
    angleEnd: 30,
    title: 'Server Infrastructure & DevOps',
    desc: 'Powers scalable backend infrastructure with containerized deployments, automated CI/CD pipelines, and dynamic load balancing so systems handle growth without manual intervention.',
    highlights: ['Zero-downtime deployments', 'Auto-scaling under peak load', 'Container orchestration at scale'],
    capabilities: [
      { name: 'Kubernetes Orchestration', lines: ['Kubernetes', 'Orchestration'], r: 400, angle: 55 },
      { name: 'DevOps Automation', lines: ['DevOps', 'Automation'], r: 300, angle: 50 },
      { name: 'Auto-Scaling', lines: ['Auto-Scaling'], r: 395, angle: 40 },
      { name: 'Load Balancing', lines: ['Load', 'Balancing'], r: 300, angle: 35 },
    ]
  },
  {
    name: 'Orchestration',
    icon: FiShare2,
    color: PALETTE.blue,
    textColor: TEXT_SHADE.blue,
    angleStart: 30,
    angleEnd: 0,
    title: 'Operations Orchestration & Optimization',
    desc: 'Synthesizes data across all operational layers to optimize workflows. Correlates event streams, drives real-time analytics, and automates resource routing and workload scheduling.',
    highlights: ['Real-time process optimization', 'Unified operational analytics', 'Autonomous workflow coordination'],
    capabilities: [
      { name: 'Operational Optimization', lines: ['Operational', 'Optimization'], r: 390, angle: 22 },
      { name: 'Analytics Engine', lines: ['Analytics', 'Engine'], r: 300, angle: 8 },
    ]
  }
];

// Outer rim labels — one per sector, aligned to that sector's exact center angle
// and colored to match, so the category story reads clearly top-to-bottom.
const OUTER_RIM_LABELS = [
  { name: 'Management',    angle: 165, color: TEXT_SHADE.teal },   // Service
  { name: 'Delivery',      angle: 135, color: TEXT_SHADE.orange }, // App Development
  { name: 'Monitoring',    angle: 105, color: TEXT_SHADE.green },  // Infrastructure
  { name: 'Protection',    angle: 75,  color: TEXT_SHADE.gold },   // Security
  { name: 'Scalability',   angle: 45,  color: TEXT_SHADE.violet }, // Server
  { name: 'Observability', angle: 15,  color: TEXT_SHADE.blue },   // Orchestration
];

const RIM_ARC_R = 480;        // radius of the outer dashed boundary arc — nothing should render past this
const RIM_DOT_R = 478;        // indicator dot sits just inside the arc, never past it
const RIM_LABEL_R = 500;      // label text sits outside the wheel (text only, no connecting line)

export default function OperationalLayers() {
  // Only mount the ScrollStack (Lenis + scroll listeners) on mobile, where it's actually shown
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Geometry parameters
  const cx = 500;
  const cy = 520;
  const rInner = 160;
  const rOuter = 265;

  const makeArcPath = (r1, r2, startAngle, endAngle) => {
    const rad = Math.PI / 180;
    const x1_in = cx + r1 * Math.cos(startAngle * rad);
    const y1_in = cy - r1 * Math.sin(startAngle * rad);
    const x2_in = cx + r1 * Math.cos(endAngle * rad);
    const y2_in = cy - r1 * Math.sin(endAngle * rad);

    const x1_out = cx + r2 * Math.cos(startAngle * rad);
    const y1_out = cy - r2 * Math.sin(startAngle * rad);
    const x2_out = cx + r2 * Math.cos(endAngle * rad);
    const y2_out = cy - r2 * Math.sin(endAngle * rad);

    return `
      M ${x1_in} ${y1_in}
      L ${x1_out} ${y1_out}
      A ${r2} ${r2} 0 0 1 ${x2_out} ${y2_out}
      L ${x2_in} ${y2_in}
      A ${r1} ${r1} 0 0 0 ${x1_in} ${y1_in}
      Z
    `;
  };

  const getCoordinates = (r, angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(angleRad);
    const y = cy - r * Math.sin(angleRad);
    return { x, y };
  };

  const getPercentStyle = (r, angleDeg) => {
    const { x, y } = getCoordinates(r, angleDeg);
    return {
      left: `${(x / 1000) * 100}%`,
      top: `${(y / 580) * 100}%`
    };
  };

  return (
    <div className="op-section">

      {/* 1. Large Centered Visual Radial Diagram */}
      <div className="op-radial-container">

        {/* The Diagram Visual Wrap */}
        <div className="op-diagram-wrap">
          <svg viewBox="0 0 1000 580" className="op-svg-element" shapeRendering="geometricPrecision">
            <defs>
              {/* Gradients */}
              {SECTORS_DATA.map((s, idx) => (
                <linearGradient key={`grad-${idx}`} id={`sector-grad-${idx}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.04} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.20} />
                </linearGradient>
              ))}
            </defs>

            {/* Outer Rim Arc Border */}
            <path
              d={`M ${cx - RIM_ARC_R} ${cy} A ${RIM_ARC_R} ${RIM_ARC_R} 0 0 1 ${cx + RIM_ARC_R} ${cy}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Center Outer Rim Dots — one per sector, matched color, at the sector's exact center angle */}
            {OUTER_RIM_LABELS.map((lbl, idx) => {
              const { x, y } = getCoordinates(RIM_DOT_R, lbl.angle);
              return (
                <circle
                  key={`rim-dot-${idx}`}
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill={lbl.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Static Radial Dividers (inner, between rInner and rOuter — sector wedge borders) */}
            {[180, 150, 120, 90, 60, 30, 0].map((angle, idx) => {
              const { x, y } = getCoordinates(RIM_ARC_R, angle);
              return (
                <line
                  key={`div-${idx}`}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1.2"
                  opacity={0.7}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}


            {/* Radial Sectors */}
            {SECTORS_DATA.map((s, idx) => (
              <path
                key={`sec-path-${idx}`}
                d={makeArcPath(rInner, rOuter, s.angleStart, s.angleEnd)}
                fill={`url(#sector-grad-${idx})`}
                stroke={s.color}
                strokeOpacity={0.3}
                strokeWidth="1.3"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Inner Core (white half circle) */}
            <path
              d={`M ${cx - rInner} ${cy} A ${rInner} ${rInner} 0 0 1 ${cx + rInner} ${cy} Z`}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Core Vertical Divider */}
            <line
              x1={cx}
              y1={cy - 12}
              x2={cx}
              y2={cy - rInner + 10}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Device Side Elements (Left Inner) */}
          <div className="op-inner-device-side">
            <div className="op-side-icons">
              <FiSmartphone className="op-device-icon" title="Mobile" />
              <FiLaptop className="op-device-icon" title="Laptop" />
              <FiMonitor className="op-device-icon" title="Monitor" />
              <FiServer className="op-device-icon" title="Server" />
              <FiDatabase className="op-device-icon" title="Database" />
            </div>
            <span className="op-side-title">Device</span>
          </div>

          {/* Cloud Stack Side Elements (Right Inner) */}
          <div className="op-inner-os-side">
            <div className="op-side-icons op-side-icons--cloud">
              <SiAWSChip className="op-cloud-chip" title="AWS" />
              <SiAzureChip className="op-cloud-chip" title="Microsoft Azure" />
              <SiSupabaseLogo className="op-cloud-logo" title="Supabase" />
              <SiRedisLogo className="op-cloud-logo" title="Redis" />
            </div>
            <span className="op-side-title">Cloud</span>
          </div>

          {/* Dashed ring + Shield Badge at bottom center */}
          <div className="op-shield-ring" />
          <div className="op-shield-badge">
            <BotivateShieldLogo />
          </div>

          {/* "Operational layers" pill */}
          <div className="op-layers-badge">
            <span>Operational layers</span>
          </div>

          {/* Outer Rim Text Labels — matched 1:1 to sectors, tangential rotation so
              each label reads along the curve of the arc it sits on */}
          {OUTER_RIM_LABELS.map((lbl, idx) => {
            const style = getPercentStyle(RIM_LABEL_R, lbl.angle);
            const rotate = 90 - lbl.angle;
            style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
            style.color = lbl.color;
            return (
              <span
                key={`rim-lbl-${idx}`}
                className="op-rim-label op-rim-label--middle"
                style={style}
              >
                {lbl.name}
              </span>
            );
          })}

          {/* Sectors Labels Overlay */}
          {SECTORS_DATA.map((s, idx) => {
            const Icon = s.icon;
            const midAngle = (s.angleStart + s.angleEnd) / 2;
            const style = getPercentStyle(212, midAngle);

            return (
              <div
                key={`sec-overlay-${idx}`}
                className="op-sector-label-group"
                style={{
                  ...style,
                  '--accent-color': s.color,
                  '--text-color': s.textColor,
                }}
              >
                <span className="op-sector-icon-wrap" style={{ backgroundColor: `${s.color}1a` }}>
                  <Icon className="op-sector-icon" />
                </span>
                <span className="op-sector-name">{s.name}</span>
              </div>
            );
          })}

          {/* Capability Labels Overlay */}
          {SECTORS_DATA.map((s, sIdx) => {
            return s.capabilities.map((cap, cIdx) => {
              const style = getPercentStyle(cap.r, cap.angle);
              return (
                <div
                  key={`cap-${sIdx}-${cIdx}`}
                  className="op-cap-node"
                  style={{
                    ...style,
                    '--dot-color': s.color,
                    '--text-color': s.textColor,
                  }}
                >
                  <span className="op-cap-dot" />
                  <div className="op-cap-text-lines">
                    {cap.lines.map((line, lidx) => (
                      <span key={lidx} className="op-cap-line">{line}</span>
                    ))}
                  </div>
                </div>
              );
            });
          })}

        </div>
      </div>

      {/* Mobile fallback: scroll-driven card stack (radial diagram is hidden below 768px) */}
      <div className="op-mobile-swap">
        {isMobile && (
          <ScrollStack
            className="op-scroll-stack"
            itemDistance={20}
            itemScale={0.045}
            itemStackDistance={38}
            stackPosition="15%"
            scaleEndPosition="8%"
            baseScale={0.82}
            rotationAmount={0}
            blurAmount={1.5}
            useWindowScroll={true}
          >
            {SECTORS_DATA.map((s, idx) => (
              <ScrollStackItem
                key={idx}
                itemClassName="op-swap-card"
                style={{
                  '--card-accent': s.color,
                  background: `linear-gradient(160deg, ${s.color}12, rgba(255, 255, 255, 0.9) 40%)`,
                }}
              >
                <div className="op-swap-card-icon" style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  <s.icon />
                </div>
                <span className="op-swap-card-eyebrow" style={{ color: s.textColor }}>{s.name} Layer</span>
                <h3 className="op-swap-card-title">{s.title}</h3>
                <p className="op-swap-card-desc">{s.desc}</p>
                <div className="op-swap-card-caps">
                  {s.capabilities.map((cap, cidx) => (
                    <span key={cidx} className="op-swap-card-cap-tag" style={{ backgroundColor: `${s.color}12`, color: s.textColor }}>
                      {cap.name}
                    </span>
                  ))}
                </div>
                <div className="op-swap-card-highlights">
                  {s.highlights.map((high, hidx) => (
                    <div key={hidx} className="op-swap-card-highlight">
                      <span className="op-swap-card-highlight-dot" style={{ backgroundColor: s.color }} />
                      <span>{high}</span>
                    </div>
                  ))}
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        )}
      </div>

    </div>
  );
}