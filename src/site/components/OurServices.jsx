import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiZap, FiGrid, FiCpu, FiBarChart2,
  FiCode, FiUsers, FiCompass, FiRefreshCw, FiChevronRight, FiArrowUpRight,
} from 'react-icons/fi';

import imgGrowth from '../assets/built_for_growth.png';
import imgOutcomes from '../assets/meaningful_outcomes.png';
import imgInnovation from '../assets/innovation_works.png';

import CardSwap, { Card } from './CardSwap';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import Orb from './Orb';
import OperationalLayers from './OperationalLayers';

import './OurServices.css';

gsap.registerPlugin(ScrollTrigger);

const SHOWCASE_CARDS = [
  {
    color: '#3b82f6',
    icon: FiZap,
    title: 'Business Automation',
    desc: 'We replace manual Excel, email, and WhatsApp tasks with automated workflows.',
    visual: (
      <div className="svc-bento-visual svc-visual-flow">
        <div className="svc-flow-node">Excel</div>
        <div className="svc-flow-connector">{"──>"}</div>
        <div className="svc-flow-node svc-flow-node--active">Auto</div>
        <div className="svc-flow-connector">{"──>"}</div>
        <div className="svc-flow-node">WhatsApp</div>
      </div>
    )
  },
  {
    color: '#6366f1',
    icon: FiGrid,
    title: 'AutoRocket OS',
    desc: 'We configure and deploy 20+ operations modules as your central business OS.',
    visual: (
      <div className="svc-bento-visual svc-visual-modules">
        <span className="svc-mod-tag">CRM</span>
        <span className="svc-mod-tag">Inventory</span>
        <span className="svc-mod-tag">HRMS</span>
        <span className="svc-mod-tag">Finance</span>
      </div>
    )
  },
  {
    color: '#10b981',
    icon: FiBarChart2,
    title: 'MIS & Reporting',
    desc: 'We build real-time dashboards for complete visibility on bottlenecks.',
    visual: (
      <div className="svc-bento-visual svc-visual-charts">
        <div className="svc-chart-bar" style={{ '--h': '40%' }} />
        <div className="svc-chart-bar svc-chart-bar--active" style={{ '--h': '85%' }} />
        <div className="svc-chart-bar" style={{ '--h': '60%' }} />
      </div>
    )
  },
  {
    color: '#8b5cf6',
    icon: FiCpu,
    title: 'AI Business Agents',
    desc: 'We deploy 24/7 intelligent agents to automate customer follow-ups and support.',
    visual: (
      <div className="svc-bento-visual svc-visual-chat">
        <div className="svc-chat-bubble svc-chat-bubble--user">Any delays?</div>
        <div className="svc-chat-bubble svc-chat-bubble--agent">Checking supplier...</div>
      </div>
    )
  },
  {
    color: '#f59e0b',
    icon: FiCode,
    title: 'Custom Development',
    desc: 'We build customized CRM, inventory, and asset management systems from scratch.',
    visual: (
      <div className="svc-bento-visual svc-visual-code">
        <div className="svc-code-line"><span className="svc-code-keyword">const</span> app = <span className="svc-code-keyword">new</span> AutoRocket();</div>
        <div className="svc-code-line">app.deploy(&#123; ai: <span className="svc-code-boolean">true</span> &#125;);</div>
      </div>
    )
  },
  {
    color: '#ec4899',
    icon: FiUsers,
    title: 'Dedicated Teams',
    desc: 'We deploy dedicated frontend, backend, and AI developers to scale your product.',
    visual: (
      <div className="svc-bento-visual svc-visual-team">
        <div className="svc-team-avatar">AI</div>
        <div className="svc-team-avatar">FE</div>
        <div className="svc-team-avatar">BE</div>
      </div>
    )
  },
  {
    color: '#14b8a6',
    icon: FiCompass,
    title: 'Pilot Consulting',
    desc: 'We audit your ground operations first and prototype solutions within days.',
    visual: (
      <div className="svc-bento-visual svc-visual-audit">
        <div className="svc-audit-step svc-audit-step--done">✓ Audit</div>
        <div className="svc-audit-step svc-audit-step--active">Blueprint</div>
      </div>
    )
  },
  {
    color: '#f97316',
    icon: FiRefreshCw,
    title: 'Continuous Support',
    desc: 'We continuously maintain and expand your operating systems as you grow.',
    visual: (
      <div className="svc-bento-visual svc-visual-support">
        <div className="svc-support-circle" />
        <span className="svc-support-status">● Live Support</span>
      </div>
    )
  }
];

function ShowcaseCardInner({ card }) {
  const Icon = card.icon;
  return (
    <>
      <div className="svc-card-glow" />
      <div className="svc-bento-content">
        <div className="svc-bento-text">
          <div className="svc-bento-icon-wrap">
            <Icon className="svc-bento-icon" />
          </div>
          <h3 className="svc-bento-title">{card.title}</h3>
          <p className="svc-bento-desc">{card.desc}</p>
        </div>
        {card.visual}
      </div>
    </>
  );
}

const BENTO_CARDS = [
  {
    size: 'double',
    icon: FiGrid,
    title: 'Core ERP & Operations Central',
    desc: 'AutoRocket acts as the single source of truth for your entire business. Connect Sales, Purchase, Inventory, Production, and HRMS/Attendance into one central workspace with full management control.',
    badge: 'Core OS',
    from: '#4f46e5',
    to: '#6366f1',
    hue: 250
  },
  {
    size: 'single',
    icon: FiCpu,
    title: 'AI Business Agents',
    desc: 'Intelligent digital agents working 24x7. They automate lead replies, track supplier delays, and trigger warnings before errors occur.',
    badge: 'AI Powered',
    from: '#7c3aed',
    to: '#a855f7',
    hue: 285
  },
  {
    size: 'single',
    icon: FiBarChart2,
    title: 'MIS Management Dashboards',
    desc: 'Live, real-time data visualisations of employee KRAs, factory-floor bottlenecks, and daily financial summaries. Zero manual reports.',
    badge: 'Analytics',
    from: '#059669',
    to: '#10b981',
    hue: 150
  },
  {
    size: 'single',
    icon: FiZap,
    title: 'Custom Workflow & Escalation Builder',
    desc: 'No-code workflow engine that maps your approvals, task handoffs, and escalations paths exactly as your business operates. Customize roles, permissions, and notifications in seconds.',
    badge: 'No Code Engine',
    from: '#d97706',
    to: '#f59e0b',
    hue: 25
  }
];

const COMMITMENTS = [
  {
    num: '01',
    title: 'Built for Growth',
    bg: imgGrowth,
    desc: 'Every solution we create is designed with growth in mind. By combining technical expertise, innovative thinking, and a deep understanding of business objectives, we empower organizations to adapt and scale.'
  },
  {
    num: '02',
    title: 'Meaningful Outcomes',
    bg: imgOutcomes,
    desc: 'We believe technology should do more than solve problems—it should create opportunities. Through innovative solutions, strategic thinking, and seamless execution, we help organizations grow with confidence.'
  },
  {
    num: '03',
    title: 'Innovation That Works',
    bg: imgInnovation,
    desc: 'Innovation should deliver results, not complexity. We combine creativity with practical technology to develop solutions that are easy to adopt, effective to use, and capable of driving meaningful change.'
  }
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Operational Audit & Workflow Mapping',
    tagline: 'We understand your operations first, code second',
    desc: 'Most software fails because it is built without understanding the ground reality. We do not write a single line of code until we fully map your current processes. We sit down with your team, map your manual flows, lead follow-ups, approvals, and inventory systems to find exactly where things slow down.',
    deliverables: ['Detailed Process Flow Diagram', 'Bottleneck & Delay Audit Report', 'Recommended Automation Blueprint']
  },
  {
    num: '02',
    title: 'Tailored Prototyping & Validation',
    tagline: 'See your system run in days, not months',
    desc: 'Instead of making you wait months for a final delivery, we build a functional working prototype of your core modules within days. You and your team get to test it on-ground, ensuring the interface, terminology, and logic perfectly match your team’s actual habits.',
    deliverables: ['Working Interactive Prototype', 'User Feedback Collection & Review', 'Iterative Interface Tuning']
  },
  {
    num: '03',
    title: 'System Deployment & On-Ground Onboarding',
    tagline: 'Hand-holding your team for 100% adoption success',
    desc: 'Deploying software is only 20% of the battle; the rest is adoption. We help you deploy the system and actively train your staff. We hand-hold your managers, factory floor operators, and sales representatives until using the system becomes their daily habit.',
    deliverables: ['Custom User Training Manuals', 'On-Ground/Remote Training Sessions', 'Adoption Analytics Setup']
  },
  {
    num: '04',
    title: 'Evolutive Support & Module Expansion',
    tagline: 'Your system grows alongside your business',
    desc: 'Your business is not static, and your software shouldn’t be either. We stay connected to regularly tune your workflows, add new modules, integrate advanced AI capabilities, and adjust permissions as your organizational structure scales.',
    deliverables: ['Monthly Optimization Audits', 'Ongoing Feature & Module Additions', 'Priority Support Desk']
  }
];

const STATS = [
  { value: '100+', label: 'Businesses Automated' },
  { value: '99%', label: 'Client Satisfaction' },
  { value: '24/7', label: 'Automated Monitoring' },
  { value: '20+', label: 'Ready-to-Deploy Modules' }
];

const SWAP_BREAKPOINTS = [
  { max: 480, width: 230, height: 370, cardDistance: 18, verticalDistance: 15, skewAmount: 2, isMobile: true },
  { max: 640, width: 270, height: 370, cardDistance: 22, verticalDistance: 19, skewAmount: 3, isMobile: true },
  { max: 1024, width: 360, height: 365, cardDistance: 22, verticalDistance: 18, skewAmount: 4, isMobile: false },
  { max: Infinity, width: 440, height: 360, cardDistance: 50, verticalDistance: 45, skewAmount: 4, isMobile: false }
];

function useSwapDims() {
  const getDims = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return SWAP_BREAKPOINTS.find((bp) => w <= bp.max);
  };
  const [dims, setDims] = useState(getDims);

  useEffect(() => {
    const onResize = () => setDims(getDims());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return dims;
}

export default function OurServices() {
  const [activeStep, setActiveStep] = useState('01');
  const swapDims = useSwapDims();

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const bentoOldRef = useRef(null);
  const commitsRef = useRef(null);
  const statsRef = useRef(null);
  const flowRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo(headerRef.current,
        { y: 40 },
        { y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none none' } }
      );

      // Core Modules Bento Animation
      const oldBentoCards = bentoOldRef.current?.querySelectorAll('.svc-flip-card');
      if (oldBentoCards?.length) {
        gsap.fromTo(oldBentoCards,
          { y: 40, scale: 0.96 },
          {
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bentoOldRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Commitments Animation
      const commitCards = commitsRef.current?.querySelectorAll('.svc-commit-card');
      if (commitCards?.length) {
        gsap.fromTo(commitCards,
          { y: 30 },
          { y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: commitsRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
        );
      }

      // Stats Animation
      const statItems = statsRef.current?.querySelectorAll('.svc-stat-item');
      if (statItems?.length) {
        gsap.fromTo(statItems,
          { scale: 0.9 },
          { scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)',
            scrollTrigger: { trigger: statsRef.current, start: 'top 82%', toggleActions: 'play none none none' } }
        );
      }

      // Flow Accordion Animation
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
        {/* ── 1. HERO HEADER ── */}
        <header className="svc-hero-header" ref={headerRef}>
          <h1 className="svc-main-title">
            Building Solutions That<br />
            <span className="gradient-text">Create Real Impact</span>
          </h1>
          <p className="svc-hero-lead">
            We don’t believe in template software. We map your actual ground-level processes, identify bottlenecks, 
            and implement automated workflows and AI agents that simplify execution, improve transparency, and scale effortlessly.
          </p>
        </header>

        {/* ── 2. SERVICES SHOWCASE (OPERATIONAL LAYERS DIAGRAM) ── */}
        <div className="svc-showcase-section">
          <div className="svc-showcase-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="svc-swap-eyebrow">What We Deliver</span>
            <h2 className="svc-swap-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '0 auto 20px', maxWidth: '640px' }}>
              One Platform, Every <span style={{ color: '#60a5fa' }}>Operational Layer</span>
            </h2>
            <p className="svc-swap-desc" style={{ margin: '0 auto', maxWidth: '680px' }}>
              From daily automation to AI-driven decision support, AutoRocket brings every layer of your
              operations into a single connected system. Explore the operational layers below.
            </p>
          </div>
          
          <OperationalLayers />
        </div>

        {/* ── 2b. COMPLEMENTARY SYSTEMS SHOWCASE (Bento Grid) ── */}
        <section className="svc-bento-section">
          <div className="svc-section-header">
            <h2 className="svc-section-title">The AutoRocket Core Modules</h2>
            <p className="svc-section-desc">
              A comprehensive operations stack with high information density, designed for real-time control.
            </p>
          </div>

          <div className="svc-bento-grid" ref={bentoOldRef}>
            {BENTO_CARDS.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  className={`svc-flip-card svc-flip-card--${c.size}`}
                  style={{ '--flip-from': c.from, '--flip-to': c.to }}
                >
                  <div className="svc-flip-card-inner">

                    {/* FRONT: heading */}
                    <div className="svc-flip-face svc-flip-face--front">
                      <div className="svc-flip-orb-bg">
                        <Orb hue={c.hue} hoverIntensity={0.35} rotateOnHover backgroundColor="#ffffff" />
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

                    {/* BACK: description */}
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

        {/* ── 3. CORE COMMITMENTS (IMAGE CARDS) ── */}
        <section className="svc-commitments-section" ref={commitsRef}>
          <div className="svc-section-header">
            <h2 className="svc-section-title">Built for Growth, Engineered for Outcomes</h2>
          </div>
          <div className="svc-commitments-grid">
            {COMMITMENTS.map((c, idx) => (
              <div key={idx} className="svc-commit-card">
                <div className="svc-commit-bg" style={{ backgroundImage: `url(${c.bg})` }} />
                <div className="svc-commit-overlay" />
                <div className="svc-commit-content">
                  <h3 className="svc-commit-card-title">{c.title}</h3>
                  <p className="svc-commit-card-desc">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. STAT COUNTER BANNER ── */}
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

        {/* ── 5. EXECUTION WORKFLOW (ACCORDION) ── */}
        <section className="svc-flow-section" ref={flowRef}>
          <div className="svc-section-header">
            <h2 className="svc-section-title">How We Bring Order To Operations</h2>
            <p className="svc-section-desc">
              Operational transformation isn’t about installing generic software. It’s an iterative process 
              from audit to continuous system evolution.
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

        {/* ── 6. BOTTOM CTA ── */}
        <footer className="svc-cta-box">
          <div className="svc-cta-mesh" />
          <div className="svc-cta-glow" />
          <div className="svc-cta-inner">
            <h2 className="svc-cta-title">Ready to automate your business?</h2>
            <p className="svc-cta-sub">
              Book a free study of your current processes and see how AutoRocket can bring clarity and automation to your team.
            </p>
            <div className="svc-cta-btns">
              <a href="/#contact" className="svc-cta-signup-btn">Book Free Study</a>
              <a href="/#contact" className="btn btn-secondary btn-lg">Talk To Our Team</a>
            </div>
          </div>
        </footer>

      </div>
    </section>
  );
}
