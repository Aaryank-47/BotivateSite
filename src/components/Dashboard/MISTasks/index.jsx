"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  UserCheck,
  AlertCircle,
  X,
  Edit2,
} from "lucide-react";
import {
  fetchMISTasks,
  createMISTasksBatch,
  updateMISTaskStatus,
  updateMISTask,
  deleteMISTask,
  fetchUsers,
  fetchOrders,
} from "../../../services/schemaApi";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25";
const labelCls = "mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wider";

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  task_name: "",
  description: "",
  day_name: "Monday",
});

function getDayColor(day) {
  switch ((day || "").toLowerCase()) {
    case "monday":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "tuesday":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "wednesday":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "thursday":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "friday":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "saturday":
      return "bg-pink-50 text-pink-700 ring-pink-200";
    case "sunday":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function getStatusBadge(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === "completed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (s === "in progress") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default function MISTasksPage({ user, userRole, userFilterData, setActiveTab }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAssignedUserId, setSelectedAssignedUserId] = useState("all");

  // Server-side pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Options & Meta
  const [allUsers, setAllUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  // Create Form State
  const [showCreate, setShowCreate] = useState(false);
  const [formRows, setFormRows] = useState([emptyRow()]);
  const [formError, setFormError] = useState("");

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    task_name: "",
    description: "",
    day_name: "Monday",
    status: "Pending",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const sessionUser = useMemo(() => {
    if (user?.id || user?.userId) return user;
    try {
      return JSON.parse(sessionStorage.getItem("userSession") || "null");
    } catch {
      return null;
    }
  }, [user]);

  const currentUserId =
    user?.id ||
    user?.userId ||
    userFilterData?.userId ||
    sessionUser?.id ||
    sessionUser?.userId ||
    null;
  const role = (userRole || user?.role || sessionUser?.role || "admin").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || role === "hod";

  // Load available users & orders for assignment
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [uList, oList] = await Promise.all([fetchUsers(), fetchOrders()]);
        if (!alive) return;
        const internal = (uList || []).filter((u) => u.role !== "company");
        setAllUsers(internal);
        setAllOrders(oList || []);
      } catch (err) {
        console.warn("Could not fetch users or orders for MIS Tasks:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load MIS tasks according to current role & filter — DB-paginated
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMISTasks({
        userId: currentUserId,
        userRole: role,
        selectedAssignedUserId,
        page,
        pageSize,
      });
      setTasks(res?.rows || []);
      setTotalCount(res?.count || 0);
    } catch (err) {
      console.error("Failed to load MIS tasks:", err);
      setTasks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId, role, selectedAssignedUserId, page, pageSize]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Reset to first page whenever a filter that affects server query changes
  useEffect(() => {
    setPage(0);
  }, [selectedAssignedUserId, pageSize]);

  // Extract distinct list of assigned users for Admin filter
  const assignedUsersList = useMemo(() => {
    const map = new Map();
    // Include all internal active users
    allUsers.forEach((u) => {
      if (u.id) map.set(String(u.id), u.name || u.username);
    });
    tasks.forEach((t) => {
      if (t.assigned_user?.id && t.assigned_user?.name) {
        map.set(String(t.assigned_user.id), t.assigned_user.name);
      } else if (t.assigned_user_id) {
        map.set(String(t.assigned_user_id), `User #${t.assigned_user_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allUsers, tasks]);

  const updateFormRow = (id, key, value) => {
    setFormRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const removeFormRow = (id) => {
    setFormRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleSaveTasks = async (e) => {
    e.preventDefault();
    setFormError("");

    const validRows = formRows.filter((r) => r.task_name && r.task_name.trim());
    if (!validRows.length) {
      setFormError("Please enter at least one task name.");
      return;
    }

    setSaving(true);
    try {
      // Auto fan-out: pass order_id=null so backend distributes the task to
      // every order that has an MIS person assigned (each assignee gets their own row).
      await createMISTasksBatch({
        order_id: null,
        tasks: validRows,
        created_by: currentUserId,
        assigned_user_id: null,
      });

      // Reset form & reload
      setFormRows([emptyRow()]);
      setShowCreate(false);
      await loadTasks();
    } catch (err) {
      console.error("Save error:", err);
      setFormError(err?.message || "Failed to save MIS tasks.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditError("");
    setEditForm({
      task_name: task.task_name || "",
      description: task.description || "",
      day_name: task.day_name || "Monday",
      status: task.status || "Pending",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditSaving(true);
    setEditError("");
    try {
      // Only task meta is editable now — assignee & linked order are driven
      // by the order's MIS user and must not be changed here. The dedup view
      // shows one row per logical task, so propagate the edit to every copy
      // in its group to keep every assignee's record in sync.
      const patch = {
        task_name: editForm.task_name.trim(),
        description: editForm.description?.trim() || null,
        day_name: editForm.day_name,
        status: editForm.status,
      };
      const ids = editingTask._groupIds?.length
        ? editingTask._groupIds
        : [editingTask.id];
      await Promise.all(ids.map((id) => updateMISTask(id, patch)));
      setEditingTask(null);
      await loadTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
      setEditError(err?.message || "Failed to update MIS task.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus =
      task.status === "Pending"
        ? "In Progress"
        : task.status === "In Progress"
        ? "Completed"
        : "Pending";

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await updateMISTaskStatus(task.id, nextStatus);
    } catch (err) {
      console.error("Error updating status:", err);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskIdOrIds) => {
    const ids = Array.isArray(taskIdOrIds) ? taskIdOrIds : [taskIdOrIds];
    if (ids.length === 0) return;
    const msg = ids.length > 1
      ? `This will delete ${ids.length} assignments of this task. Continue?`
      : "Are you sure you want to delete this MIS task?";
    if (!window.confirm(msg)) return;
    const idSet = new Set(ids.map(String));
    setTasks((prev) => prev.filter((t) => !idSet.has(String(t.id))));
    try {
      await Promise.all(ids.map((id) => deleteMISTask(id)));
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadTasks();
    }
  };

  // Search / day / status filters first, then collapse the fanned-out copies
  // of the same task into a single row. Each visible row carries `_groupIds`
  // listing every underlying mis_tasks.id, so edit and delete apply to the
  // whole group (admin sees one logical task even when it's assigned to many).
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => {
        const orderSerial = t.order?.serial_number || "";
        const partyName = t.order?.party_name || "";
        const taskName = t.task_name || "";
        const desc = t.description || "";
        const assignedName = t.assigned_user?.name || t.assigned_user?.username || "";
        return [orderSerial, partyName, taskName, desc, assignedName]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }

    if (dayFilter !== "All") {
      result = result.filter(
        (t) => (t.day_name || "").toLowerCase() === dayFilter.toLowerCase()
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (t) => (t.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    const groups = new Map();
    for (const t of result) {
      const key = [
        (t.task_name || "").trim().toLowerCase(),
        (t.day_name || "").trim().toLowerCase(),
        (t.description || "").trim().toLowerCase(),
      ].join("|");
      const bucket = groups.get(key);
      if (bucket) {
        bucket._groupIds.push(t.id);
      } else {
        groups.set(key, { ...t, _groupIds: [t.id] });
      }
    }
    return Array.from(groups.values());
  }, [tasks, search, dayFilter, statusFilter]);

  // Count of MIS-assigned orders — shown in the create banner so the user knows
  // exactly how many assignees will receive this task.
  const assignedMisCount = useMemo(() => {
    const ids = new Set();
    (allOrders || []).forEach((o) => {
      const id = o.mis_id || o.staff_id;
      if (id) ids.add(String(id));
    });
    return ids.size;
  }, [allOrders]);

  return (
    <div className="w-full pb-14 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-indigo-950/20">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-inner">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">MIS Tasks</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-medium">
                {isAdmin ? "Admin Overview" : "My Assigned Tasks"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Daily recurring tasks defined for MIS team members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadTasks();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            title="Refresh tasks"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition"
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Close Form" : "Add MIS Tasks"}
          </button>
        </div>
      </div>

      {/* Task Creation Section (Clean: without Select Order / Auto-assigned fields) */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSaveTasks}
              className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-100/50 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">New MIS Tasks</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                        Auto-assign to {assignedMisCount} MIS user{assignedMisCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      These tasks will go to every MIS person assigned on an order — they appear in each one's pending list.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Rows Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={labelCls}>Task Entries</span>
                  <button
                    type="button"
                    onClick={() => setFormRows((prev) => [...prev, emptyRow()])}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Another Task
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="w-10 px-3 py-2.5 text-center">#</th>
                        <th className="px-3 py-2.5 text-left">Task Name *</th>
                        <th className="px-3 py-2.5 text-left">Description</th>
                        <th className="w-44 px-3 py-2.5 text-left">Day of Week</th>
                        <th className="w-10 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-center font-mono text-xs font-semibold text-indigo-500">
                            {idx + 1}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className={inputCls}
                              value={row.task_name}
                              onChange={(e) => updateFormRow(row.id, "task_name", e.target.value)}
                              placeholder="e.g. Daily stock reconciliation"
                              required
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className={inputCls}
                              value={row.description}
                              onChange={(e) => updateFormRow(row.id, "description", e.target.value)}
                              placeholder="Details / checklist"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              className={inputCls}
                              value={row.day_name}
                              onChange={(e) => updateFormRow(row.id, "day_name", e.target.value)}
                            >
                              {DAY_OPTIONS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              disabled={formRows.length === 1}
                              onClick={() => removeFormRow(row.id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving Tasks..." : "Save Tasks"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Role Specific Filter: Filter by Assigned MIS Users */}
      {isAdmin && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admin Filter: Assigned Users Only
              </span>
              <p className="text-xs text-slate-500">
                Displaying MIS tasks for assigned team members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 shrink-0">
              Assigned MIS User:
            </label>
            <select
              value={selectedAssignedUserId}
              onChange={(e) => setSelectedAssignedUserId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Assigned Users</option>
              {assignedUsersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task name, description..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Day Filter */}
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="All">All Days</option>
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-400 ml-1 shrink-0">
            {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading MIS tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-center px-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No MIS tasks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {isAdmin
              ? "No tasks found for the selected assigned user/filters. Click 'Add MIS Tasks' to define daily recurring tasks."
              : "You do not have any MIS tasks assigned to you currently."}
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Task
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Task & Description</th>
                  <th className="px-4 py-3 text-center">Day of Week</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t, index) => {
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                      <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Task Info */}
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-semibold text-slate-900">{t.task_name}</div>
                        {t.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {t.description}
                          </div>
                        )}
                        {t.order?.serial_number && (
                          <div className="mt-1 text-[11px] text-indigo-600 font-mono">
                            Linked: {t.order.serial_number} — {t.order.party_name}
                          </div>
                        )}
                      </td>

                      {/* Day Name Badge */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getDayColor(
                            t.day_name
                          )}`}
                        >
                          {t.day_name || "Monday"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title="Edit / Reassign task"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t._groupIds || t.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer (server-side) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/60">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400"
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                {totalCount === 0
                  ? "0"
                  : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 text-xs text-slate-500">
                Page {page + 1} / {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <button
                type="button"
                disabled={(page + 1) * pageSize >= totalCount || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Reassign Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit / Reassign MIS Task</h3>
                    <p className="text-xs text-slate-500">Update task info or reassign to another team member</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className={labelCls}>Task Name *</label>
                  <input
                    value={editForm.task_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, task_name: e.target.value }))}
                    className={inputCls}
                    required
                    placeholder="Task name"
                  />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputCls}
                    placeholder="Task details"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Day of Week</label>
                    <select
                      value={editForm.day_name}
                      onChange={(e) => setEditForm((f) => ({ ...f, day_name: e.target.value }))}
                      className={inputCls}
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className={inputCls}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Save className="h-4 w-4" />
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
