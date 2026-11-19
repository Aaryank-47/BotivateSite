"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Eye, EyeOff, Save, X, Plus, Search, Pencil, RefreshCw,
  CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
  LayoutGrid, BarChart3, FileText, Clock, CheckCircle,
  Settings, Bot, Sparkles, UserPlus, ClipboardList,
  LayoutList, ClipboardCheck, FlaskConical, ShieldCheck,
  Package, CalendarCheck, CalendarDays, Send, FileCheck2,
  Building2, Lock,
} from "lucide-react";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  setUserActive,
  SIDEBAR_PAGE_OPTIONS,
} from "../../../services/schemaApi";

// ---- default sidebar access per role --------------------------------------
const DEFAULT_PERMISSIONS = {
  employee: {
    dashboard: true,
    "assign-task": true,
    "pending-tasks": true,
    "completed-tasks": true,
    "pc-page": true,
    tester: true,
    meeting: true,
    holidays: true,
  },
  hod: {
    dashboard: true,
    "assign-task": true,
    "pending-tasks": true,
    "completed-tasks": true,
    "tasks-table": true,
    "delegation-form": true,
    "delegation-tasks": true,
    "pc-page": true,
    "assign-tester": true,
    tester: true,
    "approval-delivery": true,
    "order-list": true,
    meeting: true,
    holidays: true,
  },
  admin: {
    dashboard: true,
    "assign-task": true,
    "tasks-table": true,
    "pending-tasks": true,
    "completed-tasks": true,
    "order-list": true,
    troubleshoot: true,
    "ai-helper": true,
    reports: true,
    "delegation-form": true,
    "delegation-tasks": true,
    "pc-page": true,
    "assign-tester": true,
    tester: true,
    "approval-delivery": true,
    "inform-customer": true,
    "checklist-assign": true,
    "checklist-pending": true,
    meeting: true,
    holidays: true,
    "add-user": true,
    "add-company": true,
  },
  company: {
    dashboard: true,
    "company-systems": true,
    "company-tasks": true,
    troubleshoot: true,
    "ai-helper": true,
    "company-profile": true,
  },
};

const PAGE_META = {
  dashboard: {
    icon: BarChart3,
    blurb: "Overview & key statistics",
    tint: "from-sky-500/15 to-blue-500/5",
    ring: "ring-sky-200",
    iconBg: "bg-sky-100 text-sky-600",
  },
  "assign-task": {
    icon: Plus,
    blurb: "Create tasks / tickets",
    tint: "from-violet-500/15 to-purple-500/5",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
  "tasks-table": {
    icon: FileText,
    blurb: "Internal task desk & work logs",
    tint: "from-indigo-500/15 to-blue-500/5",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  "pending-tasks": {
    icon: Clock,
    blurb: "Open work queue & pending list",
    tint: "from-amber-500/15 to-orange-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
  "completed-tasks": {
    icon: CheckCircle,
    blurb: "Finished work & completion history",
    tint: "from-emerald-500/15 to-green-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  troubleshoot: {
    icon: Settings,
    blurb: "Issue tracker & bug reporting",
    tint: "from-slate-500/15 to-gray-500/5",
    ring: "ring-slate-200",
    iconBg: "bg-slate-100 text-slate-600",
  },
  "ai-helper": {
    icon: Bot,
    blurb: "AI consultant & smart assistant",
    tint: "from-rose-500/15 to-red-500/5",
    ring: "ring-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
  },
  reports: {
    icon: Sparkles,
    blurb: "Analytics, reports & performance",
    tint: "from-blue-500/15 to-indigo-500/5",
    ring: "ring-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
  },
  "delegation-form": {
    icon: UserPlus,
    blurb: "Delegate tasks to team members",
    tint: "from-indigo-500/15 to-violet-500/5",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  "delegation-tasks": {
    icon: ClipboardList,
    blurb: "Track & manage delegated work",
    tint: "from-violet-500/15 to-fuchsia-500/5",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
  "pc-page": {
    icon: LayoutList,
    blurb: "Pending party & delegation desk",
    tint: "from-sky-500/15 to-cyan-500/5",
    ring: "ring-sky-200",
    iconBg: "bg-sky-100 text-sky-600",
  },
  "assign-tester": {
    icon: ClipboardCheck,
    blurb: "Assign a tester to delivered work",
    tint: "from-teal-500/15 to-teal-500/5",
    ring: "ring-teal-200",
    iconBg: "bg-teal-100 text-teal-600",
  },
  tester: {
    icon: FlaskConical,
    blurb: "Test & verify delivered systems",
    tint: "from-cyan-500/15 to-cyan-500/5",
    ring: "ring-cyan-200",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  "approval-delivery": {
    icon: ShieldCheck,
    blurb: "Final review & delivery approval",
    tint: "from-emerald-500/15 to-emerald-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  "checklist-assign": {
    icon: UserPlus,
    blurb: "Assign standard checklist tasks",
    tint: "from-violet-500/15 to-violet-500/5",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
  "checklist-pending": {
    icon: ClipboardList,
    blurb: "Pending checklist & routine duties",
    tint: "from-amber-500/15 to-amber-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
  holidays: {
    icon: CalendarDays,
    blurb: "Company holiday calendar & leave list",
    tint: "from-rose-500/15 to-rose-500/5",
    ring: "ring-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
  },
  "order-list": {
    icon: Package,
    blurb: "View orders and client systems",
    tint: "from-amber-500/15 to-orange-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
  "inform-customer": {
    icon: Send,
    blurb: "Client notifications & delivery alerts",
    tint: "from-indigo-500/15 to-blue-500/5",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  "system-approvals": {
    icon: FileCheck2,
    blurb: "Review & approve requested systems",
    tint: "from-emerald-500/15 to-green-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  meeting: {
    icon: CalendarCheck,
    blurb: "Employee training & meeting SOP",
    tint: "from-purple-500/15 to-indigo-500/5",
    ring: "ring-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
  },
  "company-tasks": {
    icon: CheckCircle,
    blurb: "All company tasks with status filter",
    tint: "from-emerald-500/15 to-green-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  "company-systems": {
    icon: Building2,
    blurb: "Client system modules and task tree",
    tint: "from-blue-500/15 to-sky-500/5",
    ring: "ring-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
  },
  "company-profile": {
    icon: Building2,
    blurb: "Company profile, credentials & details",
    tint: "from-slate-500/15 to-gray-500/5",
    ring: "ring-slate-200",
    iconBg: "bg-slate-100 text-slate-600",
  },
  "add-user": {
    icon: UserPlus,
    blurb: "Create & manage internal users",
    tint: "from-violet-500/15 to-purple-500/5",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
  "add-company": {
    icon: Building2,
    blurb: "Create & manage client companies",
    tint: "from-amber-500/15 to-yellow-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
};

// pages that make sense to offer a company account
const COMPANY_PAGES = new Set([
  "dashboard",
  "company-systems",
  "company-tasks",
  "company-profile",
  "troubleshoot",
  "ai-helper",
]);

// pages that make sense to offer an internal user (employee / hod / admin)
const INTERNAL_USER_PAGES = new Set([
  "dashboard",
  "pc-page",
  "assign-task",
  "tasks-table",
  "pending-tasks",
  "completed-tasks",
  "order-list",
  "assign-tester",
  "tester",
  "approval-delivery",
  "inform-customer",
  "system-approvals",
  "troubleshoot",
  "ai-helper",
  "reports",
  "delegation-form",
  "delegation-tasks",
  "checklist-assign",
  "checklist-pending",
  "meeting",
  "holidays",
  "add-user",
  "add-company",
]);

const DEPARTMENTS = ["Development", "Testing", "Sales", "Support", "Accounts", "HR", "Operations", "Management"];
const INDUSTRIES = ["Manufacturing", "Mining", "Retail", "Services", "Healthcare", "Education", "Logistics", "Other"];

// must match users_phone_check in migration_user_company_details.sql
const PHONE_RE = /^\+?[0-9][0-9 \-]{8,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition placeholder:text-gray-400";

function Field({ label, required, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

const permKeys = (p) => (p && typeof p === "object" ? Object.keys(p).filter((k) => p[k] === true) : []);

const blankForm = (kind) => ({
  name: "", username: "", password: "", role: kind === "company" ? "company" : "employee",
  is_active: true, phone: "", email: "", department: "", contact_person: "",
  address: "", city: "", state: "", gst_number: "", website: "", industry: "",
});

const fromRow = (u) => ({
  name: u.name || "", username: u.username || "", password: "", role: u.role,
  is_active: u.is_active !== false, phone: u.phone || "", email: u.email || "",
  department: u.department || "", contact_person: u.contact_person || "",
  address: u.address || "", city: u.city || "", state: u.state || "",
  gst_number: u.gst_number || "", website: u.website || "", industry: u.industry || "",
});

function AccountModal({ kind, mode, initial, editingId, existing, onClose, onSaved }) {
  const isCompany = kind === "company";
  const [form, setForm] = useState(initial);
  const [keys, setKeys] = useState(initial.__keys);
  const [tab, setTab] = useState("details");
  const [pageSearch, setPageSearch] = useState("");
  const [showPw, setShowPw] = useState(mode === "create");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pages = useMemo(
    () =>
      SIDEBAR_PAGE_OPTIONS.filter((p) =>
        isCompany ? COMPANY_PAGES.has(p.key) : INTERNAL_USER_PAGES.has(p.key)
      ),
    [isCompany]
  );

  const filteredPages = useMemo(() => {
    const q = pageSearch.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => {
      const meta = PAGE_META[p.key] || {};
      const lbl = (p.label || "").toLowerCase();
      const blurb = (meta.blurb || "").toLowerCase();
      const key = (p.key || "").toLowerCase();
      return lbl.includes(q) || blurb.includes(q) || key.includes(q);
    });
  }, [pages, pageSearch]);

  const onRoleChange = (role) => {
    set("role", role);
    setKeys(permKeys(DEFAULT_PERMISSIONS[role]));
  };
  const toggleKey = (k) => {
    if (k === "dashboard") return;
    setKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const validate = () => {
    if (!form.name.trim()) return isCompany ? "Company name is required." : "Full name is required.";
    const username = form.username.trim();
    if (!username) return "Username is required.";
    if (mode === "create" && !form.password) return "Password is required.";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
      return "Phone must be 10–15 digits, optionally starting with + (e.g. +919876543210).";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return "Email is not valid.";
    const clash = existing.find(
      (u) => u.id !== editingId && String(u.username).toLowerCase() === username.toLowerCase()
    );
    if (clash) return `Username “${username}” is already taken.`;
    if (isCompany) {
      const dup = existing.find(
        (u) =>
          u.id !== editingId &&
          String(u.company_name || u.name).trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (dup) return `Company “${form.name.trim()}” already exists.`;
    }
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      setTab("details");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const permission = {};
      [...new Set(["dashboard", ...keys])].forEach((k) => (permission[k] = true));
      const payload = { ...form, company_name: isCompany ? form.name : null, permission };
      const saved =
        mode === "create" ? await createAccount(payload) : await updateAccount(editingId, payload);
      onSaved(saved, mode);
    } catch (err) {
      const m = String(err?.message || "");
      setError(
        err?.code === "23505"
          ? "That username already exists."
          : /column .* does not exist|schema cache/i.test(m)
          ? "Database is missing the new columns. Run migration_user_company_details.sql first."
          : m || "Save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = isCompany ? "Company" : form.role === "admin" ? "Admin" : form.role === "hod" ? "HOD" : "Employee";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "create" ? `Add ${roleLabel}` : `Edit ${roleLabel}`}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-gray-100">
          {[["details", "Details"], ["access", `Page Management (${keys.length || 1})`]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3.5 py-2 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition ${
                tab === id ? "border-indigo-500 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          {tab === "details" && (
            <>
              {!isCompany && (
                <Field label="Role" required>
                  <div className="grid grid-cols-2 gap-2">
                    {[["employee", "Employee"], ["admin", "Admin"], ...(form.role === "hod" ? [["hod", "HOD"]] : [])].map(
                      ([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => onRoleChange(val)}
                          className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                            form.role === val
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </Field>
              )}

              <Field label={isCompany ? "Company Name" : "Full Name"} required>
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder={isCompany ? "e.g. Passary Minerals" : "e.g. Rahul Sharma"} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Username" required hint="Used to log in. Must be unique.">
                  <input className={inputCls} value={form.username} autoComplete="off"
                    onChange={(e) => set("username", e.target.value)} />
                </Field>
                <Field label={mode === "create" ? "Password" : "New Password"} required={mode === "create"}
                  hint={mode === "edit" ? "Leave blank to keep the current password." : undefined}>
                  <div className="relative">
                    <input className={`${inputCls} pr-10`} type={showPw ? "text" : "password"} value={form.password}
                      autoComplete="new-password" onChange={(e) => set("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone / WhatsApp" hint="Used for WhatsApp notifications. e.g. +919876543210">
                  <input className={inputCls} value={form.phone} inputMode="tel" placeholder="+91XXXXXXXXXX"
                    onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Email">
                  <input className={inputCls} type="email" value={form.email}
                    onChange={(e) => set("email", e.target.value)} />
                </Field>
              </div>

              {!isCompany && (
                <Field label="Department">
                  <input className={inputCls} list="dept-list" value={form.department}
                    placeholder="Pick or type a department" onChange={(e) => set("department", e.target.value)} />
                  <datalist id="dept-list">
                    {[...new Set([...DEPARTMENTS, ...existing.map((u) => u.department).filter(Boolean)])].map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </Field>
              )}

              {isCompany && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Contact Person">
                      <input className={inputCls} value={form.contact_person}
                        onChange={(e) => set("contact_person", e.target.value)} />
                    </Field>
                    <Field label="Industry">
                      <input className={inputCls} list="industry-list" value={form.industry}
                        onChange={(e) => set("industry", e.target.value)} />
                      <datalist id="industry-list">
                        {INDUSTRIES.map((d) => <option key={d} value={d} />)}
                      </datalist>
                    </Field>
                  </div>
                  <Field label="Address">
                    <textarea className={inputCls} rows={2} value={form.address}
                      onChange={(e) => set("address", e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City">
                      <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
                    </Field>
                    <Field label="State">
                      <input className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)} />
                    </Field>
                    <Field label="GST Number">
                      <input className={`${inputCls} uppercase`} value={form.gst_number} maxLength={15}
                        onChange={(e) => set("gst_number", e.target.value.toUpperCase())} />
                    </Field>
                    <Field label="Website">
                      <input className={inputCls} value={form.website} placeholder="https://"
                        onChange={(e) => set("website", e.target.value)} />
                    </Field>
                  </div>
                </>
              )}

              <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none pt-1">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                Active (can log in)
              </label>
            </>
          )}

          {tab === "access" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    Sidebar Page Management
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose which pages this {isCompany ? "company" : "user"} can open in the dashboard sidebar.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {keys.length || 1} / {pages.length} pages enabled
                </span>
              </div>

              {/* Quick actions & Search bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full pl-9 pr-7 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition placeholder:text-gray-400"
                  />
                  {pageSearch && (
                    <button
                      type="button"
                      onClick={() => setPageSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                    onClick={() => setKeys(pages.map((p) => p.key))}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                    onClick={() => setKeys(["dashboard"])}
                  >
                    Deselect all
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                    onClick={() => setKeys(permKeys(DEFAULT_PERMISSIONS[form.role] || DEFAULT_PERMISSIONS.employee))}
                  >
                    Reset default
                  </button>
                </div>
              </div>

              {/* Cards Grid identical to User Access page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {filteredPages.map((page) => {
                  const meta = PAGE_META[page.key] || PAGE_META.dashboard;
                  const Icon = meta.icon;
                  const isDash = page.key === "dashboard";
                  const on = isDash || keys.includes(page.key);
                  const disabled = isDash;

                  return (
                    <button
                      key={page.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleKey(page.key)}
                      className={`group relative text-left rounded-2xl border p-3.5 transition-all duration-200 ${
                        on
                          ? `bg-gradient-to-br ${meta.tint} border-transparent ring-1 ${meta.ring} shadow-sm`
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      } ${
                        disabled
                          ? "cursor-default opacity-90"
                          : "cursor-pointer active:scale-[0.98]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                            on ? meta.iconBg : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${
                                on ? "text-gray-900" : "text-gray-600"
                              }`}
                            >
                              {page.label}
                            </p>
                            <span
                              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition ${
                                on
                                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                                  : "bg-gray-100 text-transparent ring-1 ring-gray-200"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {meta.blurb}
                          </p>
                          {isDash && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-sky-600/90">
                              Always on
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredPages.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No pages found matching &ldquo;{pageSearch}&rdquo;.
                </div>
              )}

              <p className="text-[11.5px] text-gray-400 pt-1">
                Pages enabled above are saved directly in the user&apos;s database record (<code>permission</code> column) and will be displayed in their sidebar.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

/**
 * Settings page: list + create + edit for accounts in public.users.
 *   kind="user"    -> roles employee / admin / hod
 *   kind="company" -> role company
 */
export default function AccountManager({ kind, title, subtitle, icon: Icon }) {
  const isCompany = kind === "company";
  const roles = isCompany ? ["company"] : ["employee", "admin", "hod"];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null); // { mode, row }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAccounts(roles));
    } catch (e) {
      setError(e.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (!q) return true;
      return [u.name, u.username, u.phone, u.email, u.department, u.company_name, u.contact_person, u.city]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, roleFilter, statusFilter]);

  const openCreate = () => {
    const f = blankForm(kind);
    const defPerm = DEFAULT_PERMISSIONS[f.role] || DEFAULT_PERMISSIONS.employee;
    setModal({ mode: "create", row: null, form: { ...f, __keys: permKeys(defPerm) } });
  };
  const openEdit = (u) => {
    let keys = [];
    let perm = u.permission;
    if (typeof perm === "string") {
      try {
        perm = JSON.parse(perm);
      } catch {
        /* ignore */
      }
    }
    if (perm && typeof perm === "object") {
      if (perm.all === true) {
        keys = (isCompany
          ? SIDEBAR_PAGE_OPTIONS.filter((p) => COMPANY_PAGES.has(p.key))
          : SIDEBAR_PAGE_OPTIONS.filter((p) => INTERNAL_USER_PAGES.has(p.key))
        ).map((p) => p.key);
      } else {
        keys = permKeys(perm);
      }
    }
    if (keys.length === 0) {
      const defPerm = DEFAULT_PERMISSIONS[u.role] || DEFAULT_PERMISSIONS.employee;
      keys = permKeys(defPerm);
    }
    setModal({ mode: "edit", row: u, form: { ...fromRow(u), __keys: keys } });
  };

  const toggleActive = async (u) => {
    try {
      await setUserActive(u.id, !u.is_active);
      setRows((prev) => prev.map((r) => (r.id === u.id ? { ...r, is_active: !u.is_active } : r)));
    } catch (e) {
      alert(e.message || "Failed to update status");
    }
  };

  const onSaved = (saved, mode) => {
    setModal(null);
    setToast(`${saved.name} ${mode === "create" ? "created" : "updated"}.`);
    // If updated user is the current session user, sync local session immediately
    try {
      const currentSession = JSON.parse(sessionStorage.getItem("userSession") || "{}");
      if (currentSession.userId === saved.id || currentSession.username === saved.username) {
        currentSession.permission = saved.permission;
        currentSession.permissions = saved.permission;
        const granted = Object.keys(saved.permission || {}).filter((k) => saved.permission[k] === true);
        currentSession.pagination = saved.permission?.all === true ? "all" : granted;
        sessionStorage.setItem("userSession", JSON.stringify(currentSession));
        window.dispatchEvent(new CustomEvent("userSessionUpdated", { detail: currentSession }));
      }
    } catch {
      /* ignore */
    }
    load();
  };

  const roleBadge = {
    admin: "bg-blue-100 text-blue-800", hod: "bg-indigo-100 text-indigo-800",
    employee: "bg-emerald-100 text-emerald-800", company: "bg-amber-100 text-amber-900",
  };
  const cols = isCompany
    ? ["Company", "Contact", "Phone", "City", "Username", "Status", ""]
    : ["Name", "Role", "Department", "Phone", "Username", "Status", ""];

  const cell = "px-4 py-3 text-sm text-gray-700 whitespace-nowrap";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Icon className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> {isCompany ? "Add Company" : "Add User"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${inputCls} pl-9`} placeholder="Search name, username, phone…" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!isCompany && (
          <select className={`${inputCls} !w-auto`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="hod">HOD</option>
          </select>
        )}
        <select className={`${inputCls} !w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={load} title="Refresh" className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {toast && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm px-3.5 py-2.5">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>{cols.map((c, i) => <th key={i} className="px-4 py-3 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-sm text-gray-400">Nothing found.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/70">
                  <td className={`${cell} font-semibold text-gray-900`}>{isCompany ? u.company_name || u.name : u.name}</td>
                  {isCompany ? (
                    <>
                      <td className={cell}>{u.contact_person || "—"}</td>
                      <td className={cell}>{u.phone || "—"}</td>
                      <td className={cell}>{u.city || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className={cell}>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleBadge[u.role] || ""}`}>{u.role}</span>
                      </td>
                      <td className={cell}>{u.department || "—"}</td>
                      <td className={cell}>{u.phone || "—"}</td>
                    </>
                  )}
                  <td className={`${cell} font-mono text-xs`}>{u.username}</td>
                  <td className={cell}>
                    <button onClick={() => toggleActive(u)} title="Toggle active"
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? "text-emerald-600" : "text-gray-400"}`}>
                      {u.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className={`${cell} text-right`}>
                    <button onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">{filtered.length} of {rows.length} shown</p>

      {modal && (
        <AccountModal
          kind={kind}
          mode={modal.mode}
          initial={modal.form}
          editingId={modal.row?.id ?? null}
          existing={rows}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
