import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './SystemHealthScore.css';

gsap.registerPlugin(ScrollTrigger);

const QUESTIONS = [
  {
    id: 'crm',
    question: 'Do you have a CRM that tracks every lead automatically?',
    yes: 'Your leads are being tracked.',
    no: 'You\'re likely losing leads that never get followed up.',
  },
  {
    id: 'followup',
    question: 'Do follow-ups happen automatically without manual effort?',
    yes: 'Good — no leads fall through the cracks.',
    no: 'Manual follow-ups mean missed opportunities and wasted time.',
  },
  {
    id: 'dashboard',
    question: 'Can you see all key business metrics on a live dashboard right now?',
    yes: 'You have real-time visibility — great.',
    no: 'You\'re making decisions without the full picture.',
  },
  {
    id: 'offline',
    question: 'Could your business run smoothly for a week without you?',
    yes: 'Your business is system-driven, not people-dependent.',
    no: 'You\'re the bottleneck — this caps your growth.',
  },
  {
    id: 'whatsapp',
    question: 'Are WhatsApp inquiries responded to instantly, 24/7?',
    yes: 'You\'re capturing every lead in real time.',
    no: 'Slow responses cost you clients daily.',
  },
  {
    id: 'reports',
    question: 'Do reports generate automatically without manual data entry?',
    yes: 'Your team focuses on growth, not admin.',
    no: 'Manual reporting wastes hours and introduces errors.',
  },
];

const SCORE_LEVELS = [
  { min: 0, max: 1, label: 'Critical', color: '#ef4444', emoji: '🚨', desc: 'Your business is running on people, not systems. Every bottleneck costs you money daily. You need automation urgently.' },
  { min: 2, max: 2, label: 'Weak', color: '#f97316', emoji: '⚠️', desc: 'You have some structure, but manual processes are still killing your growth. Small improvements will have massive impact.' },
  { min: 3, max: 3, label: 'Developing', color: '#eab308', emoji: '📈', desc: 'You\'re moving in the right direction. A few targeted automations could 2x your efficiency quickly.' },
  { min: 4, max: 4, label: 'Good', color: '#3b82f6', emoji: '✅', desc: 'Solid foundation. Optimizing your remaining gaps will unlock the next level of scaling.' },
  { min: 5, max: 5, label: 'Strong', color: '#22c55e', emoji: '💪', desc: 'Great systems in place. Fine-tuning and advanced AI integrations will take you to elite performance.' },
  { min: 6, max: 6, label: 'Elite', color: '#635bff', emoji: '🚀', desc: 'Your business is a well-oiled machine. Consider Botivate for advanced AI and growth optimizations.' },
];

export default function SystemHealthScore() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0 = start, 1..6 = questions, 7 = result
  const [showResult, setShowResult] = useState(false);
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

  const handleAnswer = (answer) => {
    const q = QUESTIONS[step - 1];
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));

    if (step < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const score = Object.values(answers).filter(Boolean).length;
  const level = SCORE_LEVELS.find((l) => score >= l.min && score <= l.max) || SCORE_LEVELS[0];
  const pct = Math.round((score / QUESTIONS.length) * 100);

  const currentQ = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;

  const reset = () => {
    setAnswers({});
    setStep(0);
    setShowResult(false);
  };

  return (
    <section className="health-score" id="health-score" ref={sectionRef}>
      <div className="health-inner">
        <div className="health-header">
          <span className="section-label">Free Assessment</span>
          <h2 className="section-title">
            What's Your <span className="gradient-text">Business Health Score?</span>
          </h2>
          <p className="section-subtitle">
            Answer 6 quick questions and get your personalised business automation
            health score, instantly, for free.
          </p>
        </div>

        <div className="health-card" ref={cardRef}>
          {/* Start screen */}
          {step === 0 && !showResult && (
            <div className="health-start">
              <div className="health-start-icon">🏥</div>
              <h3>Business System Health Check</h3>
              <p>6 quick yes/no questions. Takes 60 seconds. Get your score and a personalised action plan.</p>
              <button className="health-start-btn" onClick={() => setStep(1)}>
                Start Free Assessment
              </button>
            </div>
          )}

          {/* Question screens */}
          {step >= 1 && !showResult && currentQ && (
            <div className="health-question-wrap">
              {/* Progress */}
              <div className="health-progress-bar">
                <div className="health-progress-fill" style={{ width: `${((step - 1) / QUESTIONS.length) * 100}%` }} />
              </div>
              <div className="health-step-label">Question {step} of {QUESTIONS.length}</div>

              <div className="health-question" key={step}>
                <div className="health-q-num">{step}</div>
                <h3>{currentQ.question}</h3>
              </div>

              <div className="health-answers">
                <button className="health-ans yes" onClick={() => handleAnswer(true)}>
                  <span className="health-ans-icon">✅</span>
                  Yes, we have this
                </button>
                <button className="health-ans no" onClick={() => handleAnswer(false)}>
                  <span className="health-ans-icon">❌</span>
                  No, not yet
                </button>
              </div>

              {/* Show insight for previous answer */}
              {step > 1 && (() => {
                const prev = QUESTIONS[step - 2];
                const prevAns = answers[prev?.id];
                if (prev && prevAns !== undefined) {
                  return (
                    <div className={`health-insight ${prevAns ? 'positive' : 'negative'}`}>
                      {prevAns ? prev.yes : prev.no}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Result screen */}
          {showResult && (
            <div className="health-result">
              <div className="health-score-ring" style={{ '--score-color': level.color }}>
                <svg viewBox="0 0 120 120" className="health-ring-svg">
                  <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                  <circle
                    cx="60" cy="60" r="50"
                    stroke={level.color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                  />
                </svg>
                <div className="health-ring-inner">
                  <span className="health-ring-emoji">{level.emoji}</span>
                  <span className="health-ring-pct">{pct}%</span>
                  <span className="health-ring-label" style={{ color: level.color }}>{level.label}</span>
                </div>
              </div>

              <div className="health-result-body">
                <h3>{score}/6 systems in place</h3>
                <p className="health-result-desc">{level.desc}</p>

                <div className="health-breakdown">
                  {QUESTIONS.map((q) => {
                    const ans = answers[q.id];
                    return (
                      <div key={q.id} className={`health-breakdown-item ${ans ? 'yes' : 'no'}`}>
                        <span className="health-breakdown-dot">{ans ? '✅' : '❌'}</span>
                        <span>{q.question}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="health-result-ctas">
                  <a
                    href={`https://wa.me/918871527519?text=Hi%20Botivate%2C%20I%20just%20scored%20${pct}%25%20on%20the%20Business%20Health%20Check.%20I%20want%20to%20improve%20my%20systems.`}
                    target="_blank"
                    rel="noreferrer"
                    className="health-cta-primary"
                  >
                    Get My Action Plan →
                  </a>
                  <button className="health-cta-secondary" onClick={reset}>
                    Retake Assessment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
