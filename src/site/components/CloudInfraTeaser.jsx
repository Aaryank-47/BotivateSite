import { Link } from 'react-router-dom';
import { FiDatabase, FiRefreshCw, FiShield, FiHeadphones } from 'react-icons/fi';
import './OurServices.css';
import './ServicesTeaser.css';

const HIGHLIGHTS = [
  {
    icon: FiDatabase,
    color: '#4f46e5',
    wide: true,
    title: 'Data Migration to Cloud',
    desc: 'Move databases, files, and applications to the cloud with validated, lossless transfers and a full rollback safety net.',
  },
  {
    icon: FiRefreshCw,
    color: '#10b981',
    title: 'Cloud Data Transfer',
    desc: 'Fast, encrypted transfer of large datasets between cloud providers, regions, or from legacy systems.',
  },
  {
    icon: FiShield,
    color: '#dc2626',
    title: 'Cloud Security & Backup',
    desc: 'Encryption, access controls, and automated disaster recovery, so your data is always protected.',
  },
  {
    icon: FiHeadphones,
    color: '#ec4899',
    wide: true,
    title: '24/7 Managed Cloud Support',
    desc: 'We monitor uptime, patch, and scale your infrastructure continuously, so your team can focus on the business.',
  },
];

export default function CloudInfraTeaser() {
  return (
    <section className="svc-section svc-section--teaser" id="cloud-infra" style={{ background: 'var(--bg-secondary)' }}>
      <div className="svc-inner">

        <div className="svc-header st-header">
          <h2 className="svc-headline">
            Cloud Infrastructure,<br />
            <span className="gradient-text">Migrated & Managed For You</span>
          </h2>
          <p className="svc-lead">
            From data migration and secure cloud transfer to architecture, security, and round-the-clock
            support, we handle the full cloud infrastructure lifecycle for your business.
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
          <Link to="/cloud-infra" className="btn btn-secondary">
            Explore Cloud Infra Services
          </Link>
        </div>

      </div>
    </section>
  );
}
