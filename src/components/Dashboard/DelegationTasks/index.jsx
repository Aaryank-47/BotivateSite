"use client";

import { publishCount } from "../../../utils/sidebarCounts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  ChevronDown,
} from "lucide-react";
import {
  fetchDelegatedTasks,
  completeDelegatedTask,
  extendDelegatedTask,
  fetchTeamsForHod,
} from "../../../services/schemaApi";
import DataTable from "../shared/DataTable";

const PENDING_HEADERS = [
  "Action",
  "S.No",
  "Timestamp",
  "Assigned By",
  "Person",
  "Task Details",
  "Target",
  "Planned",
  "Status",
  "Remarks",
  "New Target",
  "Delay",
];

const COMPLETED_HEADERS = [
  "Action",
  "S.No",
  "Timestamp",
  "Assigned By",
  "Person",
  "Task Details",
  "Target",
  "Planned",
  "Actual",
  "Status",
  "Remarks",
  "New Target",
  "Delay",
];

function getDelegationDelay(task) {
  if (task?.delay_duration != null) return task.delay_duration;
  const isDone = String(task?.status || "").toLowerCase() === "completed";
  if (isDone) {
    if (task?.actual_date && (task?.planned_date || task?.target_date)) {
      try {
        const a = new Date(task.actual_date);
        const p = new Date(task.planned_date || task.target_date);
        a.setHours(0, 0, 0, 0);
        p.setHours(0, 0, 0, 0);
        return Math.round((a - p) / (1000 * 60 * 60 * 24));
      } catch {
        return null;
      }
    }
    return null;
  }
  const dueStr = task?.planned_date || task?.target_date;
  if (!dueStr) return null;
  try {
    const due = new Date(dueStr);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  } catch {
    return null;
  }
}

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

function getDelegatedTaskTime(task) {
  let time = task?.target_time || task?.time || null;
  if (!time && task?.task_details) {
    const match = task.task_details.match(/\[Target Time:\s*([^\s\]]+)\]/i);
    if (match && match[1]) time = match[1];
  }
  return time;
}

function cleanTaskDetails(details) {
  if (!details) return "";
  return details.replace(/\n?\[Target Time:.*?\]/g, "").trim();
}

function formatTaskTime(timeStr) {
  if (!timeStr) return "";
  try {
    const parts = String(timeStr).split(":");
    if (parts.length >= 2) {
      const hour = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m.padStart(2, "0")} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
}

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (s === "extended")
    return "bg-amber-50 text-amber-700 ring-amber-200/70";
  if (s === "in progress")
    return "bg-sky-50 text-sky-700 ring-sky-200/70";
  return "bg-indigo-50 text-indigo-700 ring-indigo-200/70";
}

function UpdateModal({ task, onClose, onDone }) {
  const isCompleted =
    String(task?.status || "").toLowerCase() === "completed";
  const [action, setAction] = useState("complete");
  const [extendDate, setExtendDate] = useState("");
  const [extendTime, setExtendTime] = useState(
    task?.new_target_time || getDelegatedTaskTime(task) || ""
  );
  const [extendReason, setExtendReason] = useState("");
  const [remarks, setRemarks] = useState(task?.remarks || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  const assignerName =
    task.assigner?.name || task.assigner?.username || "—";
  const assigneeName =
    task.assignee?.name || task.assignee?.username || "Unassigned";

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
      if (action === "complete") {
        await completeDelegatedTask(task.id, remarks, task.planned_date);
      } else {
        await extendDelegatedTask(task.id, extendDate, extendReason, extendTime);
      }
      onDone();
      onClose();
    } catch (err) {
      setErrors({ form: err?.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  const title =
    isCompleted && action === "complete"
      ? "Edit Completed Task"
      : action === "complete"
        ? "Mark Task Complete"
        : "Extend Task";
  const subtitle =
    isCompleted && action === "complete"
      ? "Update remarks or reopen by extending"
      : action === "complete"
        ? "Confirm completion — remarks are optional"
        : "Set a new target date and reason";

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
                  {title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
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
              {task.task_details}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Assigned by
                </p>
                <p className="mt-0.5 font-medium text-slate-700">{assignerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Assignee
                </p>
                <p className="mt-0.5 font-medium text-slate-700">{assigneeName}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Due date & time
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-medium text-slate-700">
                  <span>{formatDate(task.target_date)}</span>
                  {getDelegatedTaskTime(task) && (
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
                      <Clock className="h-2.5 w-2.5 text-indigo-500" />
                      {formatTaskTime(getDelegatedTaskTime(task))}
                    </span>
                  )}
                </div>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    New Target Date <span className="text-red-500">*</span>
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
                    New Target Time
                  </label>
                  <input
                    type="time"
                    value={extendTime}
                    onChange={(e) => {
                      setExtendTime(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Remarks <span className="text-red-500">*</span>
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
            {action === "complete"
              ? isCompleted
                ? "Save changes"
                : "Complete Task"
              : "Extend Task"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function useDelegationTasks({
  userRole = "admin",
  user,
  userFilterData,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const currentUserId = resolveCurrentUserId(user, userFilterData);
  const role = String(userRole || user?.type || user?.role || "").toLowerCase();
  const isHod = role === "hod";
  const isEmployee = role === "employee" || role === "user";
  const isFullAccess = role === "superadmin" || role === "admin";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let rows = await fetchDelegatedTasks();

      if (isEmployee && currentUserId) {
        rows = rows.filter(
          (t) => Number(t.assigned_to) === Number(currentUserId)
        );
      } else if (isHod && currentUserId && !isFullAccess) {
        try {
          const teams = await fetchTeamsForHod(currentUserId);
          const memberIds = new Set();
          (teams || []).forEach((team) => {
            (team.team_members || []).forEach((m) => {
              if (m.user_id) memberIds.add(Number(m.user_id));
            });
          });
          memberIds.add(Number(currentUserId));
          rows = rows.filter(
            (t) =>
              memberIds.has(Number(t.assigned_to)) ||
              Number(t.assigned_by) === Number(currentUserId)
          );
        } catch (e) {
          console.warn(e);
        }
      }

      setTasks(rows);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isHod, isEmployee, isFullAccess]);

  useEffect(() => {
    load();
  }, [load]);


  const pending = useMemo(
    () =>
      tasks.filter((t) => String(t.status || "").toLowerCase() !== "completed"),
    [tasks]
  );
  useEffect(() => {
    publishCount("delegation-tasks", pending.length);
  }, [pending.length]);

  const completed = useMemo(
    () =>
      tasks.filter((t) => String(t.status || "").toLowerCase() === "completed"),
    [tasks]
  );

  const list = useMemo(() => {
    let rows = tab === "completed" ? completed : pending;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((t) =>
        [
          t.task_details,
          t.assignee?.name,
          t.assignee?.username,
          t.assigner?.name,
          t.assigner?.username,
          t.serial_number,
          t.remarks,
          t.status,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ")
          .includes(q)
      );
    }
    return rows;
  }, [tab, pending, completed, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search]);

  const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
  const paginated = useMemo(
    () => list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [list, currentPage, itemsPerPage]
  );

  const renderRow = (task) => {
    const isCompletedTab = tab === "completed";
    const delay = getDelegationDelay(task);
    return (
      <tr key={task.id} className="transition hover:bg-slate-50/60">
        <td className="px-3 py-3 text-center align-middle">
          <button
            type="button"
            onClick={() => setSelectedTask(task)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            Update
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-500 text-center align-middle">
          {task.serial_number || "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500 text-center align-middle">
          {formatDate(task.created_at)}
        </td>
        <td className="px-3 py-3 text-sm text-slate-700 text-center align-middle">
          {task.assigner?.name ||
            task.assigner?.username ||
            "—"}
        </td>
        <td className="px-3 py-3 text-sm text-slate-700 text-center align-middle">
          {task.assignee?.name ||
            task.assignee?.username ||
            "—"}
        </td>
        <td className="max-w-[200px] px-3 py-3 text-center align-middle">
          <p
            className="truncate text-sm font-medium text-slate-800"
            title={cleanTaskDetails(task.task_details)}
          >
            {cleanTaskDetails(task.task_details)}
          </p>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 text-center align-middle">
          <div>{formatDate(task.target_date)}</div>
          {getDelegatedTaskTime(task) && (
            <div className="mt-0.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                <Clock className="h-2.5 w-2.5 text-indigo-500" />
                {formatTaskTime(getDelegatedTaskTime(task))}
              </span>
            </div>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 text-center align-middle">
          {formatDate(task.planned_date)}
        </td>
        {isCompletedTab && (
          <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 text-center align-middle">
            {task.actual_date
              ? formatDate(task.actual_date)
              : "—"}
          </td>
        )}
        <td className="px-3 py-3 text-center align-middle">
          <span
            className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${statusStyle(
              task.status
            )}`}
          >
            {task.status || "Pending"}
          </span>
        </td>
        <td className="max-w-[140px] px-3 py-3 text-xs text-slate-500 text-center align-middle">
          <span
            className="line-clamp-2"
            title={task.remarks || ""}
          >
            {task.remarks || "—"}
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 text-center align-middle">
          {task.new_target_date
            ? formatDate(task.new_target_date)
            : "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-center align-middle">
          {delay == null ? (
            <span className="text-slate-400">—</span>
          ) : (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                delay > 0
                  ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                  : delay < 0
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {delay > 0
                ? `+${delay}d`
                : delay === 0
                  ? "0d"
                  : `${delay}d`}
            </span>
          )}
        </td>
      </tr>
    );
  };

  const renderCard = (task) => {
    const isCompletedTab = tab === "completed";
    const delay = getDelegationDelay(task);

    return (
      <div key={task.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

        <div className="flex justify-between items-start mt-1">
          <div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
              Task #{task.serial_number || "—"}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Assigned to: {task.assignee?.name || task.assignee?.username || "—"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${statusStyle(task.status)}`}>
              {task.status || "Pending"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedTask(task)}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
            >
              Update
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Task Details</span>
            <span className="font-semibold text-gray-900">{cleanTaskDetails(task.task_details)}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target</span>
            <div className="font-semibold text-gray-900">
              {formatDate(task.target_date)}
              {getDelegatedTaskTime(task) && (
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
                    <Clock className="h-2.5 w-2.5 text-indigo-500" />
                    {formatTaskTime(getDelegatedTaskTime(task))}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Planned</span>
            <span className="font-semibold text-gray-900">{formatDate(task.planned_date)}</span>
          </div>
          {isCompletedTab && (
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actual</span>
              <span className="font-semibold text-gray-900">{task.actual_date ? formatDate(task.actual_date) : "—"}</span>
            </div>
          )}
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delay</span>
            {delay == null ? (
              <span className="text-slate-400">—</span>
            ) : (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  delay > 0
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                    : delay < 0
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {delay > 0 ? `+${delay}d` : delay === 0 ? "0d" : `${delay}d`}
              </span>
            )}
          </div>
          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</span>
            <span className="text-gray-700">{task.remarks || "—"}</span>
          </div>
        </div>
      </div>
    );
  };

  const header = (
    <>
      <div className="flex flex-shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
            tab === "pending"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
            tab === "completed"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>
      <div className="relative min-w-[120px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks or people…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <button
        type="button"
        onClick={load}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
        />
        Refresh
      </button>
    </>
  );

  const body = (
    <div className="flex flex-1 flex-col min-h-0">
      {error && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            headers={tab === "completed" ? COMPLETED_HEADERS : PENDING_HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1100px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={list.length}
          />
        </div>
      )}

      {selectedTask && (
        <UpdateModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDone={load}
        />
      )}
    </div>
  );

  return { header, body };
}

export default function DelegationTasks(props) {
  const { header, body } = useDelegationTasks(props);
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="mb-4 flex flex-nowrap items-center gap-3 overflow-x-auto overflow-y-visible">
        {header}
      </div>
      {body}
    </div>
  );
}
