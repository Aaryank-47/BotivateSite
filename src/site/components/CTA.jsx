import './CTA.css';

export default function CTA() {
  return (
    <section className="cta" id="contact">

      <div className="cta-bg">
        <div className="cta-bg-zone cta-bg-zone--1" />
        <div className="cta-bg-zone cta-bg-zone--2" />
        <div className="cta-bg-zone cta-bg-zone--3" />
      </div>
      <div className="cta-grid" />

      <div className="cta-content">

        {/* ── Narrative statement ── */}
        <div className="cta-narrative">
          <p className="cta-line cta-line--premise">
            If your business depends on people…
          </p>
          <p className="cta-line cta-line--premise">
            it will always stay limited.
          </p>
          <div className="cta-narrative-sep" />
          <p className="cta-line cta-line--resolution">
            Build systems. Scale faster. Stay in control.
          </p>
        </div>

        {/* Buttons */}
        <div className="cta-buttons">
          <a
            href="https://wa.me/918871527519?text=Hi%20Botivate%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3v5l3 3"
                stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Book Free Demo
          </a>
          <a
            href="https://wa.me/918871527519"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z"
                stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Talk to Expert
          </a>
        </div>

      </div>
    </section>
  );
}
