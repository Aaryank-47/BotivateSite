import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './WorkflowVisualizer.css';

gsap.registerPlugin(ScrollTrigger);

const NODES = [
  { id: 1, icon: '👤', label: 'Lead Arrives', sub: 'WhatsApp / Form / Call', color: '#2563eb' },
  { id: 2, icon: '🤖', label: 'Diya AI Replies', sub: 'Instant. 24/7. Automatic.', color: '#06b6d4' },
  { id: 3, icon: '📋', label: 'Task Assigned', sub: 'Team notified instantly', color: '#7c3aed' },
  { id: 4, icon: '💬', label: 'Follow-ups Sent', sub: 'Scheduled automatically', color: '#ea580c' },
  { id: 5, icon: '✅', label: 'Deal Closed', sub: 'Payment + invoice auto-sent', color: '#16a34a' },
  { id: 6, icon: '📊', label: 'Report Generated', sub: 'Zero manual effort', color: '#2563eb' },
];

export default function WorkflowVisualizer() {
  const sectionRef  = useRef(null);
  const [activeNode, setActiveNode] = useState(0);
  const nodesRef    = useRef([]);
  const intervalRef = useRef(null);

  // Pause node cycling when section is off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          intervalRef.current = setInterval(
            () => setActiveNode(n => (n + 1) % NODES.length),
            1800
          );
        } else {
          clearInterval(intervalRef.current);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        nodesRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
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

  return (
    <section className="workflow" id="workflow" ref={sectionRef}>
      <div className="workflow-inner container">
        <div className="workflow-header">
          <div className="label">Automation Flow</div>
          <h2 className="section-h">
            From Lead to Revenue,<br />
            <span className="grad">Without Touching Anything.</span>
          </h2>
          <p className="section-p">
            Watch how Botivate handles your entire sales process automatically,
            from the first contact to the final payment.
          </p>
        </div>

        <div className="workflow-track">
          {NODES.map((node, i) => (
            <div key={node.id} className="workflow-step" ref={(el) => (nodesRef.current[i] = el)}>
              {/* Node */}
              <div
                className={`wf-node${activeNode === i ? ' active' : ''}`}
                style={{ '--nc': node.color }}
              >
                <div className="wf-node-icon">{node.icon}</div>
                <div className="wf-node-pulse" />
              </div>

              {/* Label below */}
              <div className="wf-label">
                <span className="wf-title">{node.label}</span>
                <span className="wf-sub">{node.sub}</span>
              </div>

              {/* Connector line (between nodes, not after last) */}
              {i < NODES.length - 1 && (
                <div className={`wf-connector${activeNode > i ? ' passed' : ''}${activeNode === i ? ' active' : ''}`}>
                  <div className="wf-connector-line" />
                  <div className="wf-connector-arrow">›</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="workflow-note">
          <div className="workflow-note-inner">
            <span className="wf-note-icon">⚡</span>
            <span>This entire flow runs automatically with no human intervention required at any step.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
