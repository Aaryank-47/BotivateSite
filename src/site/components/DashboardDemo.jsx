import { useState, useEffect, useRef, startTransition } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './DashboardDemo.css';

gsap.registerPlugin(ScrollTrigger);

const TABS = ['Sales Pipeline', 'WhatsApp Analytics', 'Operations'];

const DASHBOARDS = {
  'Sales Pipeline': {
    kpis: [
      { label: 'Total Leads', value: '1,284', change: '+18%', up: true },
      { label: 'Qualified', value: '412', change: '+24%', up: true },
      { label: 'Closed Won', value: '138', change: '+31%', up: true },
      { label: 'Revenue', value: '₹48.2L', change: '+22%', up: true },
    ],
    chart: {
      label: 'Monthly Revenue',
      bars: [38, 52, 44, 61, 55, 70, 65, 82, 74, 91, 88, 100],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    feed: [
      { dot: 'green', text: 'New lead from WhatsApp — Rahul Sharma', time: '2m ago' },
      { dot: 'blue', text: 'Follow-up sent automatically to 12 leads', time: '15m ago' },
      { dot: 'green', text: 'Deal closed — Priya Enterprises ₹1.8L', time: '1h ago' },
      { dot: 'orange', text: 'Lead score updated — 3 hot leads flagged', time: '2h ago' },
    ],
  },
  'WhatsApp Analytics': {
    kpis: [
      { label: 'Messages Sent', value: '8,421', change: '+42%', up: true },
      { label: 'Response Rate', value: '94%', change: '+12%', up: true },
      { label: 'Leads Qualified', value: '317', change: '+28%', up: true },
      { label: 'Time Saved', value: '68%', change: '+8%', up: true },
    ],
    chart: {
      label: 'Daily Message Volume',
      bars: [55, 68, 72, 60, 80, 75, 90, 85, 95, 88, 92, 100],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    feed: [
      { dot: 'green', text: 'Diya AI handled 47 inquiries — 0 missed', time: '5m ago' },
      { dot: 'blue', text: 'Broadcast sent to 500 customers', time: '30m ago' },
      { dot: 'green', text: 'Appointment booked via WhatsApp — Arjun K.', time: '1h ago' },
      { dot: 'orange', text: 'Reactivation campaign — 28 responses', time: '3h ago' },
    ],
  },
  'Operations': {
    kpis: [
      { label: 'Tasks Automated', value: '2,140', change: '+55%', up: true },
      { label: 'Errors Reduced', value: '91%', change: '+15%', up: true },
      { label: 'Team Hours Saved', value: '320h', change: '+40%', up: true },
      { label: 'Cost Saved', value: '₹2.4L', change: '+35%', up: true },
    ],
    chart: {
      label: 'Tasks Automated Per Week',
      bars: [30, 42, 38, 55, 50, 65, 60, 75, 72, 85, 88, 100],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    feed: [
      { dot: 'green', text: 'Monthly report generated automatically', time: '1m ago' },
      { dot: 'blue', text: 'Invoice #1042 sent to client', time: '20m ago' },
      { dot: 'green', text: 'Inventory low alert — restocked trigger fired', time: '45m ago' },
      { dot: 'orange', text: 'Payroll workflow completed for 12 employees', time: '2h ago' },
    ],
  },
};

export default function DashboardDemo() {
  const [activeTab, setActiveTab] = useState('Sales Pipeline');
  const [tick, setTick]           = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef  = useRef(null);
  const demoRef     = useRef(null);
  const timerRef    = useRef(null);

  // Pause interval when section is off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => startTransition(() => setIsVisible(entry.isIntersecting)),
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Simulate live data refresh — only when visible
  useEffect(() => {
    if (!isVisible) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(timerRef.current);
  }, [isVisible]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        demoRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
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

  const data = DASHBOARDS[activeTab];

  return (
    <section className="dashboard-demo" id="dashboard" ref={sectionRef}>
      <div className="dashboard-demo-inner">
        <div className="dashboard-header">
          <span className="section-label">Live System Demo</span>
          <h2 className="section-title">
            Your Business, <span className="gradient-text">On One Dashboard</span>
          </h2>
          <p className="section-subtitle">
            This is what your live Botivate dashboard looks like: real-time data,
            automated actions, and complete visibility.
          </p>
        </div>

        {/* Browser Mockup */}
        <div className="browser-wrap" ref={demoRef}>
          <div className="browser-chrome">
            <div className="browser-dots">
              <span /><span /><span />
            </div>
            <div className="browser-url">
              <span className="browser-lock">
                <svg viewBox="0 0 12 14" fill="none" width="10" height="10">
                  <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              app.botivate.in/dashboard
            </div>
            <div className="browser-live">
              <span className="live-dot" />
              LIVE
            </div>
          </div>

          <div className="db-shell">
            {/* Sidebar */}
            <div className="db-sidebar">
              <div className="db-sidebar-logo">B</div>
              {['Dashboard', 'Leads', 'WhatsApp', 'Reports', 'Settings'].map((item) => (
                <div key={item} className="db-sidebar-item">{item[0]}</div>
              ))}
            </div>

            {/* Main content */}
            <div className="db-main">
              {/* Top bar */}
              <div className="db-topbar">
                <div className="db-tabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      className={`db-tab${activeTab === tab ? ' active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="db-topbar-right">
                  <span className="db-refresh-badge">
                    <span className="live-dot small" />
                    Auto-updating
                  </span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="db-kpis">
                {data.kpis.map((kpi) => (
                  <div key={kpi.label} className="db-kpi">
                    <span className="db-kpi-label">{kpi.label}</span>
                    <span className="db-kpi-value">{kpi.value}</span>
                    <span className={`db-kpi-change ${kpi.up ? 'up' : 'down'}`}>{kpi.change}</span>
                  </div>
                ))}
              </div>

              {/* Chart + Feed */}
              <div className="db-content-row">
                {/* Bar Chart */}
                <div className="db-chart-card">
                  <div className="db-chart-title">{data.chart.label}</div>
                  <div className="db-chart">
                    {data.chart.bars.map((h, i) => (
                      <div key={i} className="db-bar-wrap">
                        <div
                          className="db-bar"
                          style={{ '--h': `${h}%` }}
                        />
                        <span className="db-bar-label">{data.chart.months[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="db-feed-card">
                  <div className="db-chart-title">Live Activity</div>
                  <div className="db-feed">
                    {data.feed.map((item, i) => (
                      <div key={`${activeTab}-${i}`} className="db-feed-item">
                        <span className={`db-feed-dot ${item.dot}`} />
                        <div className="db-feed-body">
                          <span className="db-feed-text">{item.text}</span>
                          <span className="db-feed-time">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-cta-row">
          <a href="https://wa.me/918871527519?text=I%20want%20to%20see%20a%20live%20dashboard%20demo" target="_blank" rel="noreferrer" className="btn-primary">
            Get Your Live Dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
