import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ROICalculator.css';

gsap.registerPlugin(ScrollTrigger);

function Slider({ label, min, max, step, value, onChange, format }) {
  return (
    <div className="roi-slider-group">
      <div className="roi-slider-top">
        <span className="roi-slider-label">{label}</span>
        <span className="roi-slider-value">{format(value)}</span>
      </div>
      <div className="roi-slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="roi-range"
          style={{ '--pct': `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      <div className="roi-slider-minmax">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const [employees, setEmployees] = useState(5);
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [avgSalary, setAvgSalary] = useState(25000);

  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Calculations
  const hourlyRate = avgSalary / (4 * 40); // per hour
  const weeklyWaste = employees * hoursPerWeek * hourlyRate;
  const monthlyWaste = weeklyWaste * 4;
  const annualWaste = monthlyWaste * 12;

  const savingsPct = 0.65; // Botivate saves ~65% of wasted time
  const monthlySavings = monthlyWaste * savingsPct;
  const annualSavings = annualWaste * savingsPct;

  const botivateInvestment = 25000; // avg monthly investment
  const roi = ((annualSavings - botivateInvestment * 12) / (botivateInvestment * 12)) * 100;
  const paybackMonths = Math.max(1, Math.round(botivateInvestment / (monthlySavings)));

  const fmt = (n) =>
    n >= 100000
      ? `₹${(n / 100000).toFixed(1)}L`
      : `₹${Math.round(n).toLocaleString('en-IN')}`;

  const fmtHrs = (v) => `${v} hrs/wk`;
  const fmtEmp = (v) => `${v} people`;
  const fmtSal = (v) => `₹${v.toLocaleString('en-IN')}/mo`;

  return (
    <section className="roi-calc" id="roi" ref={sectionRef}>
      <div className="roi-inner">
        <div className="roi-header">
          <span className="section-label">ROI Calculator</span>
          <h2 className="section-title">
            See Exactly How Much <span className="gradient-text">You're Losing</span>
          </h2>
          <p className="section-subtitle">
            Adjust the sliders to match your business. See the real cost of manual
            processes — and how much Botivate saves you.
          </p>
        </div>

        <div className="roi-card" ref={cardRef}>
          {/* Inputs */}
          <div className="roi-inputs">
            <h3 className="roi-inputs-title">Your Business</h3>

            <Slider
              label="People handling manual tasks"
              min={1} max={50} step={1}
              value={employees}
              onChange={setEmployees}
              format={fmtEmp}
            />
            <Slider
              label="Hours/week spent on manual work per person"
              min={2} max={40} step={1}
              value={hoursPerWeek}
              onChange={setHoursPerWeek}
              format={fmtHrs}
            />
            <Slider
              label="Average monthly salary per employee"
              min={10000} max={150000} step={5000}
              value={avgSalary}
              onChange={setAvgSalary}
              format={fmtSal}
            />

            <div className="roi-waste-banner">
              <span>You're currently wasting</span>
              <strong>{fmt(monthlyWaste)}/month</strong>
              <span>on manual tasks</span>
            </div>
          </div>

          {/* Results */}
          <div className="roi-results">
            <div className="roi-results-header">
              <h3>After Botivate</h3>
              <span className="roi-badge">65% time saved</span>
            </div>

            <div className="roi-metrics">
              <div className="roi-metric main">
                <span className="roi-metric-label">Annual Savings</span>
                <span className="roi-metric-value">{fmt(annualSavings)}</span>
              </div>
              <div className="roi-metric">
                <span className="roi-metric-label">Monthly Savings</span>
                <span className="roi-metric-value">{fmt(monthlySavings)}</span>
              </div>
              <div className="roi-metric">
                <span className="roi-metric-label">ROI</span>
                <span className="roi-metric-value">{Math.round(roi)}%</span>
              </div>
              <div className="roi-metric">
                <span className="roi-metric-label">Payback Period</span>
                <span className="roi-metric-value">{paybackMonths} {paybackMonths === 1 ? 'month' : 'months'}</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="roi-compare">
              <div className="roi-compare-row">
                <span>Current cost</span>
                <div className="roi-bar-track">
                  <div className="roi-bar red" style={{ width: '100%' }} />
                </div>
                <span className="roi-bar-amount">{fmt(annualWaste)}/yr</span>
              </div>
              <div className="roi-compare-row">
                <span>With Botivate</span>
                <div className="roi-bar-track">
                  <div className="roi-bar green" style={{ width: `${(1 - savingsPct) * 100}%` }} />
                </div>
                <span className="roi-bar-amount">{fmt(annualWaste - annualSavings)}/yr</span>
              </div>
            </div>

            <a
              href={`https://wa.me/918871527519?text=Hi%20Botivate%2C%20I%20want%20to%20see%20how%20I%20can%20save%20${encodeURIComponent(fmt(annualSavings))}%20annually%20with%20automation.`}
              target="_blank"
              rel="noreferrer"
              className="roi-cta"
            >
              Save {fmt(annualSavings)} This Year →
            </a>

            <p className="roi-disclaimer">
              * Estimates based on 65% average time saved by Botivate clients. Actual results may vary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
