import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiCloud, FiDatabase, FiRefreshCw, FiServer, FiShield,
  FiTrendingUp, FiLock, FiHeadphones, FiChevronRight, FiArrowUpRight,
  FiActivity, FiZap,
} from 'react-icons/fi';

import Orb from './Orb';

// Reuses the Services page design system (bento grid, flip cards, flow
// accordion, stats banner, CTA) so the Cloud Infra page stays visually
// consistent without a second stylesheet.
import './OurServices.css';
import './CloudInfraSLA.css';

gsap.registerPlugin(ScrollTrigger);

// Mounts the WebGL Orb only while its card is on screen (and after first paint),
// so the page navigates instantly instead of spinning up 6 shader contexts at once.
function LazyOrb(props) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer;
    const io = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry.isIntersecting) {
        timer = setTimeout(() => setShow(true), 150);
      } else {
        setShow(false);
      }
    }, { rootMargin: '100px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: '100%' }}>{show && <Orb {...props} />}</div>;
}

const BENTO_CARDS = [
  {
    size: 'double',
    icon: FiCloud,
    title: 'Cloud Migration Strategy',
    desc: 'We audit your current on-premise or legacy setup and build a step-by-step migration roadmap for AWS, Azure, or Google Cloud, with zero disruption to daily operations.',
    badge: 'Migration Planning',
    from: '#0284c7',
    to: '#38bdf8',
    hue: 195,
  },
  {
    size: 'single',
    icon: FiDatabase,
    title: 'Data Migration to Cloud',
    desc: 'Move databases, files, and application data to the cloud with validated, lossless transfers and a full rollback safety net.',
    badge: 'Zero Data Loss',
    from: '#4f46e5',
    to: '#6366f1',
    hue: 250,
  },
  {
    size: 'single',
    icon: FiRefreshCw,
    title: 'Cloud Data Transfer',
    desc: 'High-speed, encrypted transfer of large datasets between cloud providers, regions, or from legacy systems into modern cloud storage.',
    badge: 'Secure Transfer',
    from: '#059669',
    to: '#10b981',
    hue: 150,
  },
  {
    size: 'single',
    icon: FiServer,
    title: 'Cloud Architecture Design',
    desc: 'Scalable, fault-tolerant infrastructure blueprints covering compute, storage, networking, and auto-scaling for your exact workload.',
    badge: 'Infra Design',
    from: '#7c3aed',
    to: '#a855f7',
    hue: 285,
  },
  {
    size: 'single',
    icon: FiShield,
    title: 'Cloud Security & Compliance',
    desc: 'IAM policies, encryption at rest and in transit, and compliance-ready configurations that keep your data protected by default.',
    badge: 'Security First',
    from: '#dc2626',
    to: '#f87171',
    hue: 5,
  },
  {
    size: 'double',
    icon: FiTrendingUp,
    title: 'Cost Optimization & Monitoring',
    desc: 'Right-size resources, eliminate idle spend, and get real-time dashboards tracking usage, performance, and monthly cloud costs.',
    badge: 'Cost Control',
    from: '#d97706',
    to: '#f59e0b',
    hue: 25,
  },
  {
    size: 'single',
    icon: FiLock,
    title: 'Backup & Disaster Recovery',
    desc: 'Automated backup schedules and tested recovery plans so your business keeps running even when something goes wrong.',
    badge: 'Always Recoverable',
    from: '#0f766e',
    to: '#14b8a6',
    hue: 170,
  },
  {
    size: 'single',
    icon: FiHeadphones,
    title: '24/7 Managed Cloud Support',
    desc: 'Our team monitors uptime, patches, and scales your cloud environment continuously, so yours doesn’t have to.',
    badge: 'Always On',
    from: '#be185d',
    to: '#ec4899',
    hue: 330,
  },
];

const STATS = [
  { value: '0 hrs', label: 'Downtime During Migration' },
  { value: '256-bit', label: 'Encryption Standard' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'Infrastructure Monitoring' },
];

const SLA_METRICS = [
  {
    icon: FiActivity,
    color: '#0284c7',
    value: '99.5%+',
    label: 'Uptime SLA',
    desc: 'Guaranteed monthly uptime backed by multi-zone redundancy and automatic failover, with service credits if we ever fall short.',
  },
  {
    icon: FiZap,
    color: '#d97706',
    value: '≤ 4 hrs',
    label: 'Recovery Time Objective (RTO)',
    desc: 'Maximum time to restore full operations after a major incident, validated through regular failover drills.',
  },
  {
    icon: FiDatabase,
    color: '#7c3aed',
    value: '≤ 15 mins',
    label: 'Recovery Point Objective (RPO)',
    desc: 'Maximum possible data-loss window, enforced through continuous backup snapshots and replication.',
  },
  {
    icon: FiHeadphones,
    color: '#059669',
    value: 'Tiered',
    label: 'Fast Incident Resolution',
    desc: '24/7 monitoring with defined severity tiers, so critical issues get attention within minutes, not hours.',
  },
];

const SEVERITY_TIERS = [
  {
    tier: 'Sev 1 — Critical',
    color: '#dc2626',
    meaning: 'Complete system outage or active data-loss risk',
    response: '≤ 15 mins',
    resolution: '≤ 2 hrs',
  },
  {
    tier: 'Sev 2 — Major',
    color: '#d97706',
    meaning: 'Significant performance degradation affecting operations',
    response: '≤ 30 mins',
    resolution: '≤ 4 hrs',
  },
  {
    tier: 'Sev 3 — Minor',
    color: '#0284c7',
    meaning: 'Limited impact issue with a workaround available',
    response: '≤ 2 hrs',
    resolution: '≤ 1 business day',
  },
  {
    tier: 'Sev 4 — General',
    color: '#64748b',
    meaning: 'Non-urgent query, request, or change',
    response: '≤ 1 business day',
    resolution: 'As scheduled',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Infrastructure Assessment & Planning',
    tagline: 'We map your systems before we move a single byte',
    desc: 'Every migration starts with understanding what you already have. We audit your current servers, databases, and applications, flag dependencies and risks, and recommend the right cloud provider and configuration for your workload.',
    deliverables: ['Current Infrastructure Audit', 'Migration Risk Assessment', 'Cloud Provider Recommendation'],
  },
  {
    num: '02',
    title: 'Data Migration & Cloud Data Transfer',
    tagline: 'Every byte accounted for, every transfer verified',
    desc: 'We move your databases, files, and workloads into the cloud in controlled stages, with encrypted transfer channels and checksum verification, so nothing is lost, duplicated, or corrupted along the way.',
    deliverables: ['Staged Data Transfer Plan', 'Checksum-Verified Data Integrity', 'Rollback & Fallback Safety Net'],
  },
  {
    num: '03',
    title: 'Architecture Setup & Security Hardening',
    tagline: 'Built to scale, locked down by default',
    desc: 'We provision your cloud environment with auto-scaling, load balancing, and network segmentation, then lock it down with IAM policies, encryption, and access controls aligned to your compliance needs.',
    deliverables: ['Auto-Scaling Infra Setup', 'IAM & Access Control Policies', 'Encryption & Compliance Configuration'],
  },
  {
    num: '04',
    title: 'Monitoring, Optimization & Ongoing Support',
    tagline: 'We stay on call after go-live',
    desc: 'Once you are live, we keep watching. Continuous uptime monitoring, monthly cost reviews to cut idle spend, and a support desk that responds before small issues become downtime.',
    deliverables: ['24/7 Uptime Monitoring', 'Monthly Cost Optimization Review', 'Priority Incident Support'],
  },
];

export default function CloudInfra() {
  const [activeStep, setActiveStep] = useState('01');

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const bentoRef = useRef(null);
  const statsRef = useRef(null);
  const slaRef = useRef(null);
  const flowRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: 40 },
        { y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none none' } }
      );

      const bentoCards = bentoRef.current?.querySelectorAll('.svc-flip-card');
      if (bentoCards?.length) {
        gsap.fromTo(bentoCards,
          { y: 40, scale: 0.96 },
          {
            y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: bentoRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      }

      const statItems = statsRef.current?.querySelectorAll('.svc-stat-item');
      if (statItems?.length) {
        gsap.fromTo(statItems,
          { scale: 0.9 },
          { scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: statsRef.current, start: 'top 82%', toggleActions: 'play none none none' } }
        );
      }

      const slaCards = slaRef.current?.querySelectorAll('.ci-sla-card');
      if (slaCards?.length) {
        gsap.fromTo(slaCards,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: slaRef.current, start: 'top 82%', toggleActions: 'play none none none' } }
        );
      }

      gsap.fromTo(flowRef.current,
        { y: 30 },
        { y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: flowRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="svc-page" ref={sectionRef}>
      <div className="svc-mesh-bg" />

      <div className="svc-container">
        {/* ── HERO ── */}
        <header className="svc-hero-header" ref={headerRef}>
          <h1 className="svc-main-title">
            Cloud Infrastructure,<br />
            <span className="gradient-text">Migrated & Managed For You</span>
          </h1>
          <p className="svc-hero-lead">
            From legacy servers to secure, scalable cloud environments, we plan the migration,
            transfer your data, and manage the infrastructure, so your team never feels the switch.
          </p>
        </header>

        {/* ── BENTO GRID OF CLOUD SERVICES ── */}
        <section className="svc-bento-section">
          <div className="svc-section-header">
            <h2 className="svc-section-title">Everything You Need To Move To The Cloud</h2>
            <p className="svc-section-desc">
              From data migration and secure transfer to architecture, security, and round-the-clock support,
              we handle the full cloud infrastructure lifecycle.
            </p>
          </div>

          <div className="svc-bento-grid" ref={bentoRef}>
            {BENTO_CARDS.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  className={`svc-flip-card svc-flip-card--${c.size}`}
                  style={{ '--flip-from': c.from, '--flip-to': c.to }}
                >
                  <div className="svc-flip-card-inner">

                    <div className="svc-flip-face svc-flip-face--front">
                      <div className="svc-flip-orb-bg">
                        <LazyOrb hue={c.hue} hoverIntensity={0.35} rotateOnHover backgroundColor="#ffffff" />
                      </div>
                      <div className="svc-flip-front-content">
                        <div className="svc-flip-front-top">
                          <span className="svc-flip-badge">{c.badge}</span>
                          <div className="svc-flip-icon-wrap" style={{ background: c.from }}>
                            <Icon className="svc-flip-icon" />
                          </div>
                        </div>
                        <h3 className="svc-flip-title">{c.title}</h3>
                        <span className="svc-flip-hint">
                          Hover to see detail <FiArrowUpRight />
                        </span>
                      </div>
                    </div>

                    <div className="svc-flip-face svc-flip-face--back">
                      <span className="svc-flip-back-label">{c.badge}</span>
                      <p className="svc-flip-back-desc">{c.desc}</p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── STAT BANNER ── */}
        <section className="svc-stats-banner" ref={statsRef}>
          <div className="svc-stats-grid">
            {STATS.map((s, idx) => (
              <div key={idx} className="svc-stat-item">
                <div className="svc-stat-val">{s.value}</div>
                <div className="svc-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SLA & RELIABILITY COMMITMENTS ── */}
        <section className="ci-sla-section" ref={slaRef}>
          <div className="svc-section-header">
            <h2 className="svc-section-title">Enterprise-Grade SLA You Can Build On</h2>
            <p className="svc-section-desc">
              We run infrastructure for businesses that can’t afford downtime. Our SLA is strict by design:
              high uptime, fast response, and tight recovery windows, backed by a documented service contract.
            </p>
          </div>

          <div className="ci-sla-grid">
            {SLA_METRICS.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="ci-sla-card" style={{ '--ci-sla-color': m.color }}>
                  <div className="ci-sla-icon-wrap">
                    <Icon />
                  </div>
                  <div className="ci-sla-value">{m.value}</div>
                  <div className="ci-sla-label">{m.label}</div>
                  <p className="ci-sla-desc">{m.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="ci-sla-table-wrap">
            <table className="ci-sla-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>What It Means</th>
                  <th>Response Time</th>
                  <th>Resolution Target</th>
                </tr>
              </thead>
              <tbody>
                {SEVERITY_TIERS.map((s, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="ci-sla-severity" style={{ '--ci-sev-color': s.color }}>
                        <span className="ci-sla-severity-dot" />
                        {s.tier}
                      </span>
                    </td>
                    <td>{s.meaning}</td>
                    <td><strong>{s.response}</strong></td>
                    <td><strong>{s.resolution}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="ci-sla-note">
            * SLA terms are formalized in your service agreement and can be tailored to specific
            compliance frameworks (ISO 27001, SOC 2, GDPR) on request. Uptime and recovery figures
            are monitored continuously and reported monthly.
          </p>
        </section>

        {/* ── EXECUTION WORKFLOW ── */}
        <section className="svc-flow-section" ref={flowRef}>
          <div className="svc-section-header">
            <h2 className="svc-section-title">How We Move You To The Cloud</h2>
            <p className="svc-section-desc">
              Cloud migration isn’t a single cutover. It’s a staged process from assessment
              to data transfer to ongoing, managed support.
            </p>
          </div>

          <div className="svc-flow-accordion">
            {WORKFLOW_STEPS.map((step) => {
              const isOpen = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`svc-flow-item ${isOpen ? 'svc-flow-item--open' : ''}`}
                >
                  <button
                    type="button"
                    className="svc-flow-trigger"
                    onClick={() => setActiveStep(step.num)}
                    aria-expanded={isOpen}
                  >
                    <span className="svc-flow-trigger-num">{step.num}</span>
                    <span className="svc-flow-trigger-title">{step.title}</span>
                    <FiChevronRight className="svc-flow-trigger-arrow" />
                  </button>

                  <div className="svc-flow-content-wrap">
                    <div className="svc-flow-content">
                      <div className="svc-flow-liquid-bg" />
                      <div className="svc-flow-grid">
                        <div className="svc-flow-main">
                          <p className="svc-flow-tagline">{step.tagline}</p>
                          <p className="svc-flow-desc">{step.desc}</p>
                        </div>
                        <div className="svc-flow-deliverables">
                          <h4 className="svc-deliv-title">KEY OUTPUTS</h4>
                          <ul className="svc-deliv-list">
                            {step.deliverables.map((d, dIdx) => (
                              <li key={dIdx} className="svc-deliv-item">
                                <span className="svc-deliv-dot" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <footer className="svc-cta-box">
          <div className="svc-cta-mesh" />
          <div className="svc-cta-glow" />
          <div className="svc-cta-inner">
            <h2 className="svc-cta-title">Ready to move to the cloud?</h2>
            <p className="svc-cta-sub">
              Book a free cloud infrastructure audit and get a clear migration roadmap built around your business.
            </p>
            <div className="svc-cta-btns">
              <a href="/#contact" className="svc-cta-signup-btn">Book Free Cloud Audit</a>
              <a href="/#contact" className="btn btn-secondary btn-lg">Talk To Our Team</a>
            </div>
          </div>
        </footer>

      </div>
    </section>
  );
}
