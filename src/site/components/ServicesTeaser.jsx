import { Link } from 'react-router-dom';
import { FiZap, FiGrid, FiCpu, FiCode } from 'react-icons/fi';
import './OurServices.css';
import './ServicesTeaser.css';

const HIGHLIGHTS = [
  {
    icon: FiZap,
    color: '#3b82f6',
    wide: true,
    title: 'Business Automation',
    desc: 'Replace WhatsApp and Excel chaos with structured, automated workflows that move on their own.',
  },
  {
    icon: FiGrid,
    color: '#6366f1',
    title: 'AutoRocket',
    desc: 'One platform. Every department. Full visibility for every role, from floor to director.',
  },
  {
    icon: FiCpu,
    color: '#8b5cf6',
    title: 'AI Business Agents',
    desc: 'Intelligent agents built for sales, HR, inventory, and operations, working 24/7 without supervision.',
  },
  {
    icon: FiCode,
    color: '#f59e0b',
    wide: true,
    title: 'Custom System Development',
    desc: 'Systems designed around how your business actually works, not the other way around.',
  },
];

export default function ServicesTeaser() {
  return (
    <section className="svc-section svc-section--teaser" id="services">
      <div className="svc-inner">

        <div className="svc-header st-header">
          <h2 className="svc-headline">
            We Build Systems<br />
            <span className="gradient-text">Around Your Business</span>
          </h2>
          <p className="svc-lead">
            Every solution starts with understanding your operations. We identify where businesses break down and build systems that fix the root cause, not just the symptom.
          </p>
        </div>

        <div className="st-grid">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div
                className={`st-card${h.wide ? ' st-card--wide' : ''}`}
                key={h.title}
                style={{ '--st-color': h.color }}
              >
                <div className="st-card-header">
                  <span className="st-icon-wrap">
                    <Icon size={20} />
                  </span>
                  <h3 className="st-title">{h.title}</h3>
                </div>
                <p className="st-desc">{h.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="st-cta">
          <Link to="/services" className="btn btn-secondary">
            View All Services
          </Link>
        </div>

      </div>
    </section>
  );
}
