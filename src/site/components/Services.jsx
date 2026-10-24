// Concept A — OS App Switcher
// To revert to Concept B (Connected Graph):
//   copy Services.graph.jsx → Services.jsx
//   copy Services.graph.css → Services.css

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiShoppingCart, FiTruck, FiTool, FiPackage, FiUsers,
  FiCheckSquare, FiShoppingBag, FiTrendingUp, FiPhone, FiCpu, FiSearch,
} from 'react-icons/fi';
import { SiWhatsapp } from 'react-icons/si';
import './Services.css';

gsap.registerPlugin(ScrollTrigger);

const MODULES = [
  {
    id: 'lead', label: 'Lead & Enquiry', icon: FiPhone, color: '#3b82f6', cat: 'Revenue',
    tag: 'Capture every enquiry. Never miss a follow-up.',
    stats: [['Sources', '11+'], ['Avg. response', '4m'], ['Auto-assign', 'On']],
  },
  {
    id: 'sales', label: 'Marketing & Sales', icon: FiTrendingUp, color: '#e11d48', cat: 'Revenue',
    tag: 'Pipeline, quotes and conversions in one view.',
    stats: [['Pipeline', '₹2.4 Cr'], ['Win rate', '38%'], ['Campaigns', '6 live']],
  },
  {
    id: 'order', label: 'Order Management', icon: FiShoppingCart, color: '#5c68ff', cat: 'Operations',
    tag: 'Track every order from creation to dispatch.',
    stats: [['Open orders', '142'], ['On-time', '94%'], ['Avg. cycle', '6.2d']],
  },
  {
    id: 'purchase', label: 'Purchase', icon: FiTruck, color: '#3298fa', cat: 'Operations',
    tag: 'Indents to PO to GRN. Zero spreadsheets.',
    stats: [['Open POs', '38'], ['Vendors', '212'], ['Avg. lead', '9d']],
  },
  {
    id: 'production', label: 'Production', icon: FiTool, color: '#10b981', cat: 'Operations',
    tag: 'Plan the shop floor. Track every job-card.',
    stats: [['Job-cards', '24'], ['Running', '11'], ['WIP', '₹18.6L']],
  },
  {
    id: 'inventory', label: 'Inventory', icon: FiPackage, color: '#f59e0b', cat: 'Operations',
    tag: 'Live stock across all locations. Reorder before you run out.',
    stats: [['SKUs', '1,284'], ['Locations', '3'], ['Stock', '₹4.1Cr']],
  },
  {
    id: 'store', label: 'Store & Repair', icon: FiShoppingBag, color: '#22c55e', cat: 'Operations',
    tag: 'After-sales tickets, AMC and on-site repairs.',
    stats: [['Open tickets', '17'], ['SLA met', '91%'], ['Technicians', '8']],
  },
  {
    id: 'task', label: 'Task & Delegation', icon: FiCheckSquare, color: '#f97316', cat: 'People',
    tag: 'Every responsibility, owned and tracked.',
    stats: [['Active tasks', '386'], ['On-time', '88%'], ['Overdue', '14']],
  },
  {
    id: 'hr', label: 'HR & Attendance', icon: FiUsers, color: '#a855f7', cat: 'People',
    tag: 'Attendance, payroll and performance in one place.',
    stats: [['Employees', '64'], ['Attendance', '97%'], ['Payroll', 'Auto']],
  },
  {
    id: 'whatsapp', label: 'WhatsApp Automation', icon: SiWhatsapp, color: '#25d366', cat: 'Automation',
    tag: 'Updates and reminders customers actually read.',
    stats: [['Sent today', '1,204'], ['Read rate', '92%'], ['Templates', '34']],
  },
  {
    id: 'ai', label: 'AI Agents', icon: FiCpu, color: '#6366f1', cat: 'Automation',
    tag: 'Agents that work for your business, 24/7.',
    stats: [['Agents', '8 active'], ['Actions/day', '2,141'], ['Saved hrs', '94/wk']],
  },
];

const GROUPS = [
  { label: 'Revenue',    ids: ['lead', 'sales'] },
  { label: 'Operations', ids: ['order', 'purchase', 'production', 'inventory', 'store'] },
  { label: 'People',     ids: ['task', 'hr'] },
  { label: 'Automation', ids: ['whatsapp', 'ai'] },
];

// Stage chip colour map
const SC = {
  New:          { background: '#F5F5F4', color: '#44403C' },
  Pending:      { background: '#F5F5F4', color: '#44403C' },
  Planned:      { background: '#F5F5F4', color: '#44403C' },
  Qualified:    { background: '#F5F5F4', color: '#44403C' },
  Open:         { background: '#FEF3C7', color: '#92400E' },
  Confirmed:    { background: '#FEF3C7', color: '#92400E' },
  'In Progress':{ background: '#FEF3C7', color: '#92400E' },
  'In Production':{ background: '#FEF3C7', color: '#92400E' },
  Contacted:    { background: '#FEF3C7', color: '#92400E' },
  Ordered:      { background: '#FEF3C7', color: '#92400E' },
  Proposal:     { background: '#FEF3C7', color: '#92400E' },
  Negotiation:  { background: '#FEF3C7', color: '#92400E' },
  WFH:          { background: '#FEF3C7', color: '#92400E' },
  'Low Stock':  { background: '#FEF3C7', color: '#92400E' },
  Running:      { background: '#FEF3C7', color: '#92400E' },
  Sent:         { background: '#FEF3C7', color: '#92400E' },
  Done:         { background: '#DCFCE7', color: '#166534' },
  Dispatched:   { background: '#DCFCE7', color: '#166534' },
  Delivered:    { background: '#DCFCE7', color: '#166534' },
  'GRN Done':   { background: '#DCFCE7', color: '#166534' },
  Approved:     { background: '#DCFCE7', color: '#166534' },
  Won:          { background: '#DCFCE7', color: '#166534' },
  'In Stock':   { background: '#DCFCE7', color: '#166534' },
  Closed:       { background: '#DCFCE7', color: '#166534' },
  Present:      { background: '#DCFCE7', color: '#166534' },
  Read:         { background: '#DCFCE7', color: '#166534' },
  Active:       { background: '#DCFCE7', color: '#166534' },
  Overdue:      { background: '#FEE2E2', color: '#991B1B' },
  Absent:       { background: '#FEE2E2', color: '#991B1B' },
  Lost:         { background: '#FEE2E2', color: '#991B1B' },
  Critical:     { background: '#FEE2E2', color: '#991B1B' },
  QC:           { background: '#E0E7FF', color: '#3730A3' },
  'On Leave':   { background: '#E0E7FF', color: '#3730A3' },
  Reorder:      { background: '#E0E7FF', color: '#3730A3' },
  'In flow':    { background: '#E0E7FF', color: '#3730A3' },
  Quoted:       { background: '#FEF3C7', color: '#92400E' },
};

// rec = record name, ini = 2-char avatar initials, owner = display name,
// stage = one of SC keys, upd = relative time
// iniColor = optional avatar bg override (for system/bot rows)
const RECORDS = {
  lead: [
    { rec: 'Ramesh Auto Parts · IndiaMART',   ini: 'AS', owner: 'Amit Shah',    stage: 'Quoted',      upd: '20m ago' },
    { rec: 'Patel Fabricators · Website',     ini: 'PS', owner: 'Priya S.',     stage: 'Contacted',   upd: '1h ago'  },
    { rec: 'Joshi Industrial · WhatsApp',     ini: 'KD', owner: 'Kavita D.',    stage: 'New',         upd: '2h ago'  },
    { rec: 'Mehta Traders · Meta Ads',        ini: 'AS', owner: 'Amit Shah',    stage: 'Closed',      upd: '4h ago'  },
    { rec: 'Sharma Steel · Cold Call',        ini: 'PS', owner: 'Priya S.',     stage: 'Quoted',      upd: '1d ago'  },
    { rec: 'Gupta Builders · Referral',       ini: 'RM', owner: 'Rahul M.',     stage: 'Contacted',   upd: '1d ago'  },
    { rec: 'Verma & Co. · Google Ads',        ini: 'KD', owner: 'Kavita D.',    stage: 'New',         upd: '2d ago'  },
  ],
  sales: [
    { rec: 'Ramesh Industries · Bulk Order',  ini: 'AS', owner: 'Amit Shah',    stage: 'Negotiation', upd: '30m ago' },
    { rec: 'Patel Fab · Annual AMC',          ini: 'PS', owner: 'Priya S.',     stage: 'Proposal',    upd: '2h ago'  },
    { rec: 'National Steel · Supply Deal',    ini: 'RM', owner: 'Rahul M.',     stage: 'Won',         upd: '3h ago'  },
    { rec: 'Joshi Infra · Maintenance Pack',  ini: 'AS', owner: 'Amit Shah',    stage: 'Qualified',   upd: '1d ago'  },
    { rec: 'Gupta Traders · Equipment',       ini: 'PS', owner: 'Priya S.',     stage: 'Proposal',    upd: '1d ago'  },
    { rec: 'Sharma & Sons · Service',         ini: 'KD', owner: 'Kavita D.',    stage: 'Negotiation', upd: '2d ago'  },
    { rec: 'Agarwal Ltd. · Products',         ini: 'RM', owner: 'Rahul M.',     stage: 'Won',         upd: '3d ago'  },
  ],
  order: [
    { rec: 'ORD-2841 · Ramesh Industries',    ini: 'AK', owner: 'Amit K.',      stage: 'In Production', upd: '2h ago' },
    { rec: 'ORD-2840 · Sharma Traders',       ini: 'PS', owner: 'Priya S.',     stage: 'Confirmed',     upd: '4h ago' },
    { rec: 'ORD-2839 · Gupta Enterprises',    ini: 'RM', owner: 'Rahul M.',     stage: 'Dispatched',    upd: '1d ago' },
    { rec: 'ORD-2838 · Patel & Co.',          ini: 'SR', owner: 'Sneha R.',     stage: 'New',           upd: '1d ago' },
    { rec: 'ORD-2837 · Mehta Infra',          ini: 'DP', owner: 'Deepak P.',    stage: 'Delivered',     upd: '2d ago' },
    { rec: 'ORD-2836 · Joshi Builders',       ini: 'AK', owner: 'Amit K.',      stage: 'In Production', upd: '2d ago' },
    { rec: 'ORD-2835 · Agarwal Steel',        ini: 'PS', owner: 'Priya S.',     stage: 'Confirmed',     upd: '3d ago' },
  ],
  purchase: [
    { rec: 'PO-1042 · Rajesh Steels',         ini: 'SD', owner: 'Suresh D.',    stage: 'Approved',    upd: '1h ago'  },
    { rec: 'PO-1041 · National Bearings',     ini: 'KJ', owner: 'Kavita J.',    stage: 'GRN Done',    upd: '3h ago'  },
    { rec: 'PO-1040 · Sharma Hardware',       ini: 'SD', owner: 'Suresh D.',    stage: 'Ordered',     upd: '5h ago'  },
    { rec: 'PO-1039 · Ravi Electricals',      ini: 'KJ', owner: 'Kavita J.',    stage: 'Pending',     upd: '1d ago'  },
    { rec: 'PO-1038 · Om Plastics',           ini: 'ML', owner: 'Mohan L.',     stage: 'Approved',    upd: '1d ago'  },
    { rec: 'PO-1037 · Bharat Chemicals',      ini: 'SD', owner: 'Suresh D.',    stage: 'GRN Done',    upd: '2d ago'  },
    { rec: 'PO-1036 · Sunrise Tools',         ini: 'KJ', owner: 'Kavita J.',    stage: 'Ordered',     upd: '3d ago'  },
  ],
  production: [
    { rec: 'JC-0524 · MS Frame Assembly',     ini: 'VK', owner: 'Vijay K.',     stage: 'In Progress', upd: '30m ago' },
    { rec: 'JC-0523 · Bearing Housing ×50',   ini: 'RP', owner: 'Ravi P.',      stage: 'QC',          upd: '2h ago'  },
    { rec: 'JC-0522 · Shaft Turning ×20',     ini: 'VK', owner: 'Vijay K.',     stage: 'Done',        upd: '4h ago'  },
    { rec: 'JC-0521 · Sheet Metal Bending',   ini: 'SM', owner: 'Sunil M.',     stage: 'Planned',     upd: '5h ago'  },
    { rec: 'JC-0520 · Gear Box Rebuild',      ini: 'RP', owner: 'Ravi P.',      stage: 'In Progress', upd: '1d ago'  },
    { rec: 'JC-0519 · Motor Assembly ×10',    ini: 'VK', owner: 'Vijay K.',     stage: 'Done',        upd: '1d ago'  },
    { rec: 'JC-0518 · Pump Fabrication ×5',   ini: 'SM', owner: 'Sunil M.',     stage: 'QC',          upd: '2d ago'  },
  ],
  inventory: [
    { rec: 'MS Pipe 2" · SKU-4821',           ini: 'RN', owner: 'Ram N.',       stage: 'In Stock',    upd: '1h ago'  },
    { rec: 'Bearing 6205 · SKU-2041',         ini: 'RN', owner: 'Ram N.',       stage: 'Low Stock',   upd: '2h ago'  },
    { rec: 'Hex Bolt M12 · SKU-1094',         ini: 'AV', owner: 'Anil V.',      stage: 'In Stock',    upd: '3h ago'  },
    { rec: 'Hydraulic Oil 68 · SKU-3342',     ini: 'RN', owner: 'Ram N.',       stage: 'Reorder',     upd: '5h ago'  },
    { rec: 'SS Sheet 3mm · SKU-5501',         ini: 'AV', owner: 'Anil V.',      stage: 'Critical',    upd: '6h ago'  },
    { rec: 'V-Belt A42 · SKU-2208',           ini: 'RN', owner: 'Ram N.',       stage: 'In Stock',    upd: '1d ago'  },
    { rec: 'Paint Grey 20L · SKU-4017',       ini: 'AV', owner: 'Anil V.',      stage: 'Low Stock',   upd: '1d ago'  },
  ],
  store: [
    { rec: 'TKT-0891 · Ramesh Ind. Compressor', ini: 'MT', owner: 'Manoj T.',  stage: 'In Progress', upd: '45m ago' },
    { rec: 'TKT-0890 · Patel Fab. Motor',        ini: 'RK', owner: 'Raju K.',   stage: 'Open',        upd: '2h ago'  },
    { rec: 'TKT-0889 · Sharma Ltd. Pump',        ini: 'MT', owner: 'Manoj T.',  stage: 'Done',        upd: '4h ago'  },
    { rec: 'TKT-0888 · Gupta Bros. Conveyor',    ini: 'SK', owner: 'Sanjay K.', stage: 'Open',        upd: '1d ago'  },
    { rec: 'TKT-0887 · Mehta Co. AC Unit',       ini: 'RK', owner: 'Raju K.',   stage: 'Closed',      upd: '1d ago'  },
    { rec: 'TKT-0886 · Joshi Ind. Gearbox',      ini: 'MT', owner: 'Manoj T.',  stage: 'In Progress', upd: '2d ago'  },
    { rec: 'TKT-0885 · Agarwal Panel Board',     ini: 'SK', owner: 'Sanjay K.', stage: 'Done',        upd: '2d ago'  },
  ],
  task: [
    { rec: 'Submit monthly MIS report',          ini: 'PR', owner: 'Priya R.',   stage: 'Overdue',     upd: '3d ago'  },
    { rec: 'Client follow-up · Ramesh Ind.',     ini: 'AK', owner: 'Amit K.',    stage: 'In Progress', upd: '1h ago'  },
    { rec: 'Review purchase approvals',          ini: 'SD', owner: 'Suresh D.',  stage: 'Done',        upd: '2h ago'  },
    { rec: 'Machine preventive check',           ini: 'VK', owner: 'Vijay K.',   stage: 'Pending',     upd: '5h ago'  },
    { rec: 'Update vendor payment records',      ini: 'KJ', owner: 'Kavita J.',  stage: 'In Progress', upd: '6h ago'  },
    { rec: 'Q3 sales target review',             ini: 'DM', owner: 'Deepak M.',  stage: 'Pending',     upd: '1d ago'  },
    { rec: 'New employee onboarding docs',       ini: 'NK', owner: 'Nisha K.',   stage: 'Done',        upd: '2d ago'  },
  ],
  hr: [
    { rec: 'Amit Kumar · Sales',                 ini: 'AK', owner: 'Nisha K.',   stage: 'Present',     upd: 'Today'   },
    { rec: 'Priya Sharma · Accounts',            ini: 'PS', owner: 'Nisha K.',   stage: 'Present',     upd: 'Today'   },
    { rec: 'Rahul Mehta · Production',           ini: 'RM', owner: 'Nisha K.',   stage: 'WFH',         upd: 'Today'   },
    { rec: 'Suresh Desai · Purchase',            ini: 'SD', owner: 'Nisha K.',   stage: 'On Leave',    upd: 'Today'   },
    { rec: 'Kavita Joshi · HR',                  ini: 'KJ', owner: 'Nisha K.',   stage: 'Present',     upd: 'Today'   },
    { rec: 'Vijay Kumar · Shop Floor',           ini: 'VK', owner: 'Nisha K.',   stage: 'Present',     upd: 'Today'   },
    { rec: 'Sneha Reddy · Dispatch',             ini: 'SR', owner: 'Nisha K.',   stage: 'Absent',      upd: 'Today'   },
  ],
  whatsapp: [
    { rec: 'Order Confirmation · ORD-2841',      ini: 'WA', owner: 'Auto',       stage: 'Delivered',   upd: '5m ago',  iniColor: '#25d366' },
    { rec: 'Payment Reminder · Patel & Co.',     ini: 'WA', owner: 'Auto',       stage: 'Read',        upd: '12m ago', iniColor: '#25d366' },
    { rec: 'Dispatch Update · ORD-2839',         ini: 'WA', owner: 'Auto',       stage: 'Delivered',   upd: '1h ago',  iniColor: '#25d366' },
    { rec: 'Lead Follow-up · Sharma Fab.',       ini: 'WA', owner: 'Auto',       stage: 'Sent',        upd: '2h ago',  iniColor: '#25d366' },
    { rec: 'Service Due Alert · Mehta Ind.',     ini: 'WA', owner: 'Auto',       stage: 'Read',        upd: '3h ago',  iniColor: '#25d366' },
    { rec: 'Invoice Sent · Gupta Builders',      ini: 'WA', owner: 'Auto',       stage: 'Delivered',   upd: '4h ago',  iniColor: '#25d366' },
    { rec: 'Approval Request · PO-1042',         ini: 'WA', owner: 'Auto',       stage: 'Read',        upd: '5h ago',  iniColor: '#25d366' },
  ],
  ai: [
    { rec: 'Sales Agent · Lead Scoring',         ini: 'AI', owner: 'System',     stage: 'Active',      upd: '2m ago',  iniColor: '#6366f1' },
    { rec: 'Follow-up Agent · 12 leads',         ini: 'AI', owner: 'System',     stage: 'Running',     upd: '8m ago',  iniColor: '#6366f1' },
    { rec: 'Inventory Agent · Reorder check',    ini: 'AI', owner: 'System',     stage: 'Done',        upd: '30m ago', iniColor: '#6366f1' },
    { rec: 'HR Agent · Attendance digest',       ini: 'AI', owner: 'System',     stage: 'Done',        upd: '1h ago',  iniColor: '#6366f1' },
    { rec: 'Director Agent · MIS summary',       ini: 'AI', owner: 'System',     stage: 'Running',     upd: '1h ago',  iniColor: '#6366f1' },
    { rec: 'Support Agent · 3 open tickets',     ini: 'AI', owner: 'System',     stage: 'Active',      upd: '2h ago',  iniColor: '#6366f1' },
    { rec: 'Operations Agent · Delay alert',     ini: 'AI', owner: 'System',     stage: 'Done',        upd: '3h ago',  iniColor: '#6366f1' },
  ],
};

const ACTIVITY = {
  lead:       [['Ramesh Auto moved to Quoted', '20m ago'], ['3 new leads from Meta Ads', '1h ago'], ['Patel Fab enquiry assigned to Priya', '2h ago'], ['Mehta Traders lead closed won', '4h ago'], ['Follow-up due: Sharma Steel', '1d ago']],
  sales:      [['Negotiation started · Ramesh Ind.', '30m ago'], ['Proposal sent to Patel Fab', '2h ago'], ['National Steel deal won · ₹3.8L', '3h ago'], ['Pipeline updated · ₹2.4 Cr total', '5h ago'], ['Campaign #6 launched · Google Ads', '1d ago']],
  order:      [['ORD-2841 moved to In Production', '2h ago'], ['ORD-2839 dispatched · Gupta Ent.', '4h ago'], ['Payment received · ₹1.2L · Patel', '6h ago'], ['ORD-2840 confirmed by Priya S.', '1d ago'], ['ORD-2837 delivered, feedback due', '2d ago']],
  purchase:   [['PO-1042 approved by Director', '1h ago'], ['GRN raised against PO-1041', '3h ago'], ['PO-1039 sent to Ravi Electricals', '5h ago'], ['3 indents converted to POs today', '1d ago'], ['Vendor payment: Rajesh Steels ₹84K', '2d ago']],
  production: [['JC-0524 started on Shop Floor A', '30m ago'], ['JC-0523 moved to QC stage', '2h ago'], ['JC-0522 completed · 20 shafts done', '4h ago'], ['Machine #3 downtime logged · 40m', '6h ago'], ['WIP value updated to ₹18.6L', '1d ago']],
  inventory:  [['Bearing 6205 · low stock alert', '2h ago'], ['Reorder triggered · Hydraulic Oil', '5h ago'], ['SS Sheet 3mm · critical · 2 left', '6h ago'], ['GRN received · PO-1041 · 200 units', '1d ago'], ['Stock audit completed · Shop B', '2d ago']],
  store:      [['TKT-0891 assigned to Manoj T.', '45m ago'], ['TKT-0889 closed · Sharma Pump fixed', '4h ago'], ['Spare part ordered for TKT-0888', '6h ago'], ['SLA breach risk · TKT-0890 · 2h left', '8h ago'], ['Monthly service report generated', '1d ago']],
  task:       [['MIS report overdue · Priya R. pinged', '3h ago'], ['2 tasks completed by Suresh D.', '2h ago'], ['Vijay K. task re-scheduled to today', '5h ago'], ['Daily task digest sent to Director', '8h ago'], ['14 tasks overdue across teams', '1d ago']],
  hr:         [['Sneha Reddy marked absent · HR alerted', '9am'], ['4 leave applications pending approval', '10am'], ['Attendance locked · 62/64 present', '11am'], ['Payroll inputs submitted for May', '1d ago'], ['Performance review cycle started', '3d ago']],
  whatsapp:   [['1,204 messages delivered today', '5m ago'], ['Campaign broadcast · 842 contacts', '1h ago'], ['Payment reminder read rate: 92%', '2h ago'], ['New template approved by WhatsApp', '4h ago'], ['Auto follow-up triggered · 18 leads', '1d ago']],
  ai:         [['Sales Agent qualified 4 new leads', '2m ago'], ['Follow-up Agent sent 12 messages', '8m ago'], ['Inventory Agent raised 2 reorders', '30m ago'], ['Director MIS report ready · 2 pages', '1h ago'], ['Operations Agent flagged JC-0524 delay', '2h ago']],
};

// Deterministic sparkline — no randomness, safe for SSR / re-renders
function Sparkline({ seed = 0 }) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const v = (Math.sin(seed * 1.7 + i * 0.9) + Math.cos(seed * 0.4 + i * 0.3)) * 0.5 + 0.5;
    return `${(i * 4).toFixed(1)} ${(16 - v * 14 - 1).toFixed(1)}`;
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  return (
    <svg width="60" height="16" viewBox="0 0 60 16" className="bos-sparkline" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Module workspace — memo-wrapped so hover doesn't tear down the DOM;
// GSAP fades the content in when mod.id changes instead.
const ModuleWorkspace = memo(function ModuleWorkspace({ mod }) {
  const wrapRef = useRef(null);
  const prevId  = useRef(mod.id);

  useEffect(() => {
    if (prevId.current === mod.id) return;
    prevId.current = mod.id;
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
    );
  }, [mod.id]);

  const Icon = mod.icon;
  return (
    <div className="bos-workspace" ref={wrapRef}>
      {/* Page header */}
      <div className="bos-ws-head">
        <div>
          <div className="bos-ws-cat">{mod.cat.toUpperCase()}</div>
          <div className="bos-ws-title">{mod.label}</div>
          <div className="bos-ws-tag">{mod.tag}</div>
        </div>
        <div className="bos-ws-actions">
          <span className="bos-ws-live">
            <span className="bos-ws-live-dot" />
            Live
          </span>
          <span className="bos-ws-btn">Filters</span>
          <span className="bos-ws-btn bos-ws-btn--primary">+ New</span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="bos-ws-stats">
        {mod.stats.map(([k, v], i) => (
          <div key={i} className="bos-ws-stat">
            <div className="bos-ws-stat-k">{k}</div>
            <div className="bos-ws-stat-v">{v}</div>
            <Sparkline seed={i + mod.id.length} />
          </div>
        ))}
      </div>

      {/* Split: data table + activity feed */}
      <div className="bos-ws-split">
        <div className="bos-ws-table">
          <div className="bos-ws-table-head">
            <span style={{ flex: 2 }}>Record</span>
            <span style={{ flex: 1 }}>Owner</span>
            <span style={{ flex: 1 }}>Stage</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Updated</span>
          </div>
          {(RECORDS[mod.id] || []).map((row, i) => (
            <div key={i} className="bos-ws-row">
              <span className="bos-ws-rec" style={{ flex: 2 }}>{row.rec}</span>
              <span className="bos-ws-cell-ava">
                <span className="bos-ws-avatar" style={row.iniColor ? { background: row.iniColor } : {}}>{row.ini}</span>
                <span className="bos-ws-owner">{row.owner}</span>
              </span>
              <span style={{ flex: 1 }}>
                <span className="bos-ws-chip" style={SC[row.stage] || {}}>{row.stage}</span>
              </span>
              <span className="bos-ws-time" style={{ flex: 1 }}>{row.upd}</span>
            </div>
          ))}
        </div>

        <div className="bos-ws-feed">
          <div className="bos-ws-feed-head">Activity</div>
          {(ACTIVITY[mod.id] || []).map(([text, time], i) => (
            <div key={i} className="bos-ws-feed-item">
              <span className="bos-ws-feed-dot" />
              <div style={{ flex: 1 }}>
                <div className="bos-ws-feed-text">{text}</div>
                <div className="bos-ws-feed-time">{time}</div>
              </div>
            </div>
          ))}
          <div className="bos-ws-feed-foot">Synced across {MODULES.length} modules</div>
        </div>
      </div>
    </div>
  );
});

export default function Services() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const wrapRef    = useRef(null);

  const [locked, setLocked] = useState('order');
  const [hover,  setHover]  = useState(null);
  const activeId = hover || locked;
  const active   = MODULES.find(m => m.id === activeId) || MODULES[0];

  const modById = useMemo(() => Object.fromEntries(MODULES.map(m => [m.id, m])), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
      );
      gsap.fromTo(wrapRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', toggleActions: 'play none none none' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="systems" id="systems" ref={sectionRef}>
      <div className="systems-inner container">

        {/* Section header — unchanged from Concept B */}
        <div className="systems-header" ref={headRef}>
          <div className="systems-header-label">What We Build</div>
          <h2 className="systems-header-h">
            One Business OS.<br />
            <span className="systems-header-h-grad">Multiple Business Operations. Fully Connected.</span>
          </h2>
          <p className="systems-header-p">
            Every operation, every team, every workflow. All running inside one intelligent system, fully connected and built to scale.
          </p>
        </div>

        {/* OS window */}
        <div className="bos-os-wrap" ref={wrapRef}>
          <div className="bos-os-window">

            {/* Title bar */}
            <div className="bos-os-titlebar">
              <div className="bos-os-tb-left">
                <div className="bos-os-dots">
                  <span className="bos-os-dot" />
                  <span className="bos-os-dot" />
                  <span className="bos-os-dot" />
                </div>
                <div className="bos-os-crumb">
                  <span className="bos-os-badge">
                    <span className="bos-os-badge-mark" />
                    Botivate OS
                  </span>
                  <span className="bos-os-crumb-sep">/</span>
                  <span className="bos-os-crumb-cat">{active.cat}</span>
                  <span className="bos-os-crumb-sep">/</span>
                  <span className="bos-os-crumb-name">{active.label}</span>
                </div>
              </div>
              <div className="bos-os-tb-right">
                <div className="bos-os-search">
                  <FiSearch size={12} />
                  <span>Search modules, records, actions…</span>
                  <kbd>⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bos-os-body">

              {/* Sidebar */}
              <aside className="bos-os-sidebar">
                <div className="bos-os-sidebar-head">
                  Modules
                  <span className="bos-os-count">{MODULES.length}</span>
                </div>
                {GROUPS.map(group => (
                  <div key={group.label} className="bos-os-group">
                    <div className="bos-os-group-label">{group.label}</div>
                    {group.ids.map(id => {
                      const m = modById[id];
                      const isActive = activeId === id;
                      const isLocked = locked === id;
                      const Icon = m.icon;
                      return (
                        <button
                          key={id}
                          className={`bos-os-item${isActive ? ' bos-os-item--active' : ''}`}
                          onMouseEnter={() => setHover(id)}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => setLocked(id)}
                        >
                          <span className={`bos-os-item-icon${isActive ? ' bos-os-item-icon--active' : ''}`}>
                            <Icon size={13} />
                          </span>
                          <span className="bos-os-item-label">{m.label}</span>
                          {isLocked && <span className="bos-os-item-pin" aria-hidden="true">●</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </aside>

              {/* Main workspace */}
              <main className="bos-os-main">
                <ModuleWorkspace mod={active} />
              </main>

            </div>
          </div>
          <p className="bos-os-hint">Hover any module to preview. Click to lock the workspace.</p>
        </div>

        {/* Mobile fallback */}
        <div className="bos-mobile-grid">
          {MODULES.map((m, i) => {
            const MIcon = m.icon;
            return (
              <div key={i} className="bos-mobile-item" style={{ '--color': m.color }}>
                <span className="bos-mobile-icon"><MIcon /></span>
                <span>{m.label.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
