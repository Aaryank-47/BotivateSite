import './Results.css';

const results = [
  {
    accent: '#0071e3',
    accentEnd: '#06b6d4',
    accentRgb: '0,113,227',
    accentEndRgb: '6,182,212',
    metric: '3×',
    label: 'Faster Sales Conversion',
    description: 'The systems we build keep leads, follow-ups, and quotations moving without delay, so deals close faster than the competition.',
  },
  {
    accent: '#0071e3',
    accentEnd: '#06b6d4',
    accentRgb: '0,113,227',
    accentEndRgb: '6,182,212',
    metric: '70%',
    label: 'Less Time on Operations',
    description: 'We automate the repetitive work, data entry, follow-ups, and reporting, freeing your team for work that actually grows the business.',
  },
  {
    accent: '#0071e3',
    accentEnd: '#06b6d4',
    accentRgb: '0,113,227',
    accentEndRgb: '6,182,212',
    metric: '100%',
    label: 'Full Business Visibility',
    description: 'Every sale, every operation, and every number in one place, updated in real time, so nothing slips through the cracks.',
  },
  {
    accent: '#0071e3',
    accentEnd: '#06b6d4',
    accentRgb: '0,113,227',
    accentEndRgb: '6,182,212',
    metric: '10×',
    label: 'Faster Decision Making',
    description: 'Live data and timely alerts surface what matters before it becomes a problem, so you act on facts, not instinct.',
  },
];

export default function Results() {
  return (
    <section className="results" id="results">
      <div className="results-inner">
        <div className="results-super-card">

          <div className="rsc-top-row">
            <div className="results-header">
              <h2 className="section-title">
                What Our Clients <span className="gradient-text">Achieve</span>
              </h2>
              <p className="section-subtitle">
                These aren't projections. They're real outcomes our clients see
                after working with Botivate.
              </p>
            </div>
          </div>

          <div className="results-grid rsc-grid">
            {results.map((r, i) => (
              <div
                key={i}
                className="rsc-stat-item"
              >
                <div className="result-metric">{r.metric}</div>
                <h3 className="result-label">{r.label}</h3>
                <p className="result-description">{r.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
