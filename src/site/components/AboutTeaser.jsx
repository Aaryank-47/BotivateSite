import { Link } from 'react-router-dom';
import './AboutUs.css';
import './AboutTeaser.css';

const stats = [
  { stat: '40+',   label: 'Team Members',       desc: 'A growing team united by one purpose' },
  { stat: '100+',  label: 'Businesses Automated', desc: 'Across manufacturing, trading, and services' },
  { stat: '3+',    label: 'Years On the Ground',  desc: 'Studying and solving real business problems' },
];

export default function AboutTeaser() {
  return (
    <section className="about-us about-us--teaser" id="about">
      <div className="about-inner">

        <div className="about-header at-header">
          <h2 className="about-headline">
            Built on the Ground.<br />
            <span className="gradient-text">Powered by Systems.</span>
          </h2>
          <p className="about-lead">
            Botivate was born after years of watching real businesses break down, not from a boardroom, but from factory floors, warehouses, and operations teams. Everything we build solves a problem we have witnessed first-hand.
          </p>
        </div>

        <div className="at-highlights">
          {stats.map((s) => (
            <div key={s.label} className="at-card">
              <div className="at-stat">{s.stat}</div>
              <div className="at-label">{s.label}</div>
              <p className="at-desc">{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
