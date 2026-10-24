"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Layers,
  ClipboardList,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import supabase from "../../../supabaseClient";
import {
  fetchDelegatedTasks,
  completeDelegatedTask,
  extendDelegatedTask,
  fetchChecklistTasks,
  fetchWeeklyCalls,
} from "../../../services/schemaApi";
import DataTable from "../shared/DataTable";

const HEADERS = [
  "System / Party / Delegation",
  "Person",
  "Task name",
  "Planned date",
  "Delay days",
  "Updated remarks",
];

function resolveCurrentUserId(user, userFilterData) {
  const fromProps =
    userFilterData?.userId ||
    userFilterData?.id ||
    user?.id ||
    user?.userId ||
    null;
  if (fromProps != null && fromProps !== "") return Number(fromProps);
  try {
    const raw =
      sessionStorage.getItem("userSession") || localStorage.getItem("userData");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id =
        parsed?.filterData?.userId ||
        parsed?.filterData?.id ||
        parsed?.userId ||
        parsed?.id ||
        null;
      if (id != null && id !== "") return Number(id);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveRole(userRole, user, userFilterData) {
  const r = (
    userRole ||
    user?.type ||
    user?.role ||
    userFilterData?.role ||
    ""
  ).toLowerCase();
  return r;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function delayDays(planned) {
  if (!planned) return null;
  const p = new Date(String(planned).slice(0, 10) + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(p.getTime())) return null;
  return Math.round((today - p) / (24 * 60 * 60 * 1000));
}

function MarkCompleteModal({ item, onClose, onDone }) {
  const [action, setAction] = useState("complete");
  const [extendDate, setExtendDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const validate = () => {
    const next = {};
    if (action === "extend") {
      if (!extendDate) next.extendDate = "Extend date is required";
      if (!extendReason.trim()) next.extendReason = "Reason is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (item.source === "delegation") {
        if (action === "complete") {
          await completeDelegatedTask(item.id, remarks, item.planned_date);
        } else {
          await extendDelegatedTask(item.id, extendDate, extendReason);
        }
      } else {
        // Party / user_tasks
        if (action === "complete") {
          const actual = new Date().toISOString();
          const { error } = await supabase
            .from("user_tasks")
            .update({
              status: "Completed",
              remarks: remarks ? String(remarks).trim() : item.remarks || null,
              completed_at: actual,
            })
            .eq("id", item.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_tasks")
            .update({
              expected_date_to_close: extendDate,
              remarks: extendReason.trim(),
              status: "In Progress",
            })
            .eq("id", item.id);
          if (error) throw error;
        }
      }
      onDone();
      onClose();
    } catch (err) {
      setErrors({ form: err?.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-black/5">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {action === "complete" ? "Mark Task Complete" : "Extend Task"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {action === "complete"
                    ? "Confirm completion — remarks are optional"
                    : "Set a new target date and reason"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Task
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {item.task_name}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Source
                </p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {item.source === "delegation" ? "Delegation" : "Party"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Context
                </p>
                <p className="mt-0.5 truncate font-medium text-slate-700">
                  {item.context_label || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Planned
                </p>
                <p className="mt-0.5 flex items-center gap-1 font-medium text-slate-700">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDate(item.planned_date)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <div className="relative">
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setErrors({});
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="complete">Complete</option>
                <option value="extend">Extend</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {action === "extend" ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Extend Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={extendDate}
                  onChange={(e) => {
                    setExtendDate(e.target.value);
                    setErrors((p) => ({ ...p, extendDate: undefined }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    errors.extendDate
                      ? "border-red-300"
                      : "border-slate-200 focus:border-indigo-300"
                  }`}
                />
                {errors.extendDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.extendDate}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Extend Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extendReason}
                  onChange={(e) => {
                    setExtendReason(e.target.value);
                    setErrors((p) => ({ ...p, extendReason: undefined }));
                  }}
                  rows={3}
                  placeholder="Why is this task being extended?…"
                  className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                    errors.extendReason
                      ? "border-red-300"
                      : "border-slate-200 focus:border-indigo-300"
                  }`}
                />
                {errors.extendReason && (
                  <p className="mt-1 text-xs text-red-500">{errors.extendReason}</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Remarks <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Any notes on completion…"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          )}

          {errors.form && (
            <p className="text-sm text-red-600">{errors.form}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 ${
              action === "complete"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : action === "complete" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            {action === "complete" ? "Complete Task" : "Extend Task"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function PCPage({ userRole = "admin", user, userFilterData }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // all | party | delegation
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [remarkDrafts, setRemarkDrafts] = useState({});
  const [savingRemarksKey, setSavingRemarksKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const currentUserId = resolveCurrentUserId(user, userFilterData);
  const role = resolveRole(userRole, user, userFilterData);
  const isRestricted = role === "employee" || role === "user";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Party system → assigned → pending (user_tasks)
      let partyQuery = supabase
        .from("user_tasks")
        .select(
          `
          id,
          task_no,
          description_of_work,
          expected_date_to_close,
          remarks,
          status,
          created_at,
          assigned_member_1,
          company:users!user_tasks_company_id_fkey ( id, name, company_name ),
          systems ( id, name ),
          assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username )
        `
        )
        .in("status", ["Pending", "In Progress"])
        .order("expected_date_to_close", { ascending: true });

      if (isRestricted && currentUserId) {
        partyQuery = partyQuery.eq("assigned_member_1", currentUserId);
      }

      const { data: partyRows, error: partyErr } = await partyQuery;

      if (partyErr) throw partyErr;

      const partyMapped = (partyRows || []).map((t) => {
        const party =
          t.company?.company_name || t.company?.name || "Unknown party";
        const system = t.systems?.name || "—";
        const planned = t.expected_date_to_close
          ? String(t.expected_date_to_close).slice(0, 10)
          : null;
        return {
          id: t.id,
          source: "party",
          system_name: system,
          party_name: party,
          person_name:
            t.assigned_member?.name ||
            t.assigned_member?.username ||
            "—",
          context_label: `${party} · ${system}`,
          task_name: t.description_of_work || t.task_no || "Untitled",
          planned_date: planned,
          delay: delayDays(planned),
          remarks: t.remarks || "",
          status: t.status,
          assignee: t.assigned_member,
        };
      });

      // Delegation pending (not completed)
      let delMapped = [];
      try {
        const delRows = await fetchDelegatedTasks();
        delMapped = (delRows || [])
          .filter((t) => String(t.status || "").toLowerCase() !== "completed")
          .filter((t) => {
            if (!isRestricted || !currentUserId) return true;
            return Number(t.assigned_to) === Number(currentUserId);
          })
          .map((t) => {
            const planned = t.planned_date
              ? String(t.planned_date).slice(0, 10)
              : t.target_date
                ? String(t.target_date).slice(0, 10)
                : null;
            return {
              id: t.id,
              source: "delegation",
              system_name: "Delegation",
              party_name: "—",
              person_name:
                t.assignee?.name || t.assignee?.username || "—",
              context_label: "Delegation",
              task_name: t.task_details || "Untitled",
              planned_date: planned,
              delay: delayDays(planned),
              remarks: t.remarks || "",
              status: t.status,
              assignee: t.assignee,
              serial_number: t.serial_number,
            };
          });
      } catch (e) {
        console.warn("delegated_tasks load:", e?.message);
      }

      // Checklist pending
      let checklistMapped = [];
      try {
        const clRows = await fetchChecklistTasks();
        checklistMapped = (clRows || [])
          .filter((t) => String(t.status || "").toLowerCase() !== "completed")
          .map((t) => ({
            id: t.id,
            source: "checklist",
            system_name: "Checklist",
            party_name: t.task_type || "—",
            person_name: t.name || "—",
            context_label: `Checklist · ${t.task_category || "single"}`,
            task_name: t.task_name || "Untitled",
            planned_date: null,
            delay: null,
            remarks: t.remarks || "",
            status: t.status,
            days: t.days || [],
          }));
      } catch (e) {
        console.warn("checklist_tasks load:", e?.message);
      }

      // Weekly calls pending
      let weeklyMapped = [];
      try {
        const wkRows = await fetchWeeklyCalls();
        weeklyMapped = (wkRows || [])
          .filter((t) => String(t.status || "").toLowerCase() !== "completed")
          .map((t) => ({
            id: t.id,
            source: "weekly",
            system_name: "Weekly Call",
            party_name: t.party_name || "—",
            person_name: t.calling_person_name || "—",
            context_label: `Weekly · ${t.party_name || ""}`,
            task_name: t.task_description || t.party_name || "Untitled",
            planned_date: null,
            delay: null,
            remarks: t.customer_said || "",
            status: t.status,
            days: t.calling_days || [],
          }));
      } catch (e) {
        console.warn("weekly_calls load:", e?.message);
      }

      setRows([
        ...partyMapped,
        ...delMapped,
        ...checklistMapped,
        ...weeklyMapped,
      ]);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load PC tasks.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isRestricted]);

  useEffect(() => {
    load();
  }, [load]);


  const rowKey = (row) => `${row.source}-${row.id}`;
  const saveTimersRef = useRef({});

  const persistRemarks = async (row, text) => {
    const key = rowKey(row);
    setSavingRemarksKey(key);
    try {
      const value = text ? String(text).trim() : null;
      if (row.source === "delegation") {
        const { error: upErr } = await supabase
          .from("delegated_tasks")
          .update({ remarks: value })
          .eq("id", row.id);
        if (upErr) throw upErr;
      } else {
        const { error: upErr } = await supabase
          .from("user_tasks")
          .update({ remarks: value })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.source === row.source && r.id === row.id
            ? { ...r, remarks: value || "" }
            : r
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRemarksKey((cur) => (cur === key ? null : cur));
    }
  };

  const onRemarksChange = (row, value) => {
    const key = rowKey(row);
    setRemarkDrafts((prev) => ({ ...prev, [key]: value }));
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key]);
    }
    saveTimersRef.current[key] = setTimeout(() => {
      persistRemarks(row, value);
    }, 700);
  };

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current || {}).forEach((timer) => {
        try {
          clearTimeout(timer);
        } catch {
          /* ignore */
        }
      });
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (sourceFilter === "party") list = list.filter((r) => r.source === "party");
    if (sourceFilter === "delegation")
      list = list.filter((r) => r.source === "delegation");
    if (sourceFilter === "checklist")
      list = list.filter((r) => r.source === "checklist");
    if (sourceFilter === "weekly")
      list = list.filter((r) => r.source === "weekly");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        [
          r.system_name,
          r.party_name,
          r.person_name,
          r.task_name,
          r.remarks,
          r.context_label,
          r.assignee?.name,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ")
          .includes(q)
      );
    }
    return list.sort((a, b) => {
      const da = a.delay ?? -9999;
      const db = b.delay ?? -9999;
      return db - da;
    });
  }, [rows, search, sourceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const counts = useMemo(
    () => ({
      all: rows.length,
      party: rows.filter((r) => r.source === "party").length,
      delegation: rows.filter((r) => r.source === "delegation").length,
      checklist: rows.filter((r) => r.source === "checklist").length,
      weekly: rows.filter((r) => r.source === "weekly").length,
    }),
    [rows]
  );

  const renderRow = (row) => {
    const d = row.delay;
    const key = rowKey(row);
    const draft =
      remarkDrafts[key] !== undefined ? remarkDrafts[key] : row.remarks || "";
    return (
      <tr key={key} className="transition hover:bg-slate-50/60">
        <td className="px-4 py-3 text-center align-middle">
          <div className="flex items-start gap-2">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                row.source === "delegation"
                  ? "bg-violet-100 text-violet-600"
                  : row.source === "checklist"
                    ? "bg-emerald-100 text-emerald-600"
                    : row.source === "weekly"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-sky-100 text-sky-600"
              }`}
            >
              {row.source === "delegation" ||
              row.source === "checklist" ||
              row.source === "weekly" ? (
                <ClipboardList className="h-3.5 w-3.5" />
              ) : (
                <Building2 className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0">
              {row.source === "delegation" ? (
                <p className="text-sm font-medium text-slate-800">
                  Delegation
                </p>
              ) : row.source === "checklist" ? (
                <>
                  <p className="text-sm font-medium text-slate-800">
                    Checklist
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.party_name}
                  </p>
                </>
              ) : row.source === "weekly" ? (
                <>
                  <p className="text-sm font-medium text-slate-800">
                    Weekly Call
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.party_name}
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-1 text-sm font-medium text-slate-800">
                    <Layers className="h-3 w-3 text-slate-400" />
                    {row.system_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.party_name}
                  </p>
                </>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-700 text-center align-middle">
          {row.person_name || "—"}
        </td>
        <td className="min-w-[280px] max-w-[420px] px-4 py-3 text-center align-middle">
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-800">
            {row.task_name}
          </p>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 text-center align-middle">
          {formatDate(row.planned_date)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-sm text-center align-middle">
          {d == null ? (
            <span className="text-slate-400">—</span>
          ) : d > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              +{d}d
            </span>
          ) : d === 0 ? (
            <span className="font-medium text-amber-600">Due today</span>
          ) : (
            <span className="font-medium text-emerald-600">{d}d</span>
          )}
        </td>
        <td className="min-w-[220px] px-4 py-3 text-center align-middle">
          <textarea
            value={draft}
            onChange={(e) => {
              onRemarksChange(row, e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
            }}
            onFocus={(e) => {
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
            }}
            rows={1}
            placeholder="Write remarks…"
            className="w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            style={{ minHeight: "36px" }}
          />
          {savingRemarksKey === key && (
            <p className="mt-1 text-[10px] text-slate-400">Saving…</p>
          )}
        </td>
      </tr>
    );
  };

  const renderCard = (row) => {
    const d = row.delay;
    const key = rowKey(row);
    const draft =
      remarkDrafts[key] !== undefined ? remarkDrafts[key] : row.remarks || "";
    return (
      <div key={key} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
        <div className="flex justify-between items-start mt-1">
          <div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
              {row.task_name || "Untitled"}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              {row.source === "delegation" ? "Delegation" : row.source === "checklist" ? `Checklist · ${row.party_name}` : row.source === "weekly" ? `Weekly Call · ${row.party_name}` : `${row.system_name} · ${row.party_name}`}
            </p>
          </div>
          <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
            {row.person_name || "—"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Planned Date</span>
            <span className="font-semibold text-gray-900">{formatDate(row.planned_date)}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delay Days</span>
            <span className="font-semibold text-gray-900">
              {d == null ? "—" : d > 0 ? `+${d}d` : d === 0 ? "Due today" : `${d}d`}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</span>
            <textarea
              value={draft}
              onChange={(e) => {
                onRemarksChange(row, e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
              }}
              onFocus={(e) => {
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
              }}
              rows={1}
              placeholder="Write remarks…"
              className="w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              style={{ minHeight: "36px" }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search system, party, task…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: "All", n: counts.all },
              { key: "party", label: "Party", n: counts.party },
              { key: "delegation", label: "Delegation", n: counts.delegation },
              { key: "checklist", label: "Checklist", n: counts.checklist },
              { key: "weekly", label: "Weekly", n: counts.weekly },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSourceFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  sourceFilter === f.key
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
                <span className="ml-1 opacity-70">({f.n})</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
            </div>
          ) : (
            <DataTable
              headers={HEADERS}
              data={paginated}
              renderRow={renderRow}
              renderCard={renderCard}
              minWidth="min-w-[900px]"
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              totalResults={filtered.length}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
