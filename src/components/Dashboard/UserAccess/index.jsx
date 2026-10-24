"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Pencil,
  Save,
  X,
  KeyRound,
  CheckCircle2,
  UserPlus,
  LayoutGrid,
  ToggleLeft,
  ToggleRight,
  Building2,
  AlertCircle,
  BarChart3,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Settings,
  Bot,
  Sparkles,
  Lock,
  ClipboardList,
  LayoutList,
  CalendarDays,
  ClipboardCheck,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import {
  fetchAllUsersForAdmin,
  createAppUser,
  updateAppUser,
  setUserActive,
  SIDEBAR_PAGE_OPTIONS,
  USER_ROLE_OPTIONS,
} from "../../../services/schemaApi";
import DataTable from "../shared/DataTable";
import Select from "../shared/Select";

const HEADERS = ["User", "Company", "Username", "Password", "Role", "Pages", "Status", "Actions"];

const PAGE_META = {
  dashboard: {
    icon: BarChart3,
    blurb: "Overview & stats",
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
    blurb: "Internal task desk",
    tint: "from-indigo-500/15 to-blue-500/5",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  "pending-tasks": {
    icon: Clock,
    blurb: "Open work queue",
    tint: "from-amber-500/15 to-orange-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
  "completed-tasks": {
    icon: CheckCircle,
    blurb: "Finished work history",
    tint: "from-emerald-500/15 to-green-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  troubleshoot: {
    icon: Settings,
    blurb: "Issue tracker",
    tint: "from-slate-500/15 to-gray-500/5",
    ring: "ring-slate-200",
    iconBg: "bg-slate-100 text-slate-600",
  },
  "ai-helper": {
    icon: Bot,
    blurb: "AI consultant",
    tint: "from-rose-500/15 to-red-500/5",
    ring: "ring-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
  },
  reports: {
    icon: Sparkles,
    blurb: "Analytics & reports",
    tint: "from-blue-500/15 to-indigo-500/5",
    ring: "ring-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
  },
  "delegation-form": {
    icon: UserPlus,
    blurb: "Delegate internal tasks",
    tint: "from-indigo-500/15 to-violet-500/5",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
  "delegation-tasks": {
    icon: ClipboardList,
    blurb: "Track delegated work",
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
  "tester": {
    icon: FlaskConical,
    blurb: "Test delivered systems",
    tint: "from-cyan-500/15 to-cyan-500/5",
    ring: "ring-cyan-200",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  "approval-delivery": {
    icon: ShieldCheck,
    blurb: "Final approval before delivery",
    tint: "from-emerald-500/15 to-emerald-500/5",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  "checklist-assign": {
    icon: UserPlus,
    blurb: "Assign checklist tasks",
    tint: "from-violet-500/15 to-violet-500/5",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
  },
  "checklist-pending": {
    icon: ClipboardList,
    blurb: "Pending checklist tasks",
    tint: "from-amber-500/15 to-amber-500/5",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
  },
  "holidays": {
    icon: CalendarDays,
    blurb: "Company holidays",
    tint: "from-rose-500/15 to-rose-500/5",
    ring: "ring-rose-200",
    iconBg: "bg-rose-100 text-rose-600",
  },
  "user-access": {
    icon: Shield,
    blurb: "Create users & permissions",
    tint: "from-purple-500/15 to-violet-500/5",
    ring: "ring-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
  },
};

const emptyForm = () => ({
  name: "",
  username: "",
  password: "",
  role: "employee",
  company_name: "",
  is_active: true,
  permission: defaultPermissionForRole("employee"),
});

function defaultPermissionForRole(role) {
  if (role === "superadmin") return { all: true };
  // Admin: full ops by default, but NOT User Access (superadmin grants that)
  if (role === "admin") {
    return {
      dashboard: true,
      "assign-task": true,
      "tasks-table": true,
      "pending-tasks": true,
      "completed-tasks": true,
      troubleshoot: true,
      "ai-helper": true,
      reports: true,
      "delegation-form": true,
      "delegation-tasks": true,
      "pc-page": true,
      "assign-tester": true,
      tester: true,
      "approval-delivery": true,
    };
  }
  if (role === "company") {
    return {
      dashboard: true,
      "assign-task": true,
      "pending-tasks": true,
    };
  }
  if (role === "hod") {
    return {
      dashboard: true,
      "assign-task": true,
      "pending-tasks": true,
      "tasks-table": true,
      "team-overview": true,
      "delegation-form": true,
      "delegation-tasks": true,
      "pc-page": true,
      "assign-tester": true,
      tester: true,
      "approval-delivery": true,
    };
  }
  return {
    dashboard: true,
    "assign-task": true,
    "pending-tasks": true,
    "pc-page": true,
    tester: true,
  };
}

function permissionToKeys(permission) {
  if (!permission || typeof permission !== "object") return [];
  if (permission.all === true) return SIDEBAR_PAGE_OPTIONS.map((p) => p.key);
  return Object.keys(permission).filter((k) => permission[k] === true);
}

function keysToPermission(keys, role) {
  // Only superadmin is always full-access in DB
  if (role === "superadmin") return { all: true };
  const obj = {};
  keys.forEach((k) => {
    obj[k] = true;
  });
  if (!obj.dashboard) obj.dashboard = true;
  return obj;
}

const ROLE_BADGE = {
  superadmin: "bg-purple-100 text-purple-800 ring-purple-200",
  admin: "bg-blue-100 text-blue-800 ring-blue-200",
  hod: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  company: "bg-amber-100 text-amber-900 ring-amber-200",
  employee: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition placeholder:text-gray-400";

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
        {required && <> <span className="text-red-500">*</span></>}
      </span>
      {children}
    </label>
  );
}

function PermissionGrid({ keys, onToggle, locked, role }) {
  const enabledCount = keys.length;
  const total = SIDEBAR_PAGE_OPTIONS.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-600" />
            Sidebar page access
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose which pages this user can open after login.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {locked ? total : enabledCount} / {total} pages
        </span>
      </div>

      {locked && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/80 px-4 py-3">
          <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
          <p className="text-sm text-purple-900">
            <span className="font-semibold capitalize">{role}</span> accounts
            always get full access. Toggles are locked.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SIDEBAR_PAGE_OPTIONS.map((page) => {
          const meta = PAGE_META[page.key] || PAGE_META.dashboard;
          const Icon = meta.icon;
          const on = locked || keys.includes(page.key);
          const isDash = page.key === "dashboard";
          const disabled = locked || isDash;

          return (
            <button
              key={page.key}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(page.key)}
              className={`group relative text-left rounded-2xl border p-3.5 transition-all duration-200 ${
                on
                  ? `bg-gradient-to-br ${meta.tint} border-transparent ring-1 ${meta.ring} shadow-sm`
                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              } ${
                disabled
                  ? "cursor-not-allowed"
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
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                          : "bg-gray-100 text-transparent ring-1 ring-gray-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {meta.blurb}
                  </p>
                  {isDash && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600/80">
                      Always on
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 flex flex-col"
        style={{
          animation: "uaModalIn 0.22s ease-out",
        }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
      <style>{`
        @keyframes uaModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function UserAccess({ userRole = "superadmin" }) {
  const canManage = userRole === "superadmin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [accessKeys, setAccessKeys] = useState(
    permissionToKeys(defaultPermissionForRole("employee"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [modalTab, setModalTab] = useState("details");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllUsersForAdmin();
      setUsers(rows);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) loadUsers();
  }, [canManage, loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.company_name || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const byRole = USER_ROLE_OPTIONS.reduce((acc, r) => {
      acc[r] = users.filter((u) => u.role === r).length;
      return acc;
    }, {});
    return { total, active, byRole };
  }, [users]);

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
    setFormSuccess("");
  };

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    const f = emptyForm();
    setForm(f);
    setAccessKeys(permissionToKeys(f.permission));
    setShowPassword(true);
    setFormError("");
    setFormSuccess("");
    setModalTab("details");
    setModalOpen(true);
  };

  const startEdit = (user) => {
    setMode("edit");
    setEditingId(user.id);
    const perm =
      user.permission && typeof user.permission === "object"
        ? user.permission
        : defaultPermissionForRole(user.role);
    setForm({
      name: user.name || "",
      username: user.username || "",
      password: user.password || "",
      role: user.role || "employee",
      company_name: user.company_name || "",
      is_active: user.is_active !== false,
      permission: perm,
    });
    setAccessKeys(permissionToKeys(perm));
    setShowPassword(false);
    setFormError("");
    setFormSuccess("");
    setModalTab("details");
    setModalOpen(true);
  };

  const onRoleChange = (role) => {
    const perm = defaultPermissionForRole(role);
    setForm((prev) => ({
      ...prev,
      role,
      permission: perm,
      company_name:
        role === "company" ? prev.company_name || prev.name : prev.company_name,
    }));
    setAccessKeys(permissionToKeys(perm));
  };

  const toggleAccessKey = (key) => {
    if (key === "dashboard") return;
    setAccessKeys((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      if (!next.includes("dashboard")) next.unshift("dashboard");
      return next;
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setFormError("");
    setFormSuccess("");
    setSaving(true);
    try {
      const permission = keysToPermission(accessKeys, form.role);
      if (mode === "create") {
        const created = await createAppUser({ ...form, permission });
        setFormSuccess(`User “${created.username}” created.`);
        await loadUsers();
        setMode("edit");
        setEditingId(created.id);
        setForm((prev) => ({
          ...prev,
          password: created.password,
          permission,
        }));
      } else {
        await updateAppUser(editingId, {
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role,
          company_name: form.company_name,
          is_active: form.is_active,
          permission,
        });
        setFormSuccess(`User “${form.username}” updated.`);
        await loadUsers();
      }
    } catch (err) {
      setFormError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await setUserActive(user.id, !user.is_active);
      await loadUsers();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Only superadmin accounts are locked (always full access). Admin is toggleable.
  const accessLocked = form.role === "superadmin";

  const renderRow = (u) => {
    const revealed = revealedIds.has(u.id);
    const pageCount =
      u.role === "admin" || u.role === "superadmin"
        ? SIDEBAR_PAGE_OPTIONS.length
        : permissionToKeys(u.permission).length;
    return (
      <tr key={u.id} className="hover:bg-slate-50/80 transition group">
        <td className="px-4 py-2.5 text-left align-middle">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm shadow-blue-500/20">
              {(u.name || u.username || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {u.name}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm text-gray-700 text-center align-middle whitespace-nowrap">
          {u.role === "company" ? u.company_name || "—" : "—"}
        </td>
        <td className="px-4 py-2.5 font-mono text-xs text-gray-700 text-center align-middle">
          {u.username}
        </td>
        <td className="px-4 py-2.5 text-center align-middle">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-gray-700 tracking-wide">
              {revealed ? u.password : "••••••••"}
            </span>
            <button
              type="button"
              onClick={() => toggleReveal(u.id)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              {revealed ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </td>
        <td className="px-4 py-2.5 text-center align-middle">
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset capitalize ${
              ROLE_BADGE[u.role] || ROLE_BADGE.employee
            }`}
          >
            {u.role}
          </span>
        </td>
        <td className="px-4 py-2.5 text-center align-middle">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-lg">
            <LayoutGrid className="w-3 h-3 text-gray-400" />
            {pageCount}
          </span>
        </td>
        <td className="px-4 py-2.5 text-center align-middle">
          <button
            type="button"
            onClick={() => handleToggleActive(u)}
            title={u.is_active ? "Click to deactivate" : "Click to activate"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset transition ${
              u.is_active
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-500 ring-gray-200 hover:bg-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-gray-400"}`}
            />
            {u.is_active ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-4 py-2.5 text-center align-middle">
          <button
            type="button"
            onClick={() => startEdit(u)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </td>
      </tr>
    );
  };

  const renderCard = (u) => {
    const revealed = revealedIds.has(u.id);
    const pageCount =
      u.role === "admin" || u.role === "superadmin"
        ? SIDEBAR_PAGE_OPTIONS.length
        : permissionToKeys(u.permission).length;

    return (
      <div key={u.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

        <div className="flex justify-between items-start mt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm shadow-blue-500/20">
              {(u.name || u.username || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                {u.name}
              </span>
              {u.company_name && (
                <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {u.company_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => handleToggleActive(u)}
              className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_active ? "text-emerald-700" : "text-gray-400"}`}
            >
              {u.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset capitalize ${ROLE_BADGE[u.role] || ROLE_BADGE.employee}`}>
              {u.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Username</span>
            <span className="font-semibold font-mono text-slate-700">{u.username}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold font-mono text-slate-700 tracking-wide">{revealed ? u.password : "••••••••"}</span>
              <button type="button" onClick={() => toggleReveal(u.id)} className="p-1 rounded-md text-gray-400 hover:text-gray-700">
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pages</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-lg">
              <LayoutGrid className="w-3 h-3 text-gray-400" />
              {pageCount}
            </span>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={() => startEdit(u)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
        <Shield className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-800">Restricted</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          User Access is available only to Superadmin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-5 pb-8">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total", value: stats.total, dot: "bg-blue-500" },
            { label: "Active", value: stats.active, dot: "bg-emerald-500" },
            { label: "Employees", value: stats.byRole.employee || 0, dot: "bg-violet-500" },
            { label: "Companies", value: stats.byRole.company || 0, dot: "bg-amber-500" },
          ].map((st) => (
            <div
              key={st.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full whitespace-nowrap"
            >
              <span className={`w-2 h-2 rounded-full ${st.dot}`} />
              <span className="text-xs font-medium text-gray-500">{st.label}</span>
              <span className="text-sm font-bold text-gray-900">{st.value}</span>
            </div>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, company…"
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        >
          <option value="all">All roles</option>
          {USER_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <button
          type="button"
          onClick={loadUsers}
          title="Refresh"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          New User
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="flex-1 min-h-[440px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 text-center text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
            Loading users…
          </div>
        ) : (
          <DataTable
            headers={HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1100px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={filtered.length}
          />
        )}
      </div>

      {/* Edit / Create modal popup */}
      <Modal open={modalOpen} onClose={closeModal}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              {mode === "create" ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <Pencil className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === "create" ? "Create user" : "Edit user"}
              </h2>
              <p className="text-xs text-gray-500">
                {mode === "create"
                  ? "Add a new account and set page access"
                  : form.username
                    ? `@${form.username}`
                    : "Update details & permissions"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-2xl">
            {[
              { id: "details", label: "Profile", icon: Users },
              { id: "access", label: "Page access", icon: LayoutGrid },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setModalTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
                  modalTab === t.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {modalTab === "details" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="e.g. Rahul Sharma"
                />
              </Field>

              <Field label="Username" required>
                <input
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="unique login id"
                  autoComplete="off"
                />
              </Field>

              <Field
                label={
                  mode === "edit" ? "Password (change if needed)" : "Password"
                }
                required={mode === "create"}
              >
                <div className="relative">
                  <input
                    required={mode === "create"}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className={`${inputCls} pr-10`}
                    placeholder={
                      mode === "edit"
                        ? "Current or new password"
                        : "Set a password"
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Role">
                <Select
                  value={form.role}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className={inputCls}
                >
                  {USER_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>

              {form.role === "company" && (
                <div className="sm:col-span-2">
                  <Field label="Company name" required>
                    <input
                      required
                      value={form.company_name}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          company_name: e.target.value,
                        }))
                      }
                      className={inputCls}
                      placeholder="Legal / trading name"
                    />
                  </Field>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, is_active: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Account is active
                </label>
              </div>
            </div>
          )}

          {modalTab === "access" && (
            <PermissionGrid
              keys={accessKeys}
              onToggle={toggleAccessKey}
              locked={accessLocked}
              role={form.role}
            />
          )}

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              {formSuccess}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <KeyRound className="w-3 h-3" />
            Changes apply on the user’s next login / refresh.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 shadow-md shadow-blue-500/20 transition"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === "create" ? "Create user" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
