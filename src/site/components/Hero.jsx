import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './Hero.css';

const BADGE_TEXT = "Central India's No.1 Business Automation Company";

const LABEL_COLORS = {
  Sales: '#2563eb', Production: '#e2761b', HR: '#7c3aed', Maintenance: '#d97706',
  Inventory: '#0891b2', Finance: '#059669', Logistics: '#0284c7', Reports: '#6366f1',
  Orders: '#0ea5e9', Automation: '#10b981',
};

// ── View 1: Sales System (pipeline board) ──
const INITIAL_BOARD = [
  {
    name: 'New Leads', status: 'backlog',
    cards: [
      { id: 'LD-318', title: 'Website enquiry for packaging line', label: 'Sales' },
      { id: 'LD-307', title: 'Meta Ads lead, 12 units required', label: 'Sales', priority: true },
      { id: 'LD-295', title: 'Dealer enquiry via WhatsApp', label: 'Automation' },
    ],
  },
  {
    name: 'Qualified', status: 'todo',
    cards: [
      { id: 'DL-228', title: 'Krishna United, bulk order ready', label: 'Sales', priority: true },
      { id: 'DL-214', title: 'Divine Empire, site visit done', label: 'Sales' },
      { id: 'DL-209', title: 'Mehta Traders, samples approved', label: 'Sales' },
    ],
  },
  {
    name: 'Closing', status: 'inprogress',
    cards: [
      { id: 'DL-243', title: 'Jagwani Group, quotation sent', label: 'Finance', priority: true },
      { id: 'DL-238', title: 'Icy Spicy, annual contract', label: 'Sales' },
    ],
  },
];

// ── View 2: Order to Dispatch (live order tracking) ──
const INITIAL_ORDERS = [
  { id: 'SO-4021', customer: 'Krishna United', stage: 'In Production', amount: '₹8.4L', progress: 55, priority: true },
  { id: 'SO-4019', customer: 'Divine Empire', stage: 'Ready to Dispatch', amount: '₹3.2L', progress: 90, priority: true },
  { id: 'SO-4015', customer: 'Icy Spicy Foods', stage: 'Quality Check', amount: '₹5.7L', progress: 40 },
];

// ── View 3: AI Boardroom (director view) ──
const BOARDROOM_KPIS = [
  { label: 'Pending Approvals', value: '4' },
  { label: 'Delayed Tasks', value: '7' },
  { label: 'Collections Due', value: '₹14L' },
];

const INITIAL_AGENTS = [
  { id: 1, name: 'AI Sales Agent', task: 'Following up 38 open enquiries', status: 'ACTIVE', progress: 72 },
  { id: 2, name: 'AI Follow-up Agent', task: 'Sending payment reminders', status: 'RUNNING', progress: 45 },
  { id: 3, name: 'AI Director Agent', task: "Compiling today's MIS report", status: 'ACTIVE', progress: 88 },
];

const CURSOR_SVG = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.47 2.47a.75.75 0 0 0-.1.97l7.5 13.91a.75.75 0 0 0 1.28.11l2.5-3.32 3.32-2.5a.75.75 0 0 0-.11-1.28L3.44 2.37a.75.75 0 0 0-.97.1z" fill="#111827" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export default function Hero() {
  const leftRef    = useRef(null);
  const wrapRef    = useRef(null);
  const sectionRef = useRef(null);
  const badgeTypedRef = useRef(null);

  // ── State ────────────────────────────────────────────
  const [isVisible,  setIsVisible]  = useState(true);
  const [activeView, setActiveView] = useState('sales'); // 'sales' | 'orders' | 'boardroom'

  // Interactive Data State
  const [boardData, setBoardData] = useState(INITIAL_BOARD);
  const [ordersData, setOrdersData] = useState(INITIAL_ORDERS);
  const [agentsData, setAgentsData] = useState(INITIAL_AGENTS);
  
  // Cursor Animation
  const cursorControls = useAnimation();
  const [showCursor, setShowCursor] = useState(false);

  // ── Typewriter badge ──────────────────────────────────
  useEffect(() => {
    const el = badgeTypedRef.current;
    if (!el) return;
    let rafId, startTime = null;
    const type = (ts) => {
      if (!startTime) startTime = ts;
      const i = Math.min(Math.floor((ts - startTime) / 38), BADGE_TEXT.length);
      el.textContent = BADGE_TEXT.slice(0, i);
      if (i < BADGE_TEXT.length) rafId = requestAnimationFrame(type);
      else el.parentElement?.classList.add('hero-badge--done');
    };
    const t = setTimeout(() => { rafId = requestAnimationFrame(type); }, 500);
    return () => { clearTimeout(t); cancelAnimationFrame(rafId); };
  }, []);

  // ── Pause when hero scrolls out of view ──────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        section.classList.toggle('hero--paused', !e.isIntersecting);
        startTransition(() => setIsVisible(e.isIntersecting));
      },
      { threshold: 0.1 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  // ── Auto-Pilot Sequence ──────────────────────────────
  useEffect(() => {
    let isActive = true;

    // Wait for a layout-stable frame before reading positions
    const waitForLayout = () => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const getTargetPos = (targetId) => {
      if (!wrapRef.current) return null;
      const el = wrapRef.current.querySelector(`[data-target="${targetId}"]`);
      if (!el) return null;
      const containerRect = wrapRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();

      // .hb-stage may be CSS-scaled on short laptop screens (transform: scale(0.85)).
      // getBoundingClientRect() returns post-transform (visual) coords, but the cursor
      // is a child of .hb-stage, so its x/y live in pre-transform (local) coords.
      // Recover the scale (offsetWidth is transform-independent) and divide it out,
      // otherwise the cursor lands ~15% short of every target.
      const scale = (containerRect.width / wrapRef.current.offsetWidth) || 1;

      const centerX = ((rect.left - containerRect.left) + (rect.width / 2)) / scale;
      const centerY = ((rect.top - containerRect.top) + (rect.height / 2)) / scale;
      
      // The tip of the Lucide cursor is at X: 2.47, Y: 2.47 in 24x24 space.
      // Scaled to 36x36 (x1.5), tip is at ~3.7px, 3.7px.
      return {
        x: centerX - 3.7,
        y: centerY - 3.7
      };
    };

    const runAutoPilot = async () => {
      await new Promise(r => setTimeout(r, 800)); // Initial delay
      if (!isActive) return;

      setShowCursor(true);
      // setShowCursor only schedules a render — the cursor motion.div is not
      // mounted/subscribed to cursorControls yet. Wait a layout frame so the
      // controls calls below actually reach the element; otherwise framer-motion
      // drops them and the cursor stays at its initial opacity:0 (invisible).
      await waitForLayout();
      if (!isActive) return;
      // Start cursor off the right edge of the container (not the viewport).
      // Use offsetWidth (transform-independent local px) so the start point is
      // correct even when .hb-stage is CSS-scaled on short laptop screens.
      const startX = wrapRef.current ? wrapRef.current.offsetWidth + 40 : 600;
      await cursorControls.set({ x: startX, y: 120, opacity: 0 });
      await cursorControls.start({ opacity: 1, transition: { duration: 0.3 } });

      const click = async () => {
        await cursorControls.start({ scale: 0.9, transition: { duration: 0.08 } });
        await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });
      };

      const moveTo = async (targetId, duration = 0.6) => {
        await waitForLayout(); // Ensure DOM has settled
        const pos = getTargetPos(targetId);
        if (!pos) return false;
        await cursorControls.start({ x: pos.x, y: pos.y, transition: { duration, ease: 'easeInOut' } });
        // Snap-correct after move in case layout shifted during animation
        await waitForLayout();
        const corrected = getTargetPos(targetId);
        if (corrected && (Math.abs(corrected.x - pos.x) > 3 || Math.abs(corrected.y - pos.y) > 3)) {
          await cursorControls.start({ x: corrected.x, y: corrected.y, transition: { duration: 0.1, ease: 'easeOut' } });
        }
        return true;
      };

      while (isActive) {
        // --- 1. Move a qualified deal into Closing ---
        let success = await moveTo('card-DL-228', 0.8);
        if (!success || !isActive) break;
        await new Promise(r => setTimeout(r, 100));
        await click();
        if (!isActive) break;

        setBoardData(prev => {
          const newBoard = prev.map(col => ({ ...col, cards: [...col.cards] }));
          const qualified = newBoard.find(c => c.status === 'todo');
          const closing = newBoard.find(c => c.status === 'inprogress');
          if (qualified && closing) {
            const idx = qualified.cards.findIndex(c => c.id === 'DL-228');
            if (idx > -1) {
              const [card] = qualified.cards.splice(idx, 1);
              closing.cards.unshift(card);
            }
          }
          return newBoard;
        });
        await new Promise(r => setTimeout(r, 600));

        // --- 2. Go to Order to Dispatch ---
        success = await moveTo('tab-orders', 0.6);
        if (!success || !isActive) break;
        await new Promise(r => setTimeout(r, 100));
        await click();
        if (!isActive) break;
        setActiveView('orders');
        await new Promise(r => setTimeout(r, 400)); // Wait for AnimatePresence
        await waitForLayout(); // Ensure new view is painted

        // --- 3. Dispatch the order that is ready ---
        success = await moveTo('order-SO-4019', 0.5);
        if (!success || !isActive) break;
        await new Promise(r => setTimeout(r, 100));
        await click();
        if (!isActive) break;
        setOrdersData(prev => prev.map(o => o.id === 'SO-4019'
          ? { ...o, stage: 'Dispatched', progress: 100, priority: false } : o));
        await new Promise(r => setTimeout(r, 800));

        // --- 4. Go to AI Boardroom ---
        success = await moveTo('tab-boardroom', 0.6);
        if (!success || !isActive) break;
        await new Promise(r => setTimeout(r, 100));
        await click();
        if (!isActive) break;
        setActiveView('boardroom');
        await new Promise(r => setTimeout(r, 400)); // Wait for AnimatePresence
        await waitForLayout(); // Ensure new view is painted

        // --- 5. Let an AI agent finish its task ---
        success = await moveTo('agent-2', 0.5);
        if (!success || !isActive) break;
        await new Promise(r => setTimeout(r, 100));
        await click();
        if (!isActive) break;
        setAgentsData(prev => prev.map(a => a.id === 2
          ? { ...a, progress: 100, status: 'COMPLETED' } : a));
        await new Promise(r => setTimeout(r, 1500));

        // --- RESET LOOP ---
        await cursorControls.start({ opacity: 0, transition: { duration: 0.3 } });
        if (!isActive) break;
        setActiveView('sales');
        setBoardData(INITIAL_BOARD);
        setOrdersData(INITIAL_ORDERS);
        setAgentsData(INITIAL_AGENTS);
        await new Promise(r => setTimeout(r, 800));
        if (isActive) {
          const resetX = wrapRef.current ? wrapRef.current.offsetWidth + 40 : 600;
          await cursorControls.set({ x: resetX, y: 120 });
          await cursorControls.start({ opacity: 1, transition: { duration: 0.4 } });
        }
      }
    };

    // Start auto-pilot only if on desktop
    if (window.innerWidth > 768) {
      runAutoPilot();
    }

    return () => { isActive = false; };
  }, [cursorControls]);

  // ── Interaction Handlers (Manual Override) ──────────────
  const handleManualMoveCard = (cardId, currentStatus) => {
    setBoardData(prev => {
      const nextMap = { 'backlog': 'todo', 'todo': 'inprogress', 'inprogress': 'todo' };
      const targetStatus = nextMap[currentStatus];
      const newBoard = prev.map(col => ({ ...col, cards: [...col.cards] }));
      const sourceCol = newBoard.find(c => c.status === currentStatus);
      const targetCol = newBoard.find(c => c.status === targetStatus);
      const cardIdx = sourceCol.cards.findIndex(c => c.id === cardId);
      const [card] = sourceCol.cards.splice(cardIdx, 1);
      targetCol.cards.unshift(card);
      return newBoard;
    });
  };

  const handleManualDispatch = (id) => {
    setOrdersData(prev => prev.map(o => {
      if (o.id !== id) return o;
      const progress = Math.min(o.progress + 20, 100);
      return {
        ...o,
        progress,
        stage: progress >= 100 ? 'Dispatched' : o.stage,
        priority: progress >= 100 ? false : o.priority,
      };
    }));
  };

  const handleManualBoostAgent = (id) => {
    setAgentsData(prev => prev.map(a => {
      if (a.id !== id) return a;
      const progress = Math.min(a.progress + 20, 100);
      return { ...a, progress, status: progress >= 100 ? 'COMPLETED' : a.status };
    }));
  };

  // ── Render Views ──────────────────────────────────────
  const renderViewContent = () => {
    if (activeView === 'sales') {
      return (
        <>
          <div className="hb-topbar">
            <span className="hb-crumb">
              <span className="hb-crumb-icon" />Sales System
              <span className="hb-crumb-sep">›</span>Pipeline
            </span>
          </div>
          <div className="hb-tabs">
            <span className="hb-tab is-active">Pipeline</span>
            <span className="hb-tab">This week</span>
            <span className="hb-tab">All deals</span>
            <span className="hb-tab hb-tab--filter">Auto-pilot active</span>
          </div>
          <div className="hb-board">
            {boardData.map((col) => (
              <div className="hb-col" key={col.name}>
                <div className="hb-col-head">
                  <span className={`hb-col-dot hb-col-dot--${col.status}`} />
                  <span className="hb-col-name">{col.name}</span>
                  <span className="hb-col-count">{col.cards.length}</span>
                </div>
                {col.cards.map((card) => (
                  <motion.div 
                    layoutId={`card-${card.id}`}
                    data-target={`card-${card.id}`}
                    className="hb-card" 
                    key={card.id}
                    onClick={() => handleManualMoveCard(card.id, col.status)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="hb-card-top">
                      <span className="hb-card-id">{card.id}</span>
                      {card.priority && <span className="hb-card-pri" />}
                    </div>
                    <div className="hb-card-title">{card.title}</div>
                    <div className="hb-card-foot">
                      <span className="hb-label" style={{ '--lc': LABEL_COLORS[card.label] || '#000' }}>
                        <span className="hb-label-dot" />{card.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </>
      );
    }

    if (activeView === 'orders') {
      return (
        <>
          <div className="hb-topbar">
            <span className="hb-crumb">
              <span className="hb-crumb-icon" />Order to Dispatch
              <span className="hb-crumb-sep">›</span>Active orders
            </span>
          </div>
          <div className="hb-projects">
            <AnimatePresence>
              {ordersData.map(order => {
                const done = order.progress >= 100;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    data-target={`order-${order.id}`}
                    className="hb-project"
                    onClick={() => handleManualDispatch(order.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="hb-project-head">
                      <span className="hb-project-name">
                        {order.customer}
                        <span className="hb-order-id">{order.id}</span>
                      </span>
                      <span className="hb-project-status" style={{
                        color: done ? '#10b981' : '#3b82f6',
                        background: done ? '#dcfce7' : '#eff6ff',
                      }}>
                        {order.stage}
                      </span>
                    </div>
                    <div className="hb-order-meta">
                      <span className="hb-order-amount">{order.amount}</span>
                      <span className="hb-order-pct">{order.progress}%</span>
                    </div>
                    <div className="hb-project-bar-bg">
                      <div className="hb-project-bar-fill" style={{ width: `${order.progress}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      );
    }

    if (activeView === 'boardroom') {
      return (
        <>
          <div className="hb-topbar">
            <span className="hb-crumb">
              <span className="hb-crumb-icon" />AI Boardroom
              <span className="hb-crumb-sep">›</span>Live operations
            </span>
          </div>
          <div className="hb-kpis">
            {BOARDROOM_KPIS.map(kpi => (
              <div className="hb-kpi" key={kpi.label}>
                <span className="hb-kpi-val">{kpi.value}</span>
                <span className="hb-kpi-lbl">{kpi.label}</span>
              </div>
            ))}
          </div>
          <div className="hb-projects hb-agents">
            <AnimatePresence>
              {agentsData.map(agent => {
                const done = agent.status === 'COMPLETED';
                return (
                  <motion.div
                    key={agent.id}
                    layout
                    data-target={`agent-${agent.id}`}
                    className="hb-project"
                    onClick={() => handleManualBoostAgent(agent.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="hb-project-head">
                      <span className="hb-project-name">
                        <span className={`hb-agent-dot ${done ? 'is-done' : ''}`} />
                        {agent.name}
                      </span>
                      <span className="hb-project-status" style={{
                        color: done ? '#10b981' : '#3b82f6',
                        background: done ? '#dcfce7' : '#eff6ff',
                      }}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="hb-agent-task">{agent.task}</div>
                    <div className="hb-project-bar-bg">
                      <div className="hb-project-bar-fill" style={{ width: `${agent.progress}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      );
    }
  };

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-inner container">

        {/* ── Left ── */}
        <div className="hero-left" ref={leftRef}>
          <div className="hero-badge">
            <span className="hero-badge-star">*</span>
            <span ref={badgeTypedRef} />
            <span className="hero-badge-cursor" aria-hidden="true" />
          </div>

          <h1 className="hero-headline">
            Transform Your Entire Business Operations
          </h1>

          <div className="hero-modules">
            <div className="hero-modules-track">
              {[
                'Sales','Purchase','Inventory','Production',
                'Tasks','HR','MIS','Reporting','WhatsApp','AI Agents',
                'Maintenance','Approvals','PC','EA',
                'Sales','Purchase','Inventory','Production',
                'Tasks','HR','MIS','Reporting','WhatsApp','AI Agents',
                'Maintenance','Approvals','PC','EA',
              ].map((label, i) => (
                <span key={`${label}-${i}`} className="hero-module-chip">{label}</span>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary btn-lg">
              Book A Free Business Automation Demo
            </a>
          </div>

          <div className="hero-trust">
            <div className="hero-trust-item">
              <strong>150+</strong><span>Clients Automated</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <strong>98%</strong><span>Retention Rate</span>
            </div>
            <div className="hero-trust-divider" />
            <div className="hero-trust-item">
              <strong>3+ yrs</strong><span>Business Automation</span>
            </div>
          </div>
        </div>

        {/* ── Right: Interactive OS Window ── */}
        <div className="hero-right">

          <div className="hb-stage" ref={wrapRef} aria-hidden="true" style={{ position: 'relative' }}>
            
            {/* Simulated Mouse Cursor */}
            {showCursor && (
              <motion.div 
                className="hb-simulated-cursor"
                initial={{ x: window.innerWidth, y: window.innerHeight / 2, opacity: 0 }}
                animate={cursorControls}
              >
                {CURSOR_SVG}
              </motion.div>
            )}

            <div className="hb-window" style={{ transform: 'none', position: 'relative', opacity: 1 }}>
              <div className="hb-app">

              {/* Sidebar */}
              <aside className="hb-sidebar">
                <div className="hb-org">
                  <span className="hb-org-logo">A</span>
                  <span className="hb-org-name">AutoRocket</span>
                </div>
                <div className="hb-nav">
                  <span className="hb-nav-head">Modules</span>
                  <span
                    className={`hb-nav-item ${activeView === 'sales' ? 'is-active' : ''}`}
                    data-target="tab-sales"
                    onClick={() => setActiveView('sales')}
                  >
                    <span className="hb-i hb-i--team" />Sales System
                  </span>
                  {activeView === 'sales' && (
                    <>
                      <span className="hb-nav-sub is-active">Pipeline</span>
                      <span className="hb-nav-sub">Quotations</span>
                    </>
                  )}
                  <span
                    className={`hb-nav-item ${activeView === 'orders' ? 'is-active' : ''}`}
                    data-target="tab-orders"
                    onClick={() => setActiveView('orders')}
                  >
                    <span className="hb-i hb-i--inbox" />Order to Dispatch
                    {ordersData.some(o => o.progress < 100) && (
                      <span className="hb-count">{ordersData.filter(o => o.progress < 100).length}</span>
                    )}
                  </span>
                  <span
                    className={`hb-nav-item ${activeView === 'boardroom' ? 'is-active' : ''}`}
                    data-target="tab-boardroom"
                    onClick={() => setActiveView('boardroom')}
                  >
                    <span className="hb-i hb-i--mine" />AI Boardroom
                  </span>
                  <span className="hb-nav-head">Operations</span>
                  <span className="hb-nav-item"><span className="hb-i" />Production</span>
                  <span className="hb-nav-item"><span className="hb-i" />Inventory</span>
                  <span className="hb-nav-item"><span className="hb-i" />Maintenance</span>
                  <span className="hb-nav-head">Reports</span>
                  <span className="hb-nav-item"><span className="hb-i" />MIS Dashboard</span>
                </div>
              </aside>

              {/* Main Active View Area */}
              <div className="hb-main">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    {renderViewContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
