import './Founder.css';

export default function Founder() {
  return (
    <section className="founder" id="founder">
      <div className="founder-inner">

        {/* ── Editorial card ── */}
        <div className="founder-card">

          {/* ── Main body ── */}
          <div className="founder-body">

            {/* Left — identity */}
            <div className="founder-identity">
              <div className="founder-avatar-ring">
                <img
                  className="founder-avatar"
                  src="/satyendra-tandan.jpg"
                  alt="Satyendra Tandan"
                />
              </div>
              <div className="founder-name-block">
                <span className="founder-name">Satyendra Tandan</span>
                <span className="founder-role">Founder & CEO, Botivate</span>
              </div>
              <p className="founder-bio">
                Built by someone who understands real business struggles, not just technology.
              </p>
            </div>

            {/* Right — quote */}
            <div className="founder-quote-wrap">
              <blockquote className="founder-quote">
                Automation is not about tools. It's about building a system that works
                even when you're not there.
              </blockquote>
              <p className="founder-quote-caption">
                The philosophy behind every system we build at Botivate.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
