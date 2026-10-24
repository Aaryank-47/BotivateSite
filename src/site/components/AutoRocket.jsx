import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiZap, FiUsers, FiCpu, FiTrendingUp, FiCheckCircle, FiClock,
  FiSettings, FiActivity, FiArrowRight, FiPhone, FiSmartphone,
  FiShield, FiFileText, FiLayers, FiList, FiGrid, FiBriefcase,
  FiDollarSign, FiMessageSquare, FiAlertCircle, FiFolder,
  FiShoppingCart, FiPackage, FiCalendar, FiInbox, FiMapPin
} from 'react-icons/fi';
import './AutoRocket.css';
import LogoStrip from './LogoStrip';
import AIRoster from './AIRoster';
import AutoRocketDemo from './AutoRocketDemo';
import deliverableIcon from '../assets/icons/deliverable.png';
import dockIcon from '../assets/icons/dock.png';
import financialProfitIcon from '../assets/icons/financial-profit.png';
import jobInterviewIcon from '../assets/icons/job-interview.png';
import reportIcon from '../assets/icons/report.png';
import stampIcon from '../assets/icons/stamp.png';

gsap.registerPlugin(ScrollTrigger);

const AR_NAV_LINKS = [
  { label: 'Modules',      href: '#modules' },
  { label: 'Workflow',     href: '#workflow' },
  { label: 'AI Workforce', href: '#ai-workforce' },
  { label: 'Dashboards',   href: '#dashboards' },
];

function AutoRocketNavbar() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (mobileOpen) return;
      if (Math.abs(y - lastScrollY.current) > 5) {
        setVisible(y < lastScrollY.current || y < 50);
        lastScrollY.current = y;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const scrollTo = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <header className={`ar-nav${visible ? '' : ' ar-nav--hidden'}${scrolled ? ' ar-nav--scrolled' : ''}`}>
      <div className="ar-nav-inner">
        <a href="/autorocket" className="ar-nav-logo">
          <svg width="30" height="30" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="96" height="96" rx="22" fill="#2563EB"/>
            <path d="M48 13 L63 47 L48 40 L33 47 Z" fill="white"/>
            <rect x="34" y="40" width="28" height="32" rx="5" fill="white" opacity="0.55"/>
            <path d="M29 58 L18 80 L36 68 Z" fill="rgba(255,255,255,0.35)"/>
            <path d="M67 58 L78 80 L60 68 Z" fill="rgba(255,255,255,0.35)"/>
            <ellipse cx="48" cy="76" rx="8" ry="11" fill="#FFD166"/>
          </svg>
          <span className="ar-nav-logo-text">
            <span className="ar-nav-logo-auto">Auto</span>Rocket
          </span>
        </a>

        <div className="ar-nav-sep" />

        <nav className="ar-nav-links" aria-label="AutoRocket page navigation">
          {AR_NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="ar-nav-link" onClick={e => scrollTo(e, l.href)}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ar-nav-right">
          <a
            href="https://wa.me/918871527519?text=Hi%20AutoRocket%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
            target="_blank"
            rel="noreferrer"
            className="ar-nav-cta"
          >
            Start Your Business
          </a>
        </div>

        <button
          className={`ar-nav-burger${mobileOpen ? ' is-open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`ar-nav-mobile${mobileOpen ? ' is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="ar-nav-mobile-inner">
          {AR_NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="ar-nav-mobile-link" onClick={e => scrollTo(e, l.href)}>
              {l.label}
            </a>
          ))}
          <div className="ar-nav-mobile-footer">
            <a
              href="https://wa.me/918871527519?text=Hi%20AutoRocket%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
              target="_blank"
              rel="noreferrer"
              className="ar-nav-cta"
            >
              Book Free Demo
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

const MODULES = [
  {
    num: '01',
    title: 'Sales & CRM',
    tagline: 'From lead to order, complete sales visibility.',
    icon: FiZap,
    color: '#5B4CF5',
    items: ['Lead & Enquiry Management', 'Follow-up Tracking', 'Quotation & Order System', 'Sales Performance Dashboard', 'AI Sales Assistant']
  },
  {
    num: '02',
    title: 'Purchase Management',
    tagline: 'Full purchase cycle with approvals and vendor control.',
    icon: FiShoppingCart,
    color: '#5B4CF5',
    items: ['Purchase Requests & PO', 'Approval Workflows', 'Vendor Management', 'Material Tracking', 'Pending Purchase Reports']
  },
  {
    num: '03',
    title: 'Inventory Management',
    tagline: 'Real-time stock visibility and movement control.',
    icon: FiPackage,
    color: '#8B7FFF',
    items: ['Raw Material & Finished Goods', 'Stock Movement History', 'Low Stock Alerts', 'Barcode Integration', 'Inventory Reports']
  },
  {
    num: '04',
    title: 'Production Management',
    tagline: 'Monitor production with complete stage-wise visibility.',
    icon: FiActivity,
    color: '#5B4CF5',
    items: ['Production Planning', 'Resource & Machine Tracking', 'Stage-wise Progress', 'Delay Identification', 'Production Reports']
  },
  {
    num: '05',
    title: 'Maintenance Management',
    tagline: 'Prevent breakdowns before they cause losses.',
    icon: FiSettings,
    color: '#FFD166',
    items: ['Preventive Maintenance', 'Maintenance Scheduling', 'Repair & Machine History', 'Breakdown Analysis', 'Performance Monitoring']
  },
  {
    num: '06',
    title: 'HRMS & Workforce',
    tagline: 'Complete employee lifecycle in one place.',
    icon: FiUsers,
    color: '#5B4CF5',
    items: ['Employee Profiles & Attendance', 'KPI/KRA Tracking', 'Performance Scores', 'Payroll Inputs', 'Employee Activity Reports']
  },
  {
    num: '07',
    title: 'Task Management',
    tagline: 'Every task tracked, every deadline met.',
    icon: FiCheckCircle,
    color: '#5B4CF5',
    items: ['Task Assignment & Delegation', 'Deadlines & Escalation Rules', 'Delayed Task Alerts', 'Progress Tracking', 'Long-term Delegation']
  },
  {
    num: '08',
    title: 'Finance & Approvals',
    tagline: 'Control business spending with structured approvals.',
    icon: FiDollarSign,
    color: '#5B4CF5',
    items: ['Payment Requests', 'Approval Workflows', 'Collection Tracking', 'Petty Cash Management', 'Financial Dashboard']
  },
  {
    num: '09',
    title: 'Service & Complaints',
    tagline: 'Every complaint resolved with complete visibility.',
    icon: FiAlertCircle,
    color: '#FFD166',
    items: ['Complaint Registration', 'Ticket & Service Tracking', 'Status Updates', 'Resolution History', 'Customer Communication']
  },
  {
    num: '10',
    title: 'Assets & Documents',
    tagline: 'Manage business assets and critical records.',
    icon: FiFolder,
    color: '#8B7FFF',
    items: ['Barcode Asset Tracking', 'Document Storage', 'Renewal Alerts', 'Asset History', 'Digital Records']
  },
  {
    num: '11',
    title: 'Lead & Enquiry',
    tagline: 'Capture and qualify leads from all sources automatically.',
    icon: FiInbox,
    color: '#5B4CF5',
    items: ['Multi-channel Lead Capture', 'Auto Assignment', 'Qualification & Scoring', 'Interaction History', 'Conversion Reports']
  },
  {
    num: '12',
    title: 'Order Management System',
    tagline: 'Track orders from confirmation to packing and delivery.',
    icon: FiShoppingCart,
    color: '#8B7FFF',
    items: ['Order Entry & Validation', 'Order Tracking & Status', 'Packing & Dispatch Info', 'Customer Notifications', 'Sales Order Reports']
  },
  {
    num: '13',
    title: 'Payment Systems',
    tagline: 'Automated receipting, payment reminders, and gateways.',
    icon: FiDollarSign,
    color: '#5B4CF5',
    items: ['Invoice Generation', 'Payment Gateway Integration', 'Payment Reminders', 'Automated Receipts', 'Collection Reports']
  },
  {
    num: '14',
    title: 'Finance & Budget',
    tagline: 'Define department budgets and monitor actual spends.',
    icon: FiBriefcase,
    color: '#5B4CF5',
    items: ['Department Budgeting', 'Expense Tracking', 'Variance Analysis', 'Cash Flow Forecast', 'Profitability Reports']
  },
  {
    num: '15',
    title: 'Fixed Asset Management',
    tagline: 'Complete lifecycle and depreciation tracking of assets.',
    icon: FiGrid,
    color: '#FFD166',
    items: ['Asset Registry', 'Depreciation Calculator', 'Asset Allocation & Audit', 'Maintenance Schedules', 'Asset Value Reports']
  },
  {
    num: '16',
    title: 'Service Management',
    tagline: 'Deliver superior after-sales support and AMC tracking.',
    icon: FiActivity,
    color: '#FFD166',
    items: ['AMC & Warranty Records', 'Service Engineer Schedule', 'On-site Service Logs', 'Spare Parts Consumed', 'Feedback Analysis']
  },
  {
    num: '17',
    title: 'Document & Subscriptions',
    tagline: 'Store company policies and track software subscriptions.',
    icon: FiFileText,
    color: '#5B4CF5',
    items: ['Central Policy Storage', 'Subscription Renewal Alerts', 'Access Level Controls', 'Version History', 'Expiry Dashboard']
  },
  {
    num: '18',
    title: 'MIS',
    tagline: 'Executive dashboards and cross-department trends.',
    icon: FiTrendingUp,
    color: '#5B4CF5',
    items: ['Executive KPI Summary', 'Cross-department Trends', 'Profitability Analytics', 'Custom Report Builder', 'AI-generated Insights']
  }
];

// Flow-builder canvas: connected module nodes laid out as a live business workflow.
// x/y are percentages within the canvas (match the SVG connector viewBox 0 0 100 100).
const WF_NODES = [
  { id: 'lead',       label: 'New Lead',    sub: 'Trigger',     icon: FiInbox,        color: '#10b981', x: 11, y: 18, detail: 'Leads from Meta ads, WhatsApp, calls, and your website land here automatically and start the flow.' },
  { id: 'sales',      label: 'Sales / CRM', sub: 'Qualify',     icon: FiTrendingUp,   color: '#2563EB', x: 33, y: 18, detail: 'Enquiries, follow-ups, quotations, and orders tracked with full pipeline visibility and accountability.' },
  { id: 'purchase',   label: 'Purchase',   sub: 'Procure',     icon: FiShoppingCart, color: '#7c3aed', x: 33, y: 50, detail: 'Raise requirements, run vendor approvals, and issue purchase orders without a single manual sheet.' },
  { id: 'inventory',  label: 'Inventory',  sub: 'Stock',       icon: FiPackage,      color: '#06b6d4', x: 50, y: 50, detail: 'Live stock levels, inward and outward movement, and low-stock alerts across every store.' },
  { id: 'production', label: 'Production',  sub: 'Manufacture', icon: FiActivity,     color: '#2563EB', x: 64, y: 18, detail: 'Stage-wise progress, bottleneck alerts, and delay tracking so nothing stalls unnoticed.' },
  { id: 'dispatch',   label: 'Dispatch',   sub: 'Deliver',     icon: FiMapPin,       color: '#2563EB', x: 87, y: 18, detail: 'Packing, dispatch status, and customer notifications triggered the moment goods are ready.' },
  { id: 'payment',    label: 'Payments',   sub: 'Collect',     icon: FiDollarSign,   color: '#f59e0b', x: 87, y: 50, detail: 'Invoices, payment reminders, and collection tracking close the loop on every order.' },
  { id: 'ai',         label: 'AI Agents',  sub: 'Runs across',  icon: FiCpu,          color: '#6366f1', x: 27, y: 86, soft: true, detail: 'A dedicated AI agent for every department, working 24/7 across the entire flow, sales, follow-ups, operations, and more.' },
  { id: 'dashboard',  label: 'Director Dashboard', sub: 'Live MIS', icon: FiGrid,     color: '#0ea5e9', x: 68, y: 86, soft: true, detail: 'Every stage reports in. Pending approvals, delays, production, collections, and team performance, live from anywhere.' },
];

// Main pipeline connectors (animated flow). Same 0..100 coordinate space as node x/y.
const WF_LINKS = [
  'M11,18 L33,18',
  'M33,18 L64,18',
  'M33,18 L33,50',
  'M33,50 L50,50',
  'M50,50 C58,50 60,28 64,18',
  'M64,18 L87,18',
  'M87,18 L87,50',
];

// Secondary "always-on" layer connectors (faint, static): AI runs across, stages report in.
const WF_LAYER_LINKS = [
  'M27,86 L33,18',   // AI Agents -> Sales
  'M27,86 L33,50',   // AI Agents -> Purchase
  'M64,18 L68,86',   // Production -> Dashboard
  'M87,50 L68,86',   // Payments -> Dashboard
];

const AI_CAPABILITIES = [
  {
    title: 'Automate repetitive work',
    desc: 'Smart follow-ups, reminders, task creation, and delegation, handled automatically so your team focuses on what matters.',
    color: '#3b82f6'
  },
  {
    title: 'Real-time intelligence',
    desc: 'Live reporting, data analysis, and business insights delivered directly, making decisions based on facts, not guesswork.',
    color: '#6366f1'
  },
  {
    title: 'WhatsApp & communication',
    desc: 'Customer interaction, support, and internal updates, automated on channels your team already uses.',
    color: '#8b5cf6'
  },
  {
    title: 'Cross-department actions',
    desc: 'AI agents connecting sales, operations, HR, finance, and more into one intelligent automated flow.',
    color: '#10b981'
  }
];

const AI_AGENTS = [
  'Sales AI', 'Follow-up AI', 'Director AI', 'Inventory AI', 'Production AI',
  'Procurement AI', 'Customer Support AI', 'HR AI', 'Finance AI', 'Operations AI',
  'Marketing AI', 'Service AI', 'Custom AI Agent'
];

const AGENT_LOGS = {
  'Sales AI': [
    'Meta Ads lead captured for "Ravi Teja (Raipur)"',
    'AI lead scoring complete: Hot Lead (Score 94/100)',
    'Auto-assigned to CRM pipeline and notified manager'
  ],
  'Follow-up AI': [
    'Checked quotation status for "Ankit Steel Corp"',
    'No response detected since PO draft (48 hours)',
    'Dispatched WhatsApp follow-up reminder at 11:24 AM'
  ],
  'Director AI': [
    'Consolidated executive daily reports (2026-06-03)',
    'Detected production bottleneck in Batch #B-019',
    'Generated daily performance summaries for MD review'
  ],
  'Inventory AI': [
    'Scanned stock level for "Steel Rods 16mm"',
    'Calculated remaining stock below threshold limit',
    'Auto-generated procurement requirement for store HOD'
  ],
  'Production AI': [
    'Monitored stage-wise output efficiency (OEE 78%)',
    'Flagged 4-hour machine delay at Stage 2',
    'Updated batch status to "Delayed" and alerted supervisor'
  ],
  'Procurement AI': [
    'Aggregated monthly vendor quotations for raw copper',
    'Compared pricing, delivery times, and vendor logs',
    'Prepared draft PO #9283 and queued for approval'
  ],
  'Customer Support AI': [
    'Received WhatsApp ticket "Water pump leakage reported"',
    'Identified customer account details & location Raipur',
    'Auto-scheduled local technician appointment for today'
  ],
  'HR AI': [
    'Analyzed monthly check-in times & attendance scores',
    'Identified 2 employees with dropping KPI scores',
    'Queued weekly performance appraisal alerts for HOD'
  ],
  'Finance AI': [
    'Scanned collections pipeline for outstanding invoices',
    'Identified pending payments past due from 3 accounts',
    'Triggered automatic payment reminders to accounts dept'
  ],
  'Operations AI': [
    'Monitored pending approvals across procurement & sales',
    'Identified 12 pending requests older than 24 hours',
    'Escalated delayed purchase requests to director dashboard'
  ],
  'Marketing AI': [
    'Scraped visitor query logs and ad conversion rates',
    'Generated new optimized copy draft for Meta ad campaigns',
    'Updated target audience tags for Chhattisgarh district'
  ],
  'Service AI': [
    'Logged monthly breakdown schedules & maintenance checklists',
    'Sent WhatsApp schedule alert to senior service engineer',
    'Updated machine PM history record for Sagar TMT'
  ],
  'Custom AI Agent': [
    'Running custom workflow rule "Auto-Dispatch Alert"',
    'Verifying payment proof matching invoice value',
    'Fired Slack API webhooks & emailed shipping invoice'
  ]
};

const ROLES = [
  {
    title: 'Employee',
    color: '#5B4CF5',
    items: ['Assigned Tasks & Deadlines', 'Daily Checklist', 'Attendance & Leave', 'KPI Score', 'Pending Activities']
  },
  {
    title: 'HOD / Manager',
    color: '#5B4CF5',
    items: ['Team Performance', 'Delayed Activities', 'Department Reports', 'Pending Approvals', 'Bottleneck Visibility']
  },
  {
    title: 'Director / Owner',
    color: '#8B7FFF',
    items: ['Company Performance', 'Financial Summary', 'Department Health', 'Pending Approvals', 'AI Director Assistant']
  }
];

const ROLES_RICH = [
  {
    level: 1,
    access: 'Personal View',
    title: 'Employee',
    Icon: FiUsers,
    color: '#2563EB',
    desc: 'Focus on your work. The system tells you exactly what to do next.',
    metrics: [
      { value: '8', label: 'Tasks Due' },
      { value: '94%', label: 'Attendance' },
      { value: '82%', label: 'KPI Score' },
    ],
    items: ['Assigned Tasks & Deadlines', 'Daily Checklist', 'Attendance & Leave', 'KPI Performance Score', 'Pending Activities'],
  },
  {
    level: 2,
    access: 'Department View',
    title: 'HOD / Manager',
    Icon: FiBriefcase,
    color: '#7c3aed',
    desc: 'Full department visibility without chasing updates from the team.',
    metrics: [
      { value: '24', label: 'Team Tasks' },
      { value: '3', label: 'Delayed' },
      { value: '91%', label: 'Team KPI' },
    ],
    items: ['Team Performance Overview', 'Delayed & Overdue Activities', 'Department Reports', 'Pending Approvals', 'Bottleneck Visibility'],
  },
  {
    level: 3,
    access: 'Full Business View',
    title: 'Director / Owner',
    Icon: FiShield,
    color: '#FFD166',
    featured: true,
    desc: 'Know what is happening across your entire company, anytime, anywhere.',
    metrics: [
      { value: '₹48L', label: 'Pipeline' },
      { value: '12', label: 'Approvals' },
      { value: '78%', label: 'Ops Score' },
    ],
    items: ['Company-wide Performance', 'Financial Summary & Cash Flow', 'All Department Health', 'Pending Approvals Queue', 'AI Director Assistant'],
  },
];

const TESTIMONIALS = [
  {
    mainText: "Before Botivate, our sales team was tracking everything on WhatsApp and Excel. We had no idea where a lead stood unless we personally called someone.",
    highlight: "Now we can see the full pipeline live, follow-ups happen on their own, and the team is actually accountable for their numbers.",
    name: "Anurag Agarwal",
    role: "Director",
    company: "Krishna United",
    initials: "AA",
    color: "#2563EB"
  },
  {
    mainText: "We tried a couple of other platforms before this. The problem was always the same, too complex and the team just would not use it.",
    highlight: "With AutoRocket the adoption happened within the first week itself. And we started seeing real results very quickly after that.",
    name: "Sumeer Chatri",
    role: "Director",
    company: "Elem",
    initials: "SC",
    color: "#7c3aed"
  },
  {
    mainText: "Running a steel business means juggling purchase, production, inventory and dispatch all at once. Earlier all of this was tracked separately and nobody had the full picture.",
    highlight: "Now everything is connected and I can see what is happening across the business without asking ten different people.",
    name: "Akash Agarwal",
    role: "MD",
    company: "Sagar TMT",
    initials: "AA",
    color: "#059669"
  },
  {
    mainText: "The maintenance module alone has been worth it for us. We used to have machine breakdowns that nobody saw coming.",
    highlight: "Now the team follows a proper schedule, the history is tracked, and incidents have come down noticeably. It has saved us a lot in unexpected downtime.",
    name: "Jaidhish Passary",
    role: "Director",
    company: "Passary Minerals",
    initials: "JP",
    color: "#d97706"
  },
  {
    mainText: "In a hospital environment, coordination between departments is everything. Tasks were getting dropped and follow-ups were inconsistent.",
    highlight: "AutoRocket helped us build a proper system for delegation and tracking. It just runs in the background and keeps the whole team aligned.",
    name: "Dr. Ashish Mohibiya",
    role: "MD",
    company: "SBH Hospital",
    initials: "AM",
    color: "#0891b2"
  },
  {
    mainText: "As a CEO the biggest challenge is knowing what is actually happening versus what people tell you is happening.",
    highlight: "The director dashboard gives me real numbers in real time. I do not have to wait for end-of-day reports that may or may not reflect the ground reality.",
    name: "Pankaj Somani",
    role: "CEO & Director",
    company: "Rama Udyog",
    initials: "PS",
    color: "#c026d3"
  },
  {
    mainText: "We are in a fast-moving category where order management and dispatch tracking need to be tight.",
    highlight: "AutoRocket connected all of it and our response time to customers has improved a lot. The sales team now has full visibility and stops things from slipping.",
    name: "Akash Agarwala",
    role: "Director",
    company: "Zoff Masala",
    initials: "AA",
    color: "#0284c7"
  },
];

const TL_COL1 = [TESTIMONIALS[0], TESTIMONIALS[3], TESTIMONIALS[6]];
const TL_COL2 = [TESTIMONIALS[1], TESTIMONIALS[4]];
const TL_COL3 = [TESTIMONIALS[2], TESTIMONIALS[5]];

const REPORTS = [
  'Employee Performance', 'Department Efficiency', 'Delayed Activities',
  'Inventory Movement', 'Sales Pipeline', 'Production Status',
  'Financial Summary', 'Operational Bottlenecks', 'Overall Business Health'
];

const REPORT_TABS = [
  {
    id: 'sales',
    label: 'Sales Pipeline',
    icon: FiTrendingUp,
    color: '#2563EB',
    kpis: [
      { label: 'Active Leads', value: '127', trend: '+14%', up: true },
      { label: 'Conversion Rate', value: '34%', trend: '+6%', up: true },
      { label: 'Pipeline Value', value: '₹48L', trend: '+22%', up: true },
    ],
    col2Label: 'Stage', col3Label: 'Value',
    tableRows: [
      { name: 'Ravi Sharma', col2: 'Quotation Sent', col3: '₹4.2L', status: 'hot' },
      { name: 'Anita Patel', col2: 'Follow-up Due', col3: '₹1.8L', status: 'warn' },
      { name: 'Mohit Singh', col2: 'Order Confirmed', col3: '₹6.5L', status: 'done' },
      { name: 'Priya Das', col2: 'Demo Scheduled', col3: '₹2.1L', status: 'pending' },
    ],
    insight: '3 high-value leads pending follow-up for more than 2 days.',
    chartBars: [65, 80, 45, 90, 70, 85, 95],
    chartLabel: 'Weekly Lead Flow',
  },
  {
    id: 'production',
    label: 'Production Status',
    icon: FiActivity,
    color: '#10b981',
    kpis: [
      { label: 'OEE Score', value: '78%', trend: '+3%', up: true },
      { label: 'Delayed Orders', value: '4', trend: '-2', up: true },
      { label: 'Output Today', value: '1,240', trend: '+8%', up: true },
    ],
    col2Label: 'Progress', col3Label: 'Completion',
    tableRows: [
      { name: 'Batch #A-041', col2: 'Stage 3 / 5', col3: '87%', status: 'done' },
      { name: 'Batch #A-042', col2: 'Stage 1 / 5', col3: '22%', status: 'pending' },
      { name: 'Batch #B-019', col2: 'Delayed — 4h', col3: '61%', status: 'warn' },
      { name: 'Batch #B-020', col2: 'Quality Check', col3: '95%', status: 'hot' },
    ],
    insight: 'Batch #B-019 delayed by 4 hours — bottleneck identified at Stage 2.',
    chartBars: [72, 78, 65, 82, 79, 74, 78],
    chartLabel: 'Daily OEE %',
  },
  {
    id: 'hr',
    label: 'Employee Performance',
    icon: FiUsers,
    color: '#8b5cf6',
    kpis: [
      { label: 'Avg KPI Score', value: '84%', trend: '+5%', up: true },
      { label: 'Absent Today', value: '3', trend: '-1', up: true },
      { label: 'Tasks Overdue', value: '11', trend: '+4', up: false },
    ],
    col2Label: 'Dept', col3Label: 'KPI Score',
    tableRows: [
      { name: 'Anil Verma', col2: 'Sales', col3: '92%', status: 'done' },
      { name: 'Ritu Joshi', col2: 'Operations', col3: '77%', status: 'pending' },
      { name: 'Karan Mehta', col2: 'Production', col3: '68%', status: 'warn' },
      { name: 'Sonal Tiwari', col2: 'HR', col3: '89%', status: 'done' },
    ],
    insight: '11 tasks overdue — 4 belong to the same department.',
    chartBars: [80, 84, 76, 88, 82, 85, 84],
    chartLabel: 'Avg Team KPI Score',
  },
  {
    id: 'financial',
    label: 'Financial Summary',
    icon: FiDollarSign,
    color: '#f59e0b',
    kpis: [
      { label: 'Collections', value: '₹32L', trend: '+18%', up: true },
      { label: 'Pending Dues', value: '₹14L', trend: '-8%', up: true },
      { label: 'Expenses MTD', value: '₹9.4L', trend: '+3%', up: false },
    ],
    col2Label: 'Due Age', col3Label: 'Amount',
    tableRows: [
      { name: 'Sharma Traders', col2: '15 days', col3: '₹3.2L', status: 'warn' },
      { name: 'Gupta Industries', col2: 'Paid', col3: '₹5.8L', status: 'done' },
      { name: 'Rao & Sons', col2: '32 days', col3: '₹1.4L', status: 'hot' },
      { name: 'Mehta Corp', col2: '7 days', col3: '₹2.6L', status: 'pending' },
    ],
    insight: '₹14L in pending dues — 3 accounts overdue by 30+ days.',
    chartBars: [55, 68, 72, 65, 80, 74, 82],
    chartLabel: 'Weekly Collections',
  },
  {
    id: 'inventory',
    label: 'Inventory Movement',
    icon: FiPackage,
    color: '#06b6d4',
    kpis: [
      { label: 'Turnover Rate', value: '6.2x', trend: '+0.4', up: true },
      { label: 'Low Stock Items', value: '7', trend: '+3', up: false },
      { label: 'Stock Value', value: '₹61L', trend: '+11%', up: true },
    ],
    col2Label: 'Movement', col3Label: 'Balance',
    tableRows: [
      { name: 'Steel Rods 16mm', col2: 'Inward: 200 MT', col3: '840 MT', status: 'done' },
      { name: 'Copper Wire', col2: 'Low Stock', col3: '18 kg', status: 'hot' },
      { name: 'Paint Grade A', col2: 'Outward: 40L', col3: '120 L', status: 'pending' },
      { name: 'Bearings 6205', col2: 'Critical', col3: '6 pcs', status: 'warn' },
    ],
    insight: '7 items below minimum stock level — 2 flagged as critical.',
    chartBars: [60, 72, 58, 80, 76, 69, 82],
    chartLabel: 'Weekly Stock Outward',
  },
  {
    id: 'tasks',
    label: 'Delayed Activities',
    icon: FiAlertCircle,
    color: '#ef4444',
    kpis: [
      { label: 'Overdue Tasks', value: '18', trend: '+5', up: false },
      { label: 'Escalated', value: '4', trend: '+1', up: false },
      { label: 'Resolved Today', value: '12', trend: '+3', up: true },
    ],
    col2Label: 'Department', col3Label: 'Overdue By',
    tableRows: [
      { name: 'Client Followup — ABC Corp', col2: 'Sales', col3: '3 days', status: 'hot' },
      { name: 'Machine PM Schedule', col2: 'Maintenance', col3: '5 days', status: 'warn' },
      { name: 'Invoice Approval', col2: 'Finance', col3: '2 days', status: 'warn' },
      { name: 'Dispatch Confirmation', col2: 'Logistics', col3: '1 day', status: 'pending' },
    ],
    insight: '4 tasks escalated to Director — client deliveries at risk.',
    chartBars: [22, 18, 30, 24, 20, 25, 18],
    chartLabel: 'Daily Overdue Count',
  },
];

const PROBLEM_ITEMS = [
  {
    title: 'Sales',
    desc: 'Tracked on offline Excel sheets, phone calls, and scattered messages, leading to lost leads.',
    icon: financialProfitIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  },
  {
    title: 'HR & Workforce',
    desc: 'Managed on disconnected, offline formats that fail to sync with daily operations.',
    icon: jobInterviewIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  },
  {
    title: 'Task Management',
    desc: 'Assigned verbally or over WhatsApp, creating zero tracking, accountability, or deadlines.',
    icon: deliverableIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  },
  {
    title: 'Inventory',
    desc: 'Maintained in manual sheets, leading to constant stock errors and delayed updates.',
    icon: dockIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  },
  {
    title: 'Approvals',
    desc: 'Happening over phone calls or physical signatures, stalling business velocity.',
    icon: stampIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  },
  {
    title: 'Reports & MIS',
    desc: 'Generated manually from scattered logs, leaving directors with outdated visibility.',
    icon: reportIcon,
    color: '#5B4CF5',
    gradient: 'linear-gradient(135deg, rgba(91, 76, 245, 0.12) 0%, rgba(91, 76, 245, 0.04) 100%)'
  }
];

export default function AutoRocket() {
  const containerRef  = useRef(null);
  const rocketRef     = useRef(null);
  const flameRef      = useRef(null);
  const workflowRef   = useRef(null);
  const modulesRef    = useRef(null);

  const [modulesVisible, setModulesVisible]   = useState(false);
  const [activeTab, setActiveTab] = useState('sales');

  // Visual Redesign State
  const [activeAgentIndex, setActiveAgentIndex] = useState(null);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(2); // Level 3: Director/Owner by default
  const [employeeChecklist, setEmployeeChecklist] = useState([
    { id: 1, label: 'Verify raw material inward logs', checked: true },
    { id: 2, label: 'Submit daily production yield logs', checked: false },
    { id: 3, label: 'Cross-verify PO items with store outward', checked: false },
    { id: 4, label: 'Log WhatsApp enquiry feedback in CRM', checked: true },
  ]);
  const [hodApprovals, setHodApprovals] = useState([
    { id: 1, type: 'Purchase', desc: 'Raw copper wire (180 kg)', requester: 'Karan Mehta', status: 'pending' },
    { id: 2, type: 'Expense', desc: 'Vendor machine calibration', requester: 'Ritu Joshi', status: 'pending' },
  ]);

  // Watch modules section — pause marquee CSS animations when off-screen
  useEffect(() => {
    const el = modulesRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setModulesVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // GSAP animations context
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Other sections animate on scroll — opacity only, no movement
      const fades = gsap.utils.toArray('.os-fade');
      fades.forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // Module cards grid
      gsap.from('.os-mod-card', {
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '.os-mod-grid',
          start: 'top 88%'
        }
      });

      // Timeline path animation
      gsap.from('.os-time-node', {
        opacity: 0,
        duration: 0.4,
        stagger: 0.12,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '.os-time-timeline',
          start: 'top 88%'
        }
      });

      // Flow nodes — gentle staggered fade-up as the canvas enters
      gsap.from('.os-flow-node', {
        opacity: 0,
        y: 14,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.os-flow-canvas',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
    <AutoRocketNavbar />
    <div className="os-container" ref={containerRef}>
      {/* ── Hero Section ── */}
      <section className="os-hero">
        <div className="os-hero-inner">

          {/* Left — content */}
          <div className="os-hero-left">
            <span className="os-hero-eyebrow os-hero-fade">
              <span style={{ color: '#FFD166' }}>Growth</span> on Autopilot
            </span>

            <h1 className="os-hero-title os-hero-fade">
              Your Entire Business<br />
              <span className="os-hero-gold">On Autopilot</span>
            </h1>

            <p className="os-hero-desc os-hero-fade">
              AutoRocket connects sales, HR, inventory, production, approvals, and 20+ business modules with AI agents, automating workflows, eliminating silos, and helping your business run itself.
            </p>

            <div className="hero-modules os-hero-chips os-hero-fade">
              <div className="hero-modules-track">
                {['Sales', 'Purchase', 'Inventory', 'Production', 'Tasks', 'HR', 'MIS', 'Reporting', 'WhatsApp', 'AI Agents', 'Maintenance', 'Approvals', 'PC', 'EA',
                  'Sales', 'Purchase', 'Inventory', 'Production', 'Tasks', 'HR', 'MIS', 'Reporting', 'WhatsApp', 'AI Agents', 'Maintenance', 'Approvals', 'PC', 'EA'].map((label, i) => (
                  <span key={`${label}-${i}`} className="hero-module-chip">{label}</span>
                ))}
              </div>
            </div>

            <div className="os-hero-actions os-hero-fade">
              <a
                href="https://wa.me/918871527519?text=Hi%20AutoRocket%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
                target="_blank"
                rel="noreferrer"
                className="ar-btn-gold"
              >
                Book Free Demo
              </a>
              <a href="#modules" className="ar-btn-ghost">Explore Modules</a>
            </div>
          </div>

          {/* Right — live interactive product demo */}
          <div className="os-hero-visual os-hero-fade">
            <AutoRocketDemo />
          </div>

        </div>
      </section>

      {/* ── The Problem Section ── */}
      <section className="os-section os-problem-sec">
        <div className="os-section-header os-fade">

          <h2 className="os-section-title">How Most Businesses <span className="os-text-red">Run Today</span></h2>
          <p className="os-section-desc">
            As businesses grow, operations get scattered across multiple tools, people, and platforms.
            The result is confusion, delays, and zero visibility.
          </p>
        </div>

        <div className="os-problem-content os-fade">
          {/* Stripe-style Problem Columns */}
          <div className="os-problem-grid">
            {PROBLEM_ITEMS.map((item) => {
              return (
                <div key={item.title} className="os-problem-column" style={{ '--accent': item.color }}>
                  <div className="os-problem-icon-wrapper" style={{ background: item.gradient }}>
                    <img 
                      src={item.icon} 
                      alt={item.title} 
                      className="os-problem-icon-img" 
                    />
                    <div className="os-problem-icon-overlay" />
                  </div>
                  <div className="os-problem-title-wrapper">
                    <h3 className="os-problem-title">{item.title}</h3>
                  </div>
                  <p className="os-problem-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="os-consequences-sb">
            <h3 className="os-consequences-sb-title">This creates:</h3>
            
            <div className="os-sb-grid">
              {/* Card 1: Silos & Duplicate Work (Wide Card) */}
              <div className="os-sb-card os-sb-card--wide">
                <div className="os-sb-card-content">
                  <h4>Siloed Operations</h4>
                  <p>Departments working in silos, causing duplicate work and endless repeated follow-ups.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 200 120" fill="none" className="os-sb-svg">
                    <rect x="15" y="40" width="45" height="30" rx="6" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="23" y="58" fill="#64748b" fontSize="8" fontWeight="600" fontFamily="sans-serif">DEPT A</text>
                    <rect x="140" y="40" width="45" height="30" rx="6" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="148" y="58" fill="#64748b" fontSize="8" fontWeight="600" fontFamily="sans-serif">DEPT B</text>
                    {/* Disconnected wireframe arrow */}
                    <path d="M70 45 H130" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M70 65 H130" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx="100" cy="65" r="4" fill="#ef4444" />
                    <path d="M98 62 L102 68 M102 62 L98 68" stroke="white" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Visibility Gap (Medium Card) */}
              <div className="os-sb-card">
                <div className="os-sb-card-content">
                  <h4>Visibility Gap</h4>
                  <p>Zero visibility on where work is stuck and no accountability between teams.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 160 100" fill="none" className="os-sb-svg">
                    <circle cx="30" cy="50" r="10" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="40" y1="50" x2="60" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
                    <circle cx="70" cy="50" r="10" stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="80" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="110" cy="50" r="10" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Blocked Alert Icon */}
                    <path d="M70 47 V53 M70 55 H70.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Uncontrolled ERPs (Medium Card) */}
              <div className="os-sb-card">
                <div className="os-sb-card-content">
                  <h4>Uncontrolled ERPs</h4>
                  <p>ERPs are in place, but day-to-day operations and execution remain uncontrolled.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 160 100" fill="none" className="os-sb-svg">
                    {/* Wireframe Dashboard Table */}
                    <rect x="20" y="20" width="120" height="60" rx="4" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="20" y1="35" x2="140" y2="35" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="60" y1="20" x2="60" y2="80" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="100" y1="20" x2="100" y2="80" stroke="#e2e8f0" strokeWidth="1" />
                    <circle cx="35" cy="48" r="4" fill="#eab308" />
                    <circle cx="35" cy="65" r="4" fill="#ef4444" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Owner Overhead (Small Card) */}
              <div className="os-sb-card">
                <div className="os-sb-card-content">
                  <h4>Owner Overhead</h4>
                  <p>Owners end up tracking people manually instead of growing the business.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 160 90" fill="none" className="os-sb-svg">
                    <circle cx="80" cy="45" r="12" stroke="#64748b" strokeWidth="2" />
                    <circle cx="40" cy="25" r="6" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="120" cy="25" r="6" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="40" cy="65" r="6" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="120" cy="65" r="6" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="70" y1="38" x2="46" y2="28" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="90" y1="38" x2="114" y2="28" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="70" y1="52" x2="46" y2="62" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="90" y1="52" x2="114" y2="62" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                </div>
              </div>

              {/* Card 5: System Friction (Small Card) */}
              <div className="os-sb-card">
                <div className="os-sb-card-content">
                  <h4>System Friction</h4>
                  <p>Slow, complex systems that employees actively avoid using daily.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 160 90" fill="none" className="os-sb-svg">
                    {/* Circle construction lines like the Supabase elephant card */}
                    <circle cx="80" cy="45" r="30" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                    <circle cx="80" cy="45" r="22" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
                    <circle cx="80" cy="45" r="14" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M80 15 V75 M50 45 H110" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Card 6: MIS Blindness (Medium Card) */}
              <div className="os-sb-card os-sb-card--wide">
                <div className="os-sb-card-content">
                  <h4>No Centralized MIS</h4>
                  <p>No consolidated reporting, forcing leadership to make key decisions blindly.</p>
                </div>
                <div className="os-sb-card-visual">
                  <svg viewBox="0 0 200 120" fill="none" className="os-sb-svg">
                    <line x1="20" y1="100" x2="180" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />
                    {/* Broken bar chart */}
                    <rect x="40" y="50" width="16" height="50" fill="rgba(148, 163, 184, 0.3)" stroke="#94a3b8" strokeWidth="1.5" />
                    <rect x="75" y="70" width="16" height="30" fill="rgba(148, 163, 184, 0.3)" stroke="#94a3b8" strokeWidth="1.5" />
                    <rect x="110" y="30" width="16" height="70" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                    <rect x="145" y="60" width="16" height="40" fill="rgba(148, 163, 184, 0.3)" stroke="#94a3b8" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="os-problem-quote">
            <p>
              Businesses weren't struggling because of a lack of software.<br />
              They were struggling because their systems were disconnected.
            </p>
          </div>
        </div>
      </section>

      {/* ── 10 Modules Section ── */}
      <section className="os-section os-modules-sec" id="modules" ref={modulesRef}>
        <div className="os-section-header os-fade">

          <h2 className="os-section-title">Every Department. <span className="os-text-green">One Platform.</span></h2>
          <p className="os-section-desc">
            20+ modules. Every department. One unified platform. Every module works independently, and even better together.
          </p>
        </div>

        <div className={`os-marquee-wrap${modulesVisible ? '' : ' is-paused'}`}>
          <div className="os-marquee-fade-l" />
          <div className="os-marquee-fade-r" />

          {/* Row 1 — scrolls left */}
          <div className="os-marquee-row">
            <div className="os-marquee-track os-marquee-left">
              {[...MODULES.slice(0, 9), ...MODULES.slice(0, 9)].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div className="os-mq-card os-mq-card--wordmark-style" key={i} style={{ '--accent': m.color }}>
                    <div className="os-mq-card-head">
                      <Icon size={16} className="os-mq-icon" />
                    </div>
                    <h3 className="os-mq-title">{m.title}</h3>
                    <p className="os-mq-tagline">{m.tagline}</p>
                    <ul className="os-mq-items">
                      {m.items.slice(0, 3).map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div className="os-marquee-row">
            <div className="os-marquee-track os-marquee-right">
              {[...MODULES.slice(9), ...MODULES.slice(9)].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div className="os-mq-card os-mq-card--wordmark-style" key={i} style={{ '--accent': m.color }}>
                    <div className="os-mq-card-head">
                      <Icon size={16} className="os-mq-icon" />
                    </div>
                    <h3 className="os-mq-title">{m.title}</h3>
                    <p className="os-mq-tagline">{m.tagline}</p>
                    <ul className="os-mq-items">
                      {m.items.slice(0, 3).map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Builder ── */}
      <section className="os-section os-workflow-sec" id="workflow" ref={workflowRef}>
        <div className="os-section-header os-fade">

          <h2 className="os-section-title">Build Systems the Way <span className="os-text-gradient">Your Business Works</span></h2>
          <p className="os-section-desc">
            Every business operates differently. Instead of changing your process to fit software,
            AutoRocket lets you define exactly how work flows and converts it into a running system.
          </p>
        </div>

        <div className="os-flow os-fade">
          <div className="os-flow-canvas">
            {/* connectors */}
            <svg className="os-flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {WF_LAYER_LINKS.map((d, i) => (
                <path key={`s${i}`} className="os-flow-link-soft" d={d} vectorEffect="non-scaling-stroke" />
              ))}
              {WF_LINKS.map((d, i) => (
                <g key={i}>
                  <path className="os-flow-link" d={d} vectorEffect="non-scaling-stroke" />
                  <path className="os-flow-link-flow" d={d} vectorEffect="non-scaling-stroke" style={{ animationDelay: `${i * 0.25}s` }} />
                </g>
              ))}
            </svg>

            {/* nodes */}
            {WF_NODES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.id}
                  className={`os-flow-node os-flow-node--${node.id}${node.soft ? ' os-flow-node--soft' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-color': node.color }}
                >
                  <span className="os-flow-node-icon">
                    <Icon size={17} />
                  </span>
                  <span className="os-flow-node-text">
                    <span className="os-flow-node-label">{node.label}</span>
                    <span className="os-flow-node-sub">{node.sub}</span>
                  </span>
                  <span className="os-flow-tip" role="tooltip">
                    <span className="os-flow-tip-title">{node.label}</span>
                    <span className="os-flow-tip-desc">{node.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="os-wf-footer os-fade">
          <p>You define the process. <span className="os-wf-footer-em">AutoRocket turns it into a working system.</span></p>
        </div>
      </section>

      {/* ── AI Workforce ── */}
      <section className="os-section os-ai-network-sec" id="ai-workforce">
        <div className="os-ai-net-container">

          <div className="os-ai-net-header os-fade">
            <h2 className="os-ai-net-title">One platform.<br/>Multiple intelligence layers.</h2>
            <p className="os-ai-net-sub">A dedicated AI agent for every department, all orchestrated from a single intelligence core.</p>
          </div>

          <div className="os-ai-split-layout">
            
            {/* Left: Terminal Console */}
            <div className="os-ai-console-pane os-fade">
              <div className="os-console-box">
                <div className="os-console-header">
                  <span className="os-console-dot red"></span>
                  <span className="os-console-dot yellow"></span>
                  <span className="os-console-dot green"></span>
                  <span className="os-console-title">ai-agent-terminal</span>
                </div>
                <div className="os-console-body">
                  <div className="os-console-line sys">
                    <span className="c-t">OS CORE:</span> <span className="c-val green">ACTIVE</span>
                  </div>
                  <div className="os-console-line sys">
                    <span className="c-t">MONITORING:</span> <span className="c-val blue">{activeAgentIndex !== null ? AI_AGENTS[activeAgentIndex].toUpperCase() : 'STANDBY (READY)'}</span>
                  </div>
                  <div className="os-console-divider"></div>
                  
                  {activeAgentIndex !== null ? (
                    <>
                      {/* Render simulated actions log */}
                      {AGENT_LOGS[AI_AGENTS[activeAgentIndex]].map((log, idx) => (
                        <div key={idx} className="os-console-line log fade-in-line">
                          <span className="c-time">[11:29:{32 + idx * 4}]</span>{' '}
                          <span className="c-msg">{log}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="os-console-line log default-text" style={{ color: 'var(--text-secondary)' }}>
                      <span className="c-time">[*]</span> System waiting for event trigger...<br/>
                      <span className="c-time">[*]</span> Hover over any agent node in the operations graph to inspect live pipeline data streams.
                    </div>
                  )}
                  
                  <div className="os-console-line cursor-line">
                    <span className="c-prompt">&gt; AI OS listening for events</span><span className="c-cursor">_</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Graph Area */}
            <div className="os-ai-graph-wrap os-fade">
              {/* Dot grid background */}
              <div className="os-ai-graph-dot-grid" />

              {/* SVG lines */}
              <svg className="os-ai-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {AI_AGENTS.map((_, i) => {
                  const angle = (i / AI_AGENTS.length) * 2 * Math.PI - Math.PI / 2;
                  const x2 = 50 + Math.cos(angle) * 41;
                  const y2 = 50 + Math.sin(angle) * 36; // Elliptical Y coordinate
                  const isActive = activeAgentIndex === i;
                  return (
                    <line key={i}
                      x1="50" y1="50" x2={x2} y2={y2}
                      className={isActive ? 'line-active' : ''}
                      stroke={isActive ? '#000000' : 'rgba(0,0,0,0.09)'} 
                      strokeWidth={isActive ? '1.5' : '1'}
                      strokeDasharray={isActive ? 'none' : '4 4'}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {/* Center node */}
              <div className="os-ai-center-node">
                <div className="os-ai-center-ring" />
                <div className="os-ai-center-inner">
                  <svg width="34" height="34" viewBox="0 0 96 96" fill="none">
                    <rect width="96" height="96" rx="22" fill="#2563EB"/>
                    <path d="M48 13 L63 47 L48 40 L33 47 Z" fill="white"/>
                    <rect x="34" y="40" width="28" height="32" rx="5" fill="white" opacity="0.55"/>
                    <path d="M29 58 L18 80 L36 68 Z" fill="rgba(255,255,255,0.35)"/>
                    <path d="M67 58 L78 80 L60 68 Z" fill="rgba(255,255,255,0.35)"/>
                    <ellipse cx="48" cy="76" rx="8" ry="11" fill="#FFD166"/>
                  </svg>
                </div>
                <span className="os-ai-center-caption">AI Core</span>
              </div>

              {/* Satellite nodes */}
              {AI_AGENTS.map((agent, i) => {
                const angle = (i / AI_AGENTS.length) * 2 * Math.PI - Math.PI / 2;
                const leftPct = 50 + Math.cos(angle) * 41;
                const topPct  = 50 + Math.sin(angle) * 36; // Elliptical Y coordinate
                const isActive = activeAgentIndex === i;
                return (
                  <div key={agent} 
                    className={`os-ai-sat-node ${isActive ? 'is-active' : ''}`}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    onMouseEnter={() => {
                      setActiveAgentIndex(i);
                    }}
                    onMouseLeave={() => {
                      setActiveAgentIndex(null);
                    }}
                  >
                    <span className="os-ai-sat-dot" />
                    {agent}
                  </div>
                );
              })}

              {/* Mobile fallback */}
              <div className="os-ai-mobile-chips">
                {AI_AGENTS.map((agent, i) => (
                  <span key={agent} 
                    className={`os-ai-mobile-chip ${activeAgentIndex === i ? 'is-active' : ''}`}
                    onClick={() => setActiveAgentIndex(i)}
                  >
                    {agent}
                  </span>
                ))}
              </div>

            </div>
          </div>

          <div className="os-ai-net-footer os-fade">
            <div className="os-ai-cap-badge">CORE CAPABILITIES</div>
            <div className="os-ai-cap-grid">
              {AI_CAPABILITIES.slice(0, 3).map((c, i) => (
                <div className="os-ai-cap-card" key={i}>
                  <div className="os-ai-cap-icon"><FiCheckCircle size={16} /></div>
                  <h4 className="os-ai-cap-title">{c.title}</h4>
                  <p className="os-ai-cap-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* ── AI Roster ── */}
      <AIRoster />

      {/* ── Role-Based Dashboards ── */}
      <section className="os-section os-roles-sec" id="dashboards">
        <div className="os-section-header os-fade">
          <h2 className="os-section-title">Right Information to the <span className="os-text-gradient">Right People</span></h2>
          <p className="os-section-desc">
            Everyone works in one system, but sees exactly what matters to their role.
            No information overload. No missing context.
          </p>
        </div>

        <div className="os-dash-split os-fade">
          
          {/* Left Column: Role Selector Stack */}
          <div className="os-role-selectors">
            {ROLES_RICH.map((role, i) => {
              const Icon = role.Icon;
              const isActive = selectedRoleIndex === i;
              return (
                <button
                  key={i}
                  className={`os-role-selector-item ${isActive ? 'is-active' : ''} ${role.featured ? 'is-featured' : ''}`}
                  style={{ '--role-color': role.color }}
                  onMouseEnter={() => setSelectedRoleIndex(i)}
                  onFocus={() => setSelectedRoleIndex(i)}
                >
                  <div className="os-role-top">
                    <span className="os-role-level">LEVEL {role.level}</span>
                    <span className="os-role-access">{role.access}</span>
                  </div>
                  <div className="os-role-identity">
                    <div className="os-role-icon-wrap">
                      <Icon size={18} />
                    </div>
                    <div className="os-role-id-text">
                      <span className="os-role-sub">DASHBOARD FOR</span>
                      <h3 className="os-role-title">{role.title}</h3>
                    </div>
                  </div>
                  <div className="os-role-selector-footer">
                    <p className="desc">{role.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Simulator Viewport */}
          <div className="os-simulator-viewport">
            <div className="os-viewport-header">
              <div className="os-viewport-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="os-viewport-address-bar">
                botivate.os/dashboard/{ROLES_RICH[selectedRoleIndex].title.toLowerCase()}
              </div>
            </div>
            
            <div className="os-viewport-body">
              {selectedRoleIndex === 0 && (
                <div className="os-sim-dashboard employee-view">
                  <div className="os-sim-header">
                    <div className="info">
                      <h4>Welcome back, Amit!</h4>
                      <p>Level 1 Employee View</p>
                    </div>
                    <span className="os-sim-pill green">SHIFT: ON-DUTY</span>
                  </div>
                  
                  <div className="os-sim-widgets">
                    {/* Checklist */}
                    <div className="os-sim-widget checklist-widget">
                      <h5>My Daily Checklist</h5>
                      
                      <ul className="interactive-checklist">
                        {employeeChecklist.map(item => (
                          <li key={item.id} className={item.checked ? 'is-checked' : ''}>
                            <label className="checklist-label-row">
                              <input 
                                type="checkbox" 
                                checked={item.checked} 
                                onChange={() => {
                                  setEmployeeChecklist(prev => prev.map(c => c.id === item.id ? { ...c, checked: !c.checked } : c));
                                }}
                              />
                              <span className="check-custom"></span>
                              <span className="check-text-label">{item.label}</span>
                            </label>
                          </li>
                        ))}
                      </ul>

                      <div className="checklist-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(employeeChecklist.filter(item => item.checked).length / employeeChecklist.length) * 100}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {employeeChecklist.filter(item => item.checked).length} of {employeeChecklist.length} tasks completed
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="os-sim-widget stats-widget">
                      <h5>Performance & KPI Summary</h5>
                      <div className="sim-mini-stats">
                        <div className="sim-stat-box">
                          <span className="val">82%</span>
                          <span className="lbl">KPI SCORE</span>
                        </div>
                        <div className="sim-stat-box">
                          <span className="val">94%</span>
                          <span className="lbl">ATTENDANCE</span>
                        </div>
                      </div>
                      <div className="sim-checklist-tip">
                        <span className="tip-spark">💡</span>
                        <p>Complete remaining yield logs to push KPI score to 88% today.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleIndex === 1 && (
                <div className="os-sim-dashboard manager-view">
                  <div className="os-sim-header">
                    <div className="info">
                      <h4>Operations Control Center</h4>
                      <p>Level 2 HOD / Manager View</p>
                    </div>
                    <span className="os-sim-pill purple">DEPT: PRODUCTION</span>
                  </div>

                  <div className="os-sim-widgets">
                    {/* Approvals */}
                    <div className="os-sim-widget approvals-widget">
                      <h5>Pending Workflow Approvals</h5>
                      <ul className="approvals-list">
                        {hodApprovals.map(app => (
                          <li key={app.id} className={`approval-item status-${app.status}`}>
                            <div className="app-details">
                              <div className="title-row">
                                <span className="app-type">{app.type}</span>
                                <span className="app-req">by {app.requester}</span>
                              </div>
                              <span className="app-desc">{app.desc}</span>
                            </div>
                            <div className="app-actions">
                              {app.status === 'pending' ? (
                                <>
                                  <button 
                                    className="btn-app approve"
                                    onClick={() => {
                                      setHodApprovals(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a));
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="btn-app reject"
                                    onClick={() => {
                                      setHodApprovals(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className={`app-status-badge ${app.status}`}>{app.status.toUpperCase()}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottlenecks */}
                    <div className="os-sim-widget alerts-widget">
                      <h5>Active Alerts & Issues</h5>
                      <div className="sim-alert warn">
                        <span className="alert-dot"></span>
                        <span className="alert-msg"><strong>Batch #B-019</strong>: Delayed at Stage 2 for 4h</span>
                      </div>
                      <div className="sim-alert info">
                        <span className="alert-dot"></span>
                        <span className="alert-msg">Preventive PM scheduled on Machine #3 (due in 24h)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoleIndex === 2 && (
                <div className="os-sim-dashboard director-view">
                  <div className="os-sim-header">
                    <div className="info">
                      <h4>Director Cockpit Control</h4>
                      <p>Level 3 Owner View</p>
                    </div>
                    <span className="os-sim-pill gold">ALL DEPARMENTS CONNECTED</span>
                  </div>

                  <div className="os-sim-widgets">
                    {/* Finance */}
                    <div className="os-sim-widget finance-widget">
                      <h5>MTD Weekly Collections Summary</h5>
                      <div className="finance-grid">
                        <div className="fin-metric">
                          <span className="lbl">Collections</span>
                          <span className="val blue">₹32.4L</span>
                        </div>
                        <div className="fin-metric">
                          <span className="lbl">Pending Dues</span>
                          <span className="val red">₹14.2L</span>
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="sim-mock-chart">
                        <div className="chart-bar" style={{ height: '40%' }}><span className="bar-val">12L</span><span className="bar-day">W1</span></div>
                        <div className="chart-bar" style={{ height: '65%' }}><span className="bar-val">18L</span><span className="bar-day">W2</span></div>
                        <div className="chart-bar" style={{ height: '85%' }}><span className="bar-val">24L</span><span className="bar-day">W3</span></div>
                        <div className="chart-bar" style={{ height: '95%' }}><span className="bar-val">32L</span><span className="bar-day">W4</span></div>
                      </div>
                    </div>

                    {/* AI Analytics report */}
                    <div className="os-sim-widget ai-summary-widget">
                      <div className="ai-sum-title">
                        <span className="ai-sum-spark">✨</span>
                        <h5>AI Director Assistant Report</h5>
                      </div>
                      <p className="ai-sum-text">
                        "Sales pipeline value is up 22%. Outstanding collection alert triggered for Krishna United (overdue by 32 days). Shift logs show production target met with zero compliance flags."
                      </p>
                      <div className="ai-actions">
                        <button className="btn-ai-action">Generate Executive Summary</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── MIS & Reporting ── */}
      <section className="os-section os-reports-sec">
        <div className="os-section-header os-fade">
          <h2 className="os-section-title">Reports That <span className="os-text-gradient">Expose Reality</span></h2>
          <p className="os-section-desc">
            Most systems tell you tasks are done. AutoRocket shows what is delayed, who is accountable,
            and where your operations are failing — in real time.
          </p>
        </div>

        <div className="os-reports-panel os-fade">
          {/* Left: Tab navigation */}
          <div className="os-rep-tabs" role="tablist">
            {REPORT_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`os-rep-tab${isActive ? ' is-active' : ''}`}
                  style={{ '--tab-color': tab.color }}
                  onMouseEnter={() => setActiveTab(tab.id)}
                  onFocus={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} className="os-rep-tab-icon" aria-hidden="true" />
                  <span className="os-rep-tab-label">{tab.label}</span>
                  {isActive && <FiArrowRight size={13} className="os-rep-tab-arrow" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Right: Live report preview */}
          {REPORT_TABS.map(tab => tab.id === activeTab && (
            <div key={tab.id} className="os-rep-preview" style={{ '--tab-color': tab.color }} role="tabpanel">
              {/* Header bar */}
              <div className="os-rep-hdr">
                <div className="os-rep-hdr-left">
                  <span className="os-rep-live-dot" aria-hidden="true" />
                  <span className="os-rep-live-lbl">LIVE</span>
                  <span className="os-rep-hdr-title">{tab.label}</span>
                </div>
                <span className="os-rep-hdr-date">Today</span>
              </div>

              {/* KPI strip */}
              <div className="os-rep-kpis">
                {tab.kpis.map((kpi, i) => (
                  <div key={i} className="os-rep-kpi">
                    <span className="os-rep-kpi-label">{kpi.label}</span>
                    <span className="os-rep-kpi-value">{kpi.value}</span>
                    <span className={`os-rep-kpi-trend${kpi.up ? ' up' : ' down'}`}>{kpi.trend}</span>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="os-rep-chart-wrap">
                <span className="os-rep-chart-lbl">{tab.chartLabel}</span>
                <div className="os-rep-chart" aria-hidden="true">
                  {tab.chartBars.map((h, i) => (
                    <div key={i} className="os-rep-bar-wrap">
                      <div className="os-rep-bar" style={{ height: `${h}%`, '--bar-color': tab.color }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data table */}
              <div className="os-rep-table" role="table" aria-label={`${tab.label} data`}>
                <div className="os-rep-table-head" role="row">
                  <span>Name</span>
                  <span className="os-rep-col-hide">{tab.col2Label}</span>
                  <span>{tab.col3Label}</span>
                  <span>Status</span>
                </div>
                {tab.tableRows.map((row, i) => (
                  <div key={i} className="os-rep-table-row" role="row">
                    <span className="os-rep-table-name">{row.name}</span>
                    <span className="os-rep-table-col2 os-rep-col-hide">{row.col2}</span>
                    <span className="os-rep-table-col3">{row.col3}</span>
                    <span className={`os-rep-status os-rep-status--${row.status}`}>
                      {row.status === 'done' ? 'Done' : row.status === 'warn' ? 'Alert' : row.status === 'hot' ? 'Urgent' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Insight callout */}
              <div className="os-rep-insight">
                <FiAlertCircle size={13} aria-hidden="true" />
                <span>{tab.insight}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

{/* ── Testimonials ── */}
      <section className="os-testimonials-sec">
        <div className="os-tl-top os-fade">
          <h2 className="os-section-title">Trusted by <span className="os-text-gradient">Business Leaders</span></h2>
          <p className="os-tl-sub">From manufacturing to FMCG to healthcare, across Central India.</p>
        </div>

        <div className="os-tl-scroll-grid os-fade">
          {/* Column 1 — scrolls up, slow */}
          <div className="os-tl-col-mask">
            <div className="os-tl-col-track os-tl-track-up" style={{ animationDuration: '30s' }}>
              {[...TL_COL1, ...TL_COL1].map((t, i) => (
                <div key={i} className="os-tl-scroll-card">
                  <p className="os-tl-scroll-quote">
                    {t.mainText} <span className="os-tl-highlight">{t.highlight}</span>
                  </p>
                  <div className="os-tl-scroll-author">
                    <div className="os-tl-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="os-tl-author-info">
                      <span className="os-tl-name">{t.name}</span>
                      <span className="os-tl-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 — scrolls down, medium */}
          <div className="os-tl-col-mask">
            <div className="os-tl-col-track os-tl-track-down" style={{ animationDuration: '24s' }}>
              {[...TL_COL2, ...TL_COL2].map((t, i) => (
                <div key={i} className="os-tl-scroll-card">
                  <p className="os-tl-scroll-quote">
                    {t.mainText} <span className="os-tl-highlight">{t.highlight}</span>
                  </p>
                  <div className="os-tl-scroll-author">
                    <div className="os-tl-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="os-tl-author-info">
                      <span className="os-tl-name">{t.name}</span>
                      <span className="os-tl-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 — scrolls up, slightly faster */}
          <div className="os-tl-col-mask">
            <div className="os-tl-col-track os-tl-track-up" style={{ animationDuration: '27s' }}>
              {[...TL_COL3, ...TL_COL3].map((t, i) => (
                <div key={i} className="os-tl-scroll-card">
                  <p className="os-tl-scroll-quote">
                    {t.mainText} <span className="os-tl-highlight">{t.highlight}</span>
                  </p>
                  <div className="os-tl-scroll-author">
                    <div className="os-tl-avatar" style={{ background: t.color }}>{t.initials}</div>
                    <div className="os-tl-author-info">
                      <span className="os-tl-name">{t.name}</span>
                      <span className="os-tl-role">{t.role} at {t.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

{/* ── Bottom CTA Section ── */}
      <section className="os-cta-footer os-fade">
        <div className="os-cta-footer-glow" />
        <div className="os-cta-footer-content">
          <h2>Growth on Autopilot Starts Here</h2>
          <p>Automate operations, increase visibility, and scale faster, starting from day one.</p>
          <a
            href="https://wa.me/918871527519?text=Hi%20AutoRocket%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
            target="_blank"
            rel="noreferrer"
            className="ar-btn-gold"
          >
            Book Free Demo
          </a>
        </div>
      </section>

      {/* ── Client Logo Strip ── */}
      <LogoStrip />
    </div>
    </>
  );
}
