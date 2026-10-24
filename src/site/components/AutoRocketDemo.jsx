import { useEffect, useRef, useState, startTransition } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './Hero.css';          // shared window, sidebar, cursor styles
import './HeroPipeline.css';  // pipeline-timeline specific styles

/* ── Real systems + their actual stage flows (dummy work items) ──
   Each system pushes ONE work item through its real approval stages.
   `done` = how many leading stages are already complete on load. */
const SYSTEMS = [
  {
    key: 'dispatch',
    name: 'Order to Dispatch',
    crumb: 'Live order',
    item: { id: 'SO-4021', title: 'Krishna United', meta: '₹8.4L · 120 Box' },
    stages: ['Order Punch', 'Order Approval', 'Production', 'Gate In', 'Make Invoice', 'Dispatch', 'Gate Out'],
    done: 2,
    // one label per active stage (stages.length - done); describes moving forward
    action: ['Move to Gate In', 'Make invoice', 'Check & dispatch', 'Confirm dispatch', 'Confirm Gate Out'],
    finish: 'Order dispatched',
  },
  {
    key: 'purchase',
    name: 'Purchase FMS',
    crumb: 'Live indent',
    item: { id: 'IND-318', title: 'Steel Coils · 8 MT', meta: 'Divine Steels' },
    stages: ['Indent', 'Three-Party Quotes', 'Approval', 'Generate PO', 'Logistics', 'Lab Testing', 'Stock In'],
    done: 2,
    action: ['Generate PO', 'Arrange logistics', 'Send to lab', 'Approve & stock in', 'Confirm stock-in'],
    finish: 'Material stocked in',
  },
  {
    key: 'hr',
    name: 'HR FMS',
    crumb: 'New joining',
    item: { id: 'EMP-209', title: 'Rahul Sharma', meta: 'Sales Executive' },
    stages: ['Enquiry', 'Interview', 'Joining', 'Documentation', 'Attendance Setup', 'Payroll Active'],
    done: 2,
    action: ['Upload documents', 'Setup attendance', 'Activate payroll', 'Complete onboarding'],
    finish: 'Employee onboarded',
  },
];

const CURSOR_SVG = (
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 28.5L8.5 3.5L25.5 20.5L16.5 20.5L16.1 20.6L20 28.5L16.5 30.5L12.5 22.5L12.1 22.5L8.5 28.5Z" fill="#111827" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const CHECK_SVG = (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Self-contained interactive product demo: an OS window that walks a work item
 * through each system's real stages, driven by a simulated cursor (auto-pilot).
 * Drop it anywhere — it owns its own state, cursor and visibility pausing.
 */
export default function AutoRocketDemo() {
  const wrapRef = useRef(null);

  const [sysIdx, setSysIdx] = useState(0);          // active system index
  const [progress, setProgress] = useState(SYSTEMS[0].done); // index of current active stage
  const [showCursor, setShowCursor] = useState(false);
  const cursorControls = useAnimation();

  const system = SYSTEMS[sysIdx];

  // ── Pause animations when off-screen ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { startTransition(() => el.classList.toggle('hero--paused', !e.isIntersecting)); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Auto-pilot ──
  useEffect(() => {
    let isActive = true;

    const waitForLayout = () => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const getTargetPos = (targetId) => {
      if (!wrapRef.current) return null;
      const el = wrapRef.current.querySelector(`[data-target="${targetId}"]`);
      if (!el) return null;
      const containerRect = wrapRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      // .hb-stage may be CSS-scaled on short screens; recover scale via offsetWidth.
      const scale = (containerRect.width / wrapRef.current.offsetWidth) || 1;
      const centerX = ((rect.left - containerRect.left) + rect.width / 2) / scale;
      const centerY = ((rect.top - containerRect.top) + rect.height / 2) / scale;
      return { x: centerX - 9.5, y: centerY - 4 };
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const click = async () => {
      await cursorControls.start({ scale: 0.9, transition: { duration: 0.08 } });
      await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });
    };

    const moveTo = async (targetId, duration = 0.6) => {
      await waitForLayout();
      const pos = getTargetPos(targetId);
      if (!pos) return false;
      await cursorControls.start({ x: pos.x, y: pos.y, transition: { duration, ease: 'easeInOut' } });
      await waitForLayout();
      const corrected = getTargetPos(targetId);
      if (corrected && (Math.abs(corrected.x - pos.x) > 3 || Math.abs(corrected.y - pos.y) > 3)) {
        await cursorControls.start({ x: corrected.x, y: corrected.y, transition: { duration: 0.1, ease: 'easeOut' } });
      }
      return true;
    };

    const run = async () => {
      await sleep(800);
      if (!isActive) return;
      setShowCursor(true);
      await waitForLayout();          // ensure cursor mounted before controls fire
      if (!isActive) return;
      const startX = wrapRef.current ? wrapRef.current.offsetWidth + 40 : 600;
      await cursorControls.set({ x: startX, y: 120, opacity: 0 });
      await cursorControls.start({ opacity: 1, transition: { duration: 0.3 } });

      let i = 0;
      let firstSystem = true;
      while (isActive) {
        const sys = SYSTEMS[i];

        // Switch system via the sidebar (skip the click on the very first show)
        if (!firstSystem) {
          if (!(await moveTo(`tab-${sys.key}`, 0.6)) || !isActive) break;
          await sleep(100);
          await click();
          if (!isActive) break;
        }
        firstSystem = false;
        setSysIdx(i);
        setProgress(sys.done);
        await sleep(500);
        await waitForLayout();

        // Walk the work item through every remaining stage
        let p = sys.done;
        while (p < sys.stages.length && isActive) {
          // the action button completes the active stage and advances one step
          if (!(await moveTo('action-btn', 0.5)) || !isActive) break;
          await sleep(120);
          await click();
          if (!isActive) break;
          p += 1;
          setProgress(p);
          await sleep(700);
        }

        await sleep(1300); // hold on the completed state
        if (!isActive) break;

        i = (i + 1) % SYSTEMS.length;
        if (i === 0) {
          // full loop done — quick fade, reset cursor off-stage, then restart
          await cursorControls.start({ opacity: 0, transition: { duration: 0.3 } });
          if (!isActive) break;
          await sleep(500);
          const rx = wrapRef.current ? wrapRef.current.offsetWidth + 40 : 600;
          await cursorControls.set({ x: rx, y: 120 });
          await cursorControls.start({ opacity: 1, transition: { duration: 0.4 } });
        }
      }
    };

    if (window.innerWidth > 768) run();
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorControls]);

  // ── Manual override (clicking the live button) ──
  const advance = () => {
    setProgress(p => Math.min(p + 1, system.stages.length));
  };
  const switchSystem = (idx) => {
    setSysIdx(idx);
    setProgress(SYSTEMS[idx].done);
  };

  const allDone = progress >= system.stages.length;

  return (
    <div className="hb-stage" ref={wrapRef} aria-hidden="true" style={{ position: 'relative' }}>

      {showCursor && (
        <motion.div className="hb-simulated-cursor" initial={{ opacity: 0 }} animate={cursorControls}>
          {CURSOR_SVG}
        </motion.div>
      )}

      <div className="hb-window">
        <div className="hb-app">

          {/* Sidebar — real systems */}
          <aside className="hb-sidebar">
            <div className="hb-org">
              <span className="hb-org-logo">A</span>
              <span className="hb-org-name">AutoRocket</span>
            </div>
            <div className="hb-nav">
              <span className="hb-nav-head">Systems</span>
              {SYSTEMS.map((s, idx) => (
                <span
                  key={s.key}
                  className={`hb-nav-item ${sysIdx === idx ? 'is-active' : ''}`}
                  data-target={`tab-${s.key}`}
                  onClick={() => switchSystem(idx)}
                >
                  <span className={`hb-i hb-i--${s.key}`} />{s.name}
                </span>
              ))}
              <span className="hb-nav-head">Operations</span>
              <span className="hb-nav-item"><span className="hb-i" />Production</span>
              <span className="hb-nav-item"><span className="hb-i" />Maintenance</span>
              <span className="hb-nav-head">Reports</span>
              <span className="hb-nav-item"><span className="hb-i" />MIS Dashboard</span>
            </div>
          </aside>

          {/* Main — vertical stage timeline */}
          <div className="hb-main">
            <div className="hb-topbar">
              <span className="hb-crumb">
                <span className="hb-crumb-icon" />{system.name}
                <span className="hb-crumb-sep">›</span>{system.crumb}
              </span>
            </div>

            <div className="hp-itembar">
              <span className="hp-live"><span className="hp-live-dot" />Processing</span>
              <span className="hp-item-id">{system.item.id}</span>
              <span className="hp-item-title">{system.item.title}</span>
            </div>

            <div className="hp-flow">
              {system.stages.map((stage, idx) => {
                const state = idx < progress ? 'done' : idx === progress ? 'active' : 'pending';
                const isLast = idx === system.stages.length - 1;
                return (
                  <div className={`hp-row hp-row--${state}`} key={stage}>
                    <div className="hp-rail">
                      <span className={`hp-node hp-node--${state}`}>
                        {state === 'done' && CHECK_SVG}
                      </span>
                      {!isLast && <span className={`hp-line ${idx < progress ? 'is-filled' : ''}`} />}
                    </div>
                    <div className="hp-body">
                      <div className="hp-stage-row">
                        <span className="hp-stage-label">{stage}</span>
                        <span className={`hp-state hp-state--${state}`}>
                          {state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Pending'}
                        </span>
                      </div>

                      {state === 'active' && !allDone && (
                        <motion.div
                          className="hp-card"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="hp-card-meta">
                            <span className="hp-card-title">{system.item.title}</span>
                            <span className="hp-card-sub">{system.item.meta}</span>
                          </div>
                          <button
                            type="button"
                            className="hp-action"
                            data-target="action-btn"
                            onClick={advance}
                          >
                            {system.action[idx - system.done] || 'Approve & continue'}
                            <span className="hp-action-arrow">›</span>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}

              {allDone && (
                <motion.div
                  className="hp-finish"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="hp-finish-check">{CHECK_SVG}</span>
                  {system.finish} · {system.item.id}
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
