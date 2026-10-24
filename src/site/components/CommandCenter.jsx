import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CommandCenter.css';

gsap.registerPlugin(ScrollTrigger);

const SALES_BARS = [45, 60, 52, 74, 68, 80, 72, 91, 85, 96, 88, 100];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const ALERTS = [
  { type: 'success', msg: 'Lead from WhatsApp — Arjun Sharma qualified', time: '2m' },
  { type: 'info', msg: 'Follow-up batch sent to 28 cold leads', time: '15m' },
  { type: 'success', msg: 'Deal closed — Priya Enterprises ₹1.8L', time: '1h' },
  { type: 'warn', msg: '5 leads idle for 3 days — escalation triggered', time: '2h' },
];

export default function CommandCenter() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="command" id="command" ref={sectionRef}>
      <div className="command-inner container">
        <div className="command-header">
          <div>
            <div className="label">Live Command Center</div>
            <h2 className="section-h">
              Your Entire Business.<br />
              One Control Panel.
            </h2>
          </div>
          <p className="section-p">
            Real-time visibility across sales, operations, and customer
            engagement. All automated, all live, always on.
          </p>
        </div>

        <div className="command-bento" ref={gridRef}>
          {/* Card 1 — Sales chart (large) */}
          <div className="bento-card bento-large">
            <div className="bento-top">
              <div>
                <div className="bento-chip">Sales Pipeline</div>
                <div className="bento-big-num">₹24.8L</div>
                <div className="bento-chg up">↑ 22% this month</div>
              </div>
              <div className="bento-live-badge">
                <span className="bento-live-dot" /> Live
              </div>
            </div>
            <div className="bento-chart">
              {SALES_BARS.map((h, i) => (
                <div key={i} className="bento-chart-col">
                  <div className="bento-chart-bar" style={{ '--bh': `${h}%`, '--di': `${i * 0.04}s` }} />
                  <span className="bento-chart-lbl">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — AI Agent status */}
          <div className="bento-card bento-medium">
            <div className="bento-chip">AI Agents</div>
            <div className="bento-agent-list">
              {[
                { name: 'Diya AI', role: 'WhatsApp Bot', status: 'active', msgs: '847 today' },
                { name: 'Lead Qualifier', role: 'CRM Bot', status: 'active', msgs: '124 qualified' },
                { name: 'Report Bot', role: 'Analytics', status: 'active', msgs: '3 reports' },
              ].map((a) => (
                <div key={a.name} className="bento-agent">
                  <div className="bento-agent-avatar">{a.name[0]}</div>
                  <div className="bento-agent-info">
                    <span className="bento-agent-name">{a.name}</span>
                    <span className="bento-agent-role">{a.role}</span>
                  </div>
                  <div className="bento-agent-right">
                    <span className="bento-status active" />
                    <span className="bento-agent-msgs">{a.msgs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3 — Quick KPIs */}
          <div className="bento-card bento-kpis">
            {[
              { val: '124', lbl: 'Leads', chg: '+18%' },
              { val: '94%', lbl: 'Response Rate', chg: '+12%' },
              { val: '32', lbl: 'Deals Closed', chg: '+31%' },
              { val: '68%', lbl: 'Time Saved', chg: '+8%' },
            ].map((k) => (
              <div key={k.lbl} className="bento-kpi">
                <span className="bento-kpi-val">{k.val}</span>
                <span className="bento-kpi-lbl">{k.lbl}</span>
                <span className="bento-kpi-chg">{k.chg}</span>
              </div>
            ))}
          </div>

          {/* Card 4 — AI Alerts feed */}
          <div className="bento-card bento-alerts">
            <div className="bento-chip">Smart Alerts</div>
            <div className="bento-alert-list">
              {ALERTS.map((a, i) => (
                <div key={i} className={`bento-alert ${a.type}`}>
                  <div className="bento-alert-dot" />
                  <div className="bento-alert-body">
                    <span>{a.msg}</span>
                    <span className="bento-alert-time">{a.time} ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5 — Quota progress */}
          <div className="bento-card bento-progress">
            <div className="bento-chip">Monthly Targets</div>
            {[
              { label: 'Revenue', pct: 84, color: '#2563eb' },
              { label: 'Lead Quota', pct: 91, color: '#06b6d4' },
              { label: 'Task Completion', pct: 96, color: '#16a34a' },
            ].map((p) => (
              <div key={p.label} className="bento-prog-row">
                <div className="bento-prog-top">
                  <span>{p.label}</span>
                  <span style={{ color: p.color }}>{p.pct}%</span>
                </div>
                <div className="bento-prog-track">
                  <div className="bento-prog-fill" style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
