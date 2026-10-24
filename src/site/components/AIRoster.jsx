import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiDollarSign, FiActivity, FiUsers,
  FiTrendingUp, FiShoppingCart, FiMonitor,
  FiUser, FiSend
} from 'react-icons/fi';
import './AIRoster.css';

const CHATBOTS = [
  {
    id: 'finance',
    name: 'AI CFO (Chief Financial Officer)',
    dept: 'Financial Strategy & Control',
    Icon: FiDollarSign,
    color: '#f59e0b',
    line: 'Tracks collections, flags overdue payments, and keeps your cash flow visible every single day.',
    expertise: ['Cash Flow', 'Invoice Tracking', 'Payment Reminders', 'Budget Analysis'],
    messages: [
      { type: 'bot', text: 'Outstanding receivables of ₹4.2L are overdue by 30+ days. Want me to send reminders?', time: '10:42 AM' },
      { type: 'user', text: 'Yes, send reminders to all', time: '10:42 AM' },
      { type: 'bot', text: '8 WhatsApp reminders sent. Flagging 3 high-value accounts for escalation to MD.', time: '10:43 AM' },
    ],
  },
  {
    id: 'operations',
    name: 'AI COO (Chief Operating Officer)',
    dept: 'Operations & Efficiency',
    Icon: FiActivity,
    color: '#6366f1',
    line: 'Monitors pending approvals, escalates stuck tasks, and surfaces bottlenecks before they cost you.',
    expertise: ['Approval Monitoring', 'Bottleneck Detection', 'Escalation', 'Alerts'],
    messages: [
      { type: 'bot', text: 'Task #T-214 has been stuck for 3 days with no update. Escalate to HOD?', time: '09:15 AM' },
      { type: 'user', text: 'Yes, escalate and extend deadline by 1 day', time: '09:15 AM' },
      { type: 'bot', text: 'Escalated to Rajesh (HOD). Deadline updated. Alert sent via WhatsApp automatically.', time: '09:16 AM' },
    ],
  },
  {
    id: 'hr',
    name: 'AI HR Head',
    dept: 'People & Culture',
    Icon: FiUsers,
    color: '#a855f7',
    line: 'Analyzes attendance, KPI scores, and team performance and flags issues before they become problems.',
    expertise: ['Attendance', 'KPI Scoring', 'Performance Alerts', 'Leave Management'],
    messages: [
      { type: 'bot', text: '3 team members are absent today without approved leave. Should I send a notice?', time: '09:05 AM' },
      { type: 'user', text: 'Yes, send notice to all three', time: '09:06 AM' },
      { type: 'bot', text: 'Notices sent via WhatsApp. KPI scores updated. Leave records flagged for review.', time: '09:06 AM' },
    ],
  },
  {
    id: 'sales',
    name: 'AI Sales Head',
    dept: 'Revenue Growth & Conversion',
    Icon: FiTrendingUp,
    color: '#3b82f6',
    line: 'Scores every lead, tracks the pipeline, and sends follow-up reminders so no opportunity slips away.',
    expertise: ['Lead Scoring', 'Pipeline Tracking', 'WhatsApp Automation', 'CRM Auto-fill'],
    messages: [
      { type: 'bot', text: "14 open leads haven't been followed up in 48+ hours. Schedule reminders?", time: '11:30 AM' },
      { type: 'user', text: 'Yes, schedule for today at 11 AM', time: '11:30 AM' },
      { type: 'bot', text: '14 WhatsApp follow-up messages queued. High-priority leads flagged for direct call.', time: '11:31 AM' },
    ],
  },
  {
    id: 'procurement',
    name: 'AI Purchase Head',
    dept: 'Vendor & Purchase Management',
    Icon: FiShoppingCart,
    color: '#0ea5e9',
    line: 'Compares vendor quotes, drafts purchase orders, and tracks approvals all without manual follow-up.',
    expertise: ['Vendor Comparison', 'PO Drafting', 'Quote Aggregation', 'Delivery Tracking'],
    messages: [
      { type: 'bot', text: '3 purchase orders worth ₹1.8L are pending approval for 2+ days. Review?', time: '02:10 PM' },
      { type: 'user', text: 'Show the details', time: '02:11 PM' },
      { type: 'bot', text: 'Vendor A ₹72K (Raw Mat.), Vendor B ₹58K (Packaging), Vendor C ₹50K (Spares). Approve all?', time: '02:11 PM' },
    ],
  },
  {
    id: 'director',
    name: 'AI Super Agent',
    dept: 'Executive Strategy & Oversight',
    Icon: FiMonitor,
    color: '#8b5cf6',
    line: 'Consolidates company-wide MIS, surfaces delayed tasks, and briefs the MD daily automatically.',
    expertise: ['MIS Reports', 'Bottleneck Detection', 'Daily Briefings', 'AI Summaries'],
    messages: [
      { type: 'bot', text: "Today's MIS: Revenue ₹8.4L, 5 delayed tasks, 2 pending payments. Score: 78/100.", time: '08:00 AM' },
      { type: 'user', text: 'What needs my attention today?', time: '08:01 AM' },
      { type: 'bot', text: 'Approve 2 payments (₹1.2L), review delayed order P-118, follow up on lead from ABC Corp.', time: '08:01 AM' },
    ],
  },
];

export default function AIRoster() {
  const [currIdx, setCurrIdx] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const currIdxRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const chatBodyRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Clear all pending timeouts when unmounting or switching bots
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Run auto-typing sequence for the current bot
  useEffect(() => {
    clearAllTimeouts();
    const currentBot = CHATBOTS[currIdx];

    // 1. Initial state: Show only the first bot message
    setChatMessages([currentBot.messages[0]]);
    setIsTyping(false);
    setInputValue('');

    // Wait a bit, then start typing user message
    const t1 = setTimeout(() => {
      const userText = currentBot.messages[1].text;
      let charIdx = 0;

      const typeChar = () => {
        if (charIdx < userText.length) {
          setInputValue(userText.substring(0, charIdx + 1));
          charIdx++;
          const typingSpeed = Math.random() * 50 + 40; // 40-90ms per char
          timeoutsRef.current.push(setTimeout(typeChar, typingSpeed));
        } else {
          // Finished typing, wait a moment then "send"
          const t2 = setTimeout(() => {
            setInputValue('');
            setChatMessages(prev => [...prev, currentBot.messages[1]]);
            setIsTyping(true);

            // Wait for bot to "think" then reply
            const t3 = setTimeout(() => {
              setIsTyping(false);
              setChatMessages(prev => [...prev, currentBot.messages[2]]);
            }, 1500);
            timeoutsRef.current.push(t3);

          }, 400);
          timeoutsRef.current.push(t2);
        }
      };

      typeChar();
    }, 1200);

    timeoutsRef.current.push(t1);

    return clearAllTimeouts;
  }, [currIdx]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const transitionTo = useCallback((nextIdx) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setPhase('exiting');
    setTimeout(() => {
      currIdxRef.current = nextIdx;
      setCurrIdx(nextIdx);
      setPhase('entering');
      setTimeout(() => {
        setPhase('idle');
        isAnimatingRef.current = false;
      }, 520);
    }, 360);
  }, []);

  // Increased cycle time to 10s so the typing animation has time to finish
  useEffect(() => {
    const t = setInterval(() => {
      transitionTo((currIdxRef.current + 1) % CHATBOTS.length);
    }, 10000);
    return () => clearInterval(t);
  }, [transitionTo]);

  const bot = CHATBOTS[currIdx];
  const Icon = bot.Icon;

  return (
    <section className="air-section" id="ai-roster">
      <div className="air-wrap">

        {/* ── Left: vertical sling card carousel ── */}
        <div className="air-left">

          <div className="air-left-header">
            <h2 className="air-left-title">
              Meet Your<br />
              <span style={{ color: '#0d0e0fff' }}>AI Workforce.</span>
            </h2>
            <p className="air-left-sub">
              No salary. No leaves. No delays.<br />
              Results across every department, every day.
            </p>
          </div>

          {/* Sling vertical scroll strip */}
          <div className="air-cards-mask">
            <div className="air-cards-track">
              {[...CHATBOTS, ...CHATBOTS].map((b, i) => {
                const BIcon = b.Icon;
                return (
                  <div
                    key={`${b.id}-${i}`}
                    className={`air-card${currIdx === (i % CHATBOTS.length) ? ' air-card--active' : ''}`}
                    style={{ '--c': b.color }}
                    onClick={() => transitionTo(i % CHATBOTS.length)}
                  >
                    <div className="air-card-icon">
                      <BIcon size={18} color="#fff" />
                    </div>
                    <div className="air-card-body">
                      <span className="air-card-name">{b.name}</span>
                      <span className="air-card-dept">{b.dept}</span>
                    </div>
                    <div className="air-card-dot" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: live chat widget ── */}
        <div className="air-right">

          <div className="air-chat-wrapper">
            {/* badge + arrow locked together in one wrapper */}
            <div className="air-chat-label-wrapper">
              <div className="air-chat-label">
                REAL CHATBOT RESPONSES!
              </div>
              <svg className="air-chat-arrow" width="70" height="44" viewBox="0 0 46 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5,8 Q38,0 35,24" stroke="#94a3b8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M24,18 L35,24 L43,18" stroke="#94a3b8" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="air-chat-stage">
              <div
                className={[
                  'air-chat-widget',
                  phase === 'exiting' ? 'air-chat--exit' : '',
                  phase === 'entering' ? 'air-chat--enter' : '',
                ].join(' ').trim()}
                style={{ '--c': bot.color }}
              >
                {/* messages */}
                <div className="air-chat-body" ref={chatBodyRef}>
                  {chatMessages.map((msg, i) =>
                    msg.type === 'bot' ? (
                      <div key={i} className="air-msg air-msg--bot animate-fade-in">
                        <div className="air-msg-avatar" style={{ background: bot.color }}>
                          <Icon size={16} color="#fff" />
                        </div>
                        <div className="air-msg-content">
                          <div className="air-bubble air-bubble--bot">{msg.text}</div>
                          <div className="air-msg-meta">
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="air-msg air-msg--user animate-fade-in">
                        <div className="air-msg-content">
                          <div className="air-bubble air-bubble--user">{msg.text}</div>
                          <div className="air-msg-meta air-msg-meta--user">{msg.time}</div>
                        </div>
                        <div className="air-msg-avatar air-msg-avatar--user">
                          <FiUser size={18} color="#9ca3af" />
                        </div>
                      </div>
                    )
                  )}

                  {/* typing indicator */}
                  {isTyping && (
                    <div className="air-msg air-msg--bot animate-fade-in">
                      <div className="air-msg-avatar" style={{ background: bot.color }}>
                        <Icon size={16} color="#fff" />
                      </div>
                      <div className="air-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  )}
                </div>

                {/* input bar */}
                <div className="air-chat-input">
                  <div className={`air-chat-input-wrapper ${inputValue ? 'is-typing' : ''}`}>
                    <input
                      type="text"
                      className="air-chat-field"
                      placeholder="Ask me anything..."
                      value={inputValue}
                      readOnly
                    />
                    <button type="button" className="air-chat-send" aria-label="Send" disabled={!inputValue.trim()}>
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* dot navigation */}
          <div className="air-dots">
            {CHATBOTS.map((b, i) => (
              <button
                key={b.id}
                className={`air-dot${currIdx === i ? ' is-active' : ''}`}
                onClick={() => transitionTo(i)}
                aria-label={b.name}
                style={{ '--c': b.color }}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
