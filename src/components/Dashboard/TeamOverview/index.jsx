"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Layers,
  X,
  Calendar,
  Building2,
  FileText,
  Search,
  Filter,
  BarChart3,
  Briefcase,
  Wrench,
  Bug,
  MessageSquareWarning,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  fetchTeamsForHod,
  forwardEmplTask,
  updateEmplTask,
  fetchDelegatedTasks,
  fetchChecklistTasks,
  fetchWeeklyCalls,
  fetchTasksWithSubtasks,
} from "../../../services/schemaApi";
import supabase from "../../../supabaseClient";
import DataTable from "../shared/DataTable";
import Select from "../shared/Select";

const ROSTER_HEADERS = [
  "Member",
  "Team(s)",
  "Tasks",
  "Last Assign Date",
  "Time Required",
  "Completion Rate",
  "Completed On Time",
  "Status",
];

const MONTHLY_HEADERS = [
  "Month",
  "Total",
  "New",
  "Update",
  "Errors",
  "Complaints",
  "Meetings",
  "On time",
  "Late",
];

const DELEGATION_HEADERS = [
  "Serial",
  "Task",
  "Assigned by",
  "Target",
  "Planned",
  "Actual",
  "Delay",
  "Status",
];

const CHECKLIST_HEADERS = [
  "Task",
  "Type",
  "Category",
  "Days",
  "Status",
  "Remarks",
];

const WEEKLY_HEADERS = [
  "Party",
  "Responsible",
  "Description",
  "Days",
  "Status",
  "Issue",
  "Customer said",
];

/**
 * Independent client-side pagination for one table.
 * Each call owns its own currentPage / itemsPerPage state; the page resets to 1
 * whenever `resetKey` changes (filters, tab, date range, selected member...).
 * Returns the current page's slice plus the pagination props DataTable expects.
 */
function useTablePagination(items, resetKey) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const list = Array.isArray(items) ? items : [];
  const totalResults = list.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  // Clamp in case the data shrank (e.g. after a refresh) while on a later page
  const page = Math.min(currentPage, totalPages);

  const pageItems = useMemo(
    () => list.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [list, page, itemsPerPage]
  );

  return {
    pageItems,
    paginationProps: {
      currentPage: page,
      totalPages,
      itemsPerPage,
      onPageChange: setCurrentPage,
      onItemsPerPageChange: (n) => {
        setItemsPerPage(n);
        setCurrentPage(1);
      },
      totalResults,
    },
  };
}

function namesMatch(a, b) {
  const x = String(a || "")
    .trim()
    .toLowerCase();
  const y = String(b || "")
    .trim()
    .toLowerCase();
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

const STATUS_STYLE = {
  Completed: "bg-green-50 text-green-800 ring-green-200",
  "In Progress": "bg-blue-50 text-blue-800 ring-blue-200",
  Pending: "bg-amber-50 text-amber-900 ring-amber-200",
  "On Hold": "bg-slate-100 text-slate-700 ring-slate-200",
  Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const PRIORITY_STYLE = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-800",
  Low: "bg-gray-100 text-gray-600",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function toInputDate(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().slice(0, 10);
}

function formatMinutes(mins) {
  const m = Math.max(0, Math.floor(Number(mins) || 0));
  if (m === 0) return "0h 0m";
  const days = Math.floor(m / (60 * 24));
  const h = Math.floor((m % (60 * 24)) / 60);
  const r = m % 60;
  if (days > 0) return `${days}d ${h}h`;
  return `${h}h ${r}m`;
}

function normalizeTypeOfWork(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "Other";
  if (s.includes("complain") || s.includes("complaint")) return "Complaint Report";
  if (s.includes("error")) return "Error Received";
  if (s.includes("existing") || (s.includes("edit") && s.includes("update")))
    return "Existing System Edit & Update";
  if (s.includes("new") && s.includes("system")) return "New System";
  if (s.includes("meeting")) return "Meeting";
  return String(raw).trim() || "Other";
}


function toDayTs(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  } catch {
    return null;
  }
}

/** Returns timeliness vs expected_date_to_close.
 *  Completed: completed_at vs due.
 *  Open (pending / in progress): today vs due.
 *  Every task with a due date is classified onTime OR late so counts sum with total.
 */
function getTimeliness(t) {
  const st = String(t.status || "").toLowerCase();
  const due = toDayTs(t.expected_date_to_close);
  if (due == null) {
    return { onTime: null, late: false, delayDays: null, open: false };
  }

  if (st === "cancelled") {
    return { onTime: null, late: false, delayDays: null, open: false };
  }

  let ref = null;
  let open = false;
  if (st === "completed" && t.completed_at) {
    ref = toDayTs(t.completed_at);
    open = false;
  } else {
    ref = toDayTs(new Date());
    open = true;
  }
  if (ref == null) {
    return { onTime: null, late: false, delayDays: null, open };
  }
  const delayDays = Math.round((ref - due) / (1000 * 60 * 60 * 24));
  return {
    onTime: delayDays <= 0,
    late: delayDays > 0,
    delayDays,
    open,
  };
}

function delayLabel(delayDays, open = false) {
  if (delayDays == null) return "—";
  if (delayDays === 0) return open ? "Due today" : "On time";
  if (delayDays < 0) {
    return open
      ? `${Math.abs(delayDays)}d left`
      : `${Math.abs(delayDays)}d early`;
  }
  return `${delayDays}d late`;
}

/** Admin-set estimation deadline: time_required, else expected_date_to_close */
function getAdminRequiredTs(t) {
  return toDayTs(t.time_required) ?? toDayTs(t.expected_date_to_close);
}

/** Assignment timing: was the task assigned while due date was still in the future? */
function getAssignTiming(t) {
  const due = toDayTs(t.expected_date_to_close);
  const assigned = toDayTs(t.assigned_at || t.given_date || t.created_at);
  if (due == null || assigned == null) {
    return { onTime: null, late: false };
  }
  // Assigned strictly before the expected close day → on-time assign
  if (assigned < due) return { onTime: true, late: false };
  return { onTime: false, late: true };
}

/** Completion vs admin time_required (estimation accuracy) */
function getRequiredCompletion(t) {
  const st = String(t.status || "").toLowerCase();
  if (st !== "completed" || !t.completed_at) {
    return { onTime: null, late: false, delayDays: null };
  }
  const done = toDayTs(t.completed_at);
  const req = getAdminRequiredTs(t);
  if (done == null || req == null) {
    return { onTime: null, late: false, delayDays: null };
  }
  const delayDays = Math.round((done - req) / (1000 * 60 * 60 * 24));
  return {
    onTime: delayDays <= 0,
    late: delayDays > 0,
    delayDays,
  };
}

function completedDisplay(t) {
  const st = String(t.status || "").toLowerCase();
  if (t.completed_at) return formatDate(t.completed_at);
  if (st === "cancelled") return "Cancelled";
  if (st === "completed") return "—";
  // Open work — show live status so column is not empty
  if (st === "in progress") return "In progress";
  if (st === "on hold") return "On hold";
  if (st === "pending" || !st) return "Pending";
  return String(t.status || "Open");
}


function MemberTasksModal({
  member,
  open,
  onClose,
  userRole,
  userFilterData,
  teamMembers = [],
  taskStats = {},
  onAfterChange,
}) {
  const [tasks, setTasks] = useState([]);
  const [delegatedTasks, setDelegatedTasks] = useState([]);
  const [checklistTasks, setChecklistTasks] = useState([]);
  const [weeklyCalls, setWeeklyCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState("active");
  const [reportFilter, setReportFilter] = useState(null); // null | 'total' | 'self' | 'company' | type key
  const [forwardingId, setForwardingId] = useState(null);
  const [reassigningId, setReassigningId] = useState(null);

  const canForward =
    userRole === "hod" ||
    userRole === "admin" ||
    userRole === "superadmin";

  const canReassign = canForward;

  // Assignment Performance — admin / superadmin / HOD
  const canViewAssignmentPerf =
    userRole === "admin" ||
    userRole === "superadmin" ||
    userRole === "hod";

  // Dropdown options: HOD's team members only, with Available / Busy label from M1 load
  const memberOptions = useMemo(() => {
    return (teamMembers || [])
      .map((m) => {
        const s = taskStats[m.id] || {};
        const active = (s.pending || 0) + (s.inProgress || 0);
        return {
          id: m.id,
          name: m.name,
          username: m.username,
          active,
          label: `${m.name}${m.username ? ` (@${m.username})` : ""} — ${
            active === 0 ? "Available" : `Busy (${active})`
          }`,
        };
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active - b.active;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [teamMembers, taskStats]);

  const loadTasks = useCallback(async () => {
    if (!member?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Show tasks where this member is primary owner (M1). Matches Team Overview counts
      // and Task List queues — after forward, previous owner (now M2) no longer sees the task here.
      const data = await fetchTasksWithSubtasks(
        `
          id, task_no, given_date, description_of_work, type_of_work, priority, status,
          expected_date_to_close, time_required, completed_at, assigned_at, created_at, notes, remarks,
          company_id, posted_by, assigned_by,
          company:users!user_tasks_company_id_fkey ( id, name, company_name ),
          systems ( id, name ),
          assigned_member_1, assigned_member_2,
          assigned_member_1_user:users!user_tasks_assigned_member_1_fkey ( id, name, username ),
          assigned_member_2_user:users!user_tasks_assigned_member_2_fkey ( id, name, username )
        `,
        (q) => q.eq("assigned_member_1", member.id)
      );
      data.sort((a, b) => String(b.given_date || "").localeCompare(String(a.given_date || "")));
      setTasks(data);

      // Delegated tasks assigned TO this member (real delegated_tasks table)
      try {
        const allDlg = await fetchDelegatedTasks();
        const mid = Number(member.id);
        setDelegatedTasks(
          (allDlg || []).filter((d) => Number(d.assigned_to) === mid)
        );
      } catch (dlgErr) {
        console.warn("Delegated tasks load failed:", dlgErr);
        setDelegatedTasks([]);
      }

      // Checklist + weekly calls for this person (matched by name / username)
      const memberName = member.name || "";
      const memberUser = member.username || "";
      try {
        const allCl = await fetchChecklistTasks();
        setChecklistTasks(
          (allCl || []).filter(
            (r) =>
              namesMatch(r.name, memberName) || namesMatch(r.name, memberUser)
          )
        );
      } catch (clErr) {
        console.warn("Checklist tasks load failed:", clErr);
        setChecklistTasks([]);
      }
      try {
        const allWc = await fetchWeeklyCalls();
        setWeeklyCalls(
          (allWc || []).filter(
            (r) =>
              namesMatch(r.calling_person_name, memberName) ||
              namesMatch(r.calling_person_name, memberUser)
          )
        );
      } catch (wcErr) {
        console.warn("Weekly calls load failed:", wcErr);
        setWeeklyCalls([]);
      }
    } catch (e) {
      setError(e.message || "Failed to load tasks");
      setTasks([]);
      setDelegatedTasks([]);
      setChecklistTasks([]);
      setWeeklyCalls([]);
    } finally {
      setLoading(false);
    }
  }, [member?.id, member?.name, member?.username]);

  const handleForward = async (task) => {
    if (!task?.id || task.is_subtask) return;
    const m2Name =
      task.assigned_member_2_user?.name ||
      task.assigned_member_2_user?.username ||
      "Member 2";
    if (!task.assigned_member_2) {
      alert("No Member 2 assigned on this task. Set Assign Member 2 first.");
      return;
    }
    if (
      !window.confirm(
        `Forward this task to ${m2Name}? Current owner becomes Member 2.`
      )
    ) {
      return;
    }
    setForwardingId(task.id);
    try {
      await forwardEmplTask(task.id, {
        nextMemberId: task.assigned_member_2,
        byUserId: userFilterData?.userId
          ? Number(userFilterData.userId)
          : null,
        requireOwner: false,
      });
      await loadTasks();
      if (typeof onAfterChange === "function") onAfterChange();
    } catch (e) {
      alert(e.message || "Forward failed");
    } finally {
      setForwardingId(null);
    }
  };

  const handleReassign = async (task, field, newMemberId) => {
    // Sub-task members follow the main task (enforced in the DB too)
    if (!task?.id || !canReassign || task.is_subtask) return;
    const val = newMemberId ? Number(newMemberId) : null;
    if (field === "assigned_member_1" && !val) {
      alert("Member 1 (primary owner) is required.");
      return;
    }
    if (
      field === "assigned_member_1" &&
      task.assigned_member_2 &&
      Number(task.assigned_member_2) === val
    ) {
      alert("Member 1 and Member 2 cannot be the same person.");
      return;
    }
    if (
      field === "assigned_member_2" &&
      task.assigned_member_1 &&
      Number(task.assigned_member_1) === val
    ) {
      alert("Member 1 and Member 2 cannot be the same person.");
      return;
    }
    setReassigningId(task.id);
    try {
      const payload = { [field]: val, updated_at: new Date().toISOString() };
      if (field === "assigned_member_1") {
        payload.assigned_at = new Date().toISOString();
        payload.assigned_by = userFilterData?.userId
          ? Number(userFilterData.userId)
          : null;
      }
      await updateEmplTask(task.id, payload);
      await loadTasks();
      if (typeof onAfterChange === "function") onAfterChange();
    } catch (e) {
      alert(e.message || "Reassign failed");
    } finally {
      setReassigningId(null);
    }
  };

  useEffect(() => {
    if (open && member?.id) {
      setSearch("");
      setStatusFilter("all");
      setDateFrom("");
      setDateTo("");
      setTab("active");
      setReportFilter(null);
      loadTasks();
    }
  }, [open, member?.id, loadTasks]);

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

  // From company = only true company tickets (posted_by is the company user).
  // In this schema company_id references the company user row, so
  // posted_by === company_id means the company account raised the ticket.
  // Admin / HOD assigned work is NOT counted as "From company".
  const isFromCompany = (t) => {
    const postedBy = t.posted_by ? Number(t.posted_by) : null;
    const companyId = t.company_id
      ? Number(t.company_id)
      : t.company?.id
        ? Number(t.company.id)
        : null;
    return !!(postedBy && companyId && postedBy === companyId);
  };

  // Self = member created / took it themselves (not a company-raised ticket).
  const isSelfAssigned = (t, mid) => {
    if (!mid || isFromCompany(t)) return false;
    const postedBy = t.posted_by ? Number(t.posted_by) : null;
    const assignedBy = t.assigned_by ? Number(t.assigned_by) : null;
    return postedBy === mid || assignedBy === mid;
  };

  const taskInDateRange = useCallback(
    (t) => {
      if (dateFrom) {
        const d = t.given_date || t.created_at;
        if (d && toInputDate(d) < dateFrom) return false;
      }
      if (dateTo) {
        const d = t.given_date || t.created_at;
        if (d && toInputDate(d) > dateTo) return false;
      }
      return true;
    },
    [dateFrom, dateTo]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const status = (t.status || "").toLowerCase();
      const isDone = status === "completed" || status === "cancelled";

      // Pending tab = active (not completed/cancelled)
      if (tab === "active" && isDone) return false;

      // Date filter applies on all tabs (including report)
      if (!taskInDateRange(t)) return false;

      // Report drill-down filter
      if (tab === "report" && reportFilter) {
        if (reportFilter === "total") {
          // all tasks
        } else if (reportFilter === "self") {
          if (!isSelfAssigned(t, member?.id ? Number(member.id) : null)) return false;
        } else if (reportFilter === "company") {
          if (!isFromCompany(t)) return false;
        } else if (reportFilter === "assign-completed-on-time") {
          const rc = getRequiredCompletion(t);
          if (rc.onTime !== true) return false;
        } else if (reportFilter === "assign-completed-late") {
          const rc = getRequiredCompletion(t);
          if (!rc.late) return false;
        } else if (reportFilter === "assign-on-time") {
          const at = getAssignTiming(t);
          if (at.onTime !== true) return false;
        } else if (reportFilter === "assign-late") {
          const at = getAssignTiming(t);
          if (!at.late) return false;
        } else if (reportFilter === "assign-pending") {
          const st = String(t.status || "").toLowerCase();
          if (st === "completed" || st === "cancelled") return false;
        } else {
          // type of work key
          if (normalizeTypeOfWork(t.type_of_work) !== reportFilter) return false;
        }
      }

      if (tab !== "report") {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;

        if (q) {
          const company = t.company?.company_name || t.company?.name || "";
          const system = t.systems?.name || "";
          const blob = [
            t.task_no,
            t.description_of_work,
            t.type_of_work,
            t.notes,
            t.remarks,
            company,
            system,
            t.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!blob.includes(q)) return false;
        }
      }

      return true;
    });
  }, [tasks, search, statusFilter, tab, reportFilter, taskInDateRange, member?.id]);

  const counts = useMemo(() => {
    let active = 0;
    tasks.forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s !== "completed" && s !== "cancelled") active++;
    });
    return { active, total: tasks.length };
  }, [tasks]);

  const report = useMemo(() => {
    const mid = member?.id ? Number(member.id) : null;
    let selfAssigned = 0;
    let fromCompany = 0;
    const byType = {
      "New System": 0,
      "Existing System Edit & Update": 0,
      "Error Received": 0,
      "Complaint Report": 0,
      Meeting: 0,
      Other: 0,
    };
    const tasksByType = {
      "New System": [],
      "Existing System Edit & Update": [],
      "Error Received": [],
      "Complaint Report": [],
      Meeting: [],
      Other: [],
    };
    let total = 0;
    let onTime = 0;
    let late = 0;
    let completed = 0;
    const byStatus = {};
    const byMonth = {};

    tasks.forEach((t) => {
      if (!taskInDateRange(t)) return;
      total += 1;
      const typeKey = normalizeTypeOfWork(t.type_of_work);
      if (byType[typeKey] !== undefined) byType[typeKey] += 1;
      else byType.Other += 1;

      if (tasksByType[typeKey]) tasksByType[typeKey].push(t);
      else tasksByType.Other.push(t);

      if (isSelfAssigned(t, mid)) selfAssigned += 1;
      else if (isFromCompany(t)) fromCompany += 1;

      const st = t.status || "Pending";
      byStatus[st] = (byStatus[st] || 0) + 1;

      const stL = st.toLowerCase();
      const timeliness = getTimeliness(t);
      if (stL === "completed") completed += 1;
      // Classify every task with a due date (completed uses done date; open uses today)
      if (timeliness.onTime === true) onTime += 1;
      else if (timeliness.late) late += 1;

      const dRaw = t.given_date || t.created_at;
      if (dRaw) {
        try {
          const d = new Date(dRaw);
          if (!Number.isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) {
              byMonth[key] = {
                total: 0,
                new: 0,
                update: 0,
                error: 0,
                complain: 0,
                meeting: 0,
                onTime: 0,
                late: 0,
              };
            }
            const m = byMonth[key];
            m.total += 1;
            if (typeKey === "New System") m.new += 1;
            else if (typeKey === "Existing System Edit & Update") m.update += 1;
            else if (typeKey === "Error Received") m.error += 1;
            else if (typeKey === "Complaint Report") m.complain += 1;
            else if (typeKey === "Meeting") m.meeting += 1;
            if (timeliness.onTime === true) m.onTime += 1;
            else if (timeliness.late) m.late += 1;
          }
        } catch {
          /* ignore */
        }
      }
    });

    const monthRows = Object.keys(byMonth)
      .sort()
      .map((k) => {
        const [yy, mm] = k.split("-");
        const label = new Date(Number(yy), Number(mm) - 1, 1).toLocaleDateString(
          "en-IN",
          { month: "long", year: "numeric" }
        );
        return { key: k, label, ...byMonth[k] };
      });

    return {
      total,
      selfAssigned,
      fromCompany,
      byType,
      tasksByType,
      byStatus,
      onTime,
      late,
      completed,
      monthRows,
      newSystem: byType["New System"] || 0,
      updated: byType["Existing System Edit & Update"] || 0,
      error: byType["Error Received"] || 0,
      complain: byType["Complaint Report"] || 0,
      meeting: byType["Meeting"] || 0,
    };
  }, [tasks, member?.id, taskInDateRange]);

  const delegationReport = useMemo(() => {
    const inRange = (d) => {
      const raw = d.created_at || d.target_date || d.planned_date;
      if (!raw) return !(dateFrom || dateTo);
      try {
        const day = toInputDate(raw);
        if (!day) return true;
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      } catch {
        return true;
      }
    };

    const rows = (delegatedTasks || []).filter(inRange);
    let pending = 0;
    let completed = 0;
    let extended = 0;
    let onTime = 0;
    let late = 0;
    const delayValues = [];

    rows.forEach((d) => {
      const st = String(d.status || "").toLowerCase();
      if (st === "completed") {
        completed += 1;
        let delay = d.delay_duration;
        if (delay == null && d.actual_date && d.planned_date) {
          try {
            const a = toDayTs(d.actual_date);
            const p = toDayTs(d.planned_date);
            if (a != null && p != null) {
              delay = Math.round((a - p) / (1000 * 60 * 60 * 24));
            }
          } catch {
            /* ignore */
          }
        }
        if (typeof delay === "number") {
          delayValues.push(delay);
          if (delay <= 0) onTime += 1;
          else late += 1;
        }
      } else if (st === "extended") {
        extended += 1;
      } else {
        // Pending / In Progress / other open
        pending += 1;
      }
    });

    const avgDelay =
      delayValues.length > 0
        ? (
            delayValues.reduce((a, b) => a + b, 0) / delayValues.length
          ).toFixed(1)
        : null;

    return {
      total: rows.length,
      pending,
      completed,
      extended,
      onTime,
      late,
      avgDelay,
      rows,
    };
  }, [delegatedTasks, dateFrom, dateTo]);

  const checklistReport = useMemo(() => {
    const inRange = (r) => {
      const raw = r.created_at || r.updated_at;
      if (!raw) return !(dateFrom || dateTo);
      try {
        const day = toInputDate(raw);
        if (!day) return true;
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      } catch {
        return true;
      }
    };
    const rows = (checklistTasks || []).filter(inRange);
    let pending = 0;
    let completed = 0;
    let operational = 0;
    let customer = 0;
    rows.forEach((r) => {
      const st = String(r.status || "").toLowerCase();
      if (st === "completed") completed += 1;
      else pending += 1;
      const tt = String(r.task_type || "").toLowerCase();
      if (tt.includes("customer")) customer += 1;
      else operational += 1;
    });
    const completionPct =
      rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;
    return {
      total: rows.length,
      pending,
      completed,
      operational,
      customer,
      completionPct,
      rows,
    };
  }, [checklistTasks, dateFrom, dateTo]);

  const weeklyReport = useMemo(() => {
    const inRange = (r) => {
      const raw = r.created_at || r.updated_at;
      if (!raw) return !(dateFrom || dateTo);
      try {
        const day = toInputDate(raw);
        if (!day) return true;
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      } catch {
        return true;
      }
    };
    const rows = (weeklyCalls || []).filter(inRange);
    let completed = 0;
    let withProof = 0;
    rows.forEach((r) => {
      if (String(r.status || "").toLowerCase() === "completed") completed += 1;
      if (r.proof_url) withProof += 1;
    });
    const issues = rows.filter(
      (r) =>
        r.has_issue === true ||
        String(r.status || "").toLowerCase() === "issue"
    ).length;
    const completionPct =
      rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;
    return {
      total: rows.length,
      pending: rows.length - completed,
      completed,
      issues,
      withProof,
      completionPct,
      rows,
    };
  }, [weeklyCalls, dateFrom, dateTo]);

  const assignmentPerf = useMemo(() => {
    let total = 0;
    let assignOnTime = 0;
    let lateAssign = 0;
    let pendingAssign = 0;
    let completedOnTime = 0;
    let completedLate = 0;
    let completedCount = 0;
    const completedOnTimeTasks = [];
    const completedLateTasks = [];

    tasks.forEach((t) => {
      if (!taskInDateRange(t)) return;
      total += 1;
      const st = String(t.status || "").toLowerCase();
      const isOpen = st !== "completed" && st !== "cancelled";
      if (isOpen) pendingAssign += 1;

      const at = getAssignTiming(t);
      if (at.onTime === true) assignOnTime += 1;
      else if (at.late) lateAssign += 1;

      if (st === "completed") {
        completedCount += 1;
        const rc = getRequiredCompletion(t);
        if (rc.onTime === true) {
          completedOnTime += 1;
          completedOnTimeTasks.push(t);
        } else if (rc.late) {
          completedLate += 1;
          completedLateTasks.push(t);
        }
      }
    });

    // Average assignment score (0–100):
    // 40% timely assignment + 60% estimation accuracy (completed vs time_required)
    const assignPct = total > 0 ? (assignOnTime / total) * 100 : 0;
    const estimatePct =
      completedCount > 0 ? (completedOnTime / completedCount) * 100 : null;
    const averageAssignment =
      total === 0
        ? 0
        : Math.round(
            estimatePct == null
              ? assignPct
              : assignPct * 0.4 + estimatePct * 0.6
          );

    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      total,
      assignOnTime,
      lateAssign,
      pendingAssign,
      completedOnTime,
      completedLate,
      completedCount,
      averageAssignment,
      assignOnTimePct: pct(assignOnTime),
      lateAssignPct: pct(lateAssign),
      pendingAssignPct: pct(pendingAssign),
      completedOnTimePct: pct(completedOnTime),
      completedLatePct: pct(completedLate),
      completedOnTimeTasks,
      completedLateTasks,
    };
  }, [tasks, taskInDateRange]);

  // ---- Independent pagination for each report table ----
  const monthlyPagination = useTablePagination(
    report.monthRows,
    `${member?.id}|${dateFrom}|${dateTo}`
  );
  const delegationPagination = useTablePagination(
    delegationReport.rows,
    `${member?.id}|${dateFrom}|${dateTo}|${reportFilter}`
  );
  const checklistPagination = useTablePagination(
    checklistReport.rows,
    `${member?.id}|${dateFrom}|${dateTo}|${reportFilter}`
  );
  const weeklyPagination = useTablePagination(
    weeklyReport.rows,
    `${member?.id}|${dateFrom}|${dateTo}|${reportFilter}`
  );

  const exportMemberPdf = () => {
    if (!member) return;
    try {
      const PDF = jsPDF?.jsPDF || jsPDF;
      const table =
        typeof autoTable === "function"
          ? autoTable
          : autoTable?.autoTable || autoTable?.default;
      if (typeof table !== "function") {
        throw new Error(
          "jspdf-autotable is not loaded. Ensure jspdf-autotable is installed."
        );
      }

      const doc = new PDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageWidth - margin * 2;
      let y = 16;
      const mid = member?.id ? Number(member.id) : null;
      const now = new Date();
      const generatedAt = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const dateRangeLabel =
        dateFrom || dateTo
          ? `${dateFrom ? formatDate(dateFrom) : "Start"} - ${dateTo ? formatDate(dateTo) : "Today"}`
          : "All time";

      const reportTasks = tasks.filter((t) => taskInDateRange(t));

      // ---- derived metrics aligned to project fields ----
      let total = 0;
      let newCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      let complainCount = 0;
      let meetingCount = 0;
      let otherCount = 0;
      let onTime = 0;
      let late = 0;
      let completed = 0;
      // Real counts from type_of_work + completed_at vs expected_date_to_close
      const byMonth = {}; // key -> { total, new, update, error, complain, meeting, onTime, late }
      const byTypeTasks = {
        "New System": [],
        "Existing System Edit & Update": [],
        "Error Received": [],
        "Complaint Report": [],
        Meeting: [],
        Other: [],
      };

      reportTasks.forEach((t) => {
        total += 1;
        const typeKey = normalizeTypeOfWork(t.type_of_work);
        if (typeKey === "New System") newCount += 1;
        else if (typeKey === "Existing System Edit & Update") updateCount += 1;
        else if (typeKey === "Error Received") errorCount += 1;
        else if (typeKey === "Complaint Report") complainCount += 1;
        else if (typeKey === "Meeting") meetingCount += 1;
        else otherCount += 1;

        if (byTypeTasks[typeKey]) byTypeTasks[typeKey].push(t);
        else byTypeTasks.Other.push(t);

        const stL = String(t.status || "").toLowerCase();
        const timeliness = getTimeliness(t);
        if (stL === "completed") completed += 1;
        if (timeliness.onTime === true) onTime += 1;
        else if (timeliness.late) late += 1;

        const dRaw = t.given_date || t.created_at;
        if (dRaw) {
          try {
            const d = new Date(dRaw);
            if (!Number.isNaN(d.getTime())) {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              if (!byMonth[key]) {
                byMonth[key] = {
                  total: 0,
                  new: 0,
                  update: 0,
                  error: 0,
                  complain: 0,
                  meeting: 0,
                  onTime: 0,
                  late: 0,
                };
              }
              const m = byMonth[key];
              m.total += 1;
              if (typeKey === "New System") m.new += 1;
              else if (typeKey === "Existing System Edit & Update") m.update += 1;
              else if (typeKey === "Error Received") m.error += 1;
              else if (typeKey === "Complaint Report") m.complain += 1;
              else if (typeKey === "Meeting") m.meeting += 1;
              if (timeliness.onTime === true) m.onTime += 1;
              else if (timeliness.late) m.late += 1;
            }
          } catch {
            /* ignore */
          }
        }
      });

      const ensureSpace = (need = 40) => {
        if (y + need > pageHeight - 18) {
          doc.addPage();
          y = 16;
        }
      };

      const sectionTitle = (title) => {
        ensureSpace(16);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(title, margin, y);
        y += 6;
      };

      // ========== HEADER ==========
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 42, "F");
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 42, pageWidth, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Performance Report", margin, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(191, 219, 254);
      doc.text("Team overview · Person report", margin, 24);
      doc.setTextColor(226, 232, 240);
      doc.text(`Generated: ${generatedAt}`, margin, 32);
      doc.text(`Period: ${dateRangeLabel}`, pageWidth - margin, 32, { align: "right" });

      y = 54;

      // Person name card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentW, 18, 2, 2, "FD");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(String(member.name || "Employee"), margin + 4, y + 8);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const meta = [
        member.username ? `@${member.username}` : null,
        member.teams?.length ? `Teams: ${member.teams.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("   ·   ");
      if (meta) doc.text(meta, margin + 4, y + 14);
      y += 24;

      // ========== 1. SUMMARY ==========
      sectionTitle("1. Summary");
      table(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[
          "Total tasks",
          "New system",
          "Existing system edit and update",
          "Errors solved",
          "Complaint Report",
          "Meetings",
          "Completed on time",
          "Completed late",
        ]],
        body: [[
          String(total),
          String(newCount),
          String(updateCount),
          String(errorCount),
          String(complainCount),
          String(meetingCount),
          `${onTime} (${total > 0 ? Math.round((onTime / total) * 100) : 0}%)`,
          `${late} (${total > 0 ? Math.round((late / total) * 100) : 0}%)`,
        ]],
        theme: "grid",
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 7,
          halign: "center",
          valign: "middle",
        },
        bodyStyles: { fontSize: 9, halign: "center", fontStyle: "bold" },
        styles: { cellPadding: 2.5, overflow: "linebreak" },
      });
      y = (doc.lastAutoTable?.finalY || y) + 10;

      // ========== ASSIGNMENT PERFORMANCE (admin / superadmin) ==========
      if (canViewAssignmentPerf) {
        sectionTitle("2. Assignment Performance");
        const ap = assignmentPerf;
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: 170,
          head: [[
            "Total assign",
            "Assign on time",
            "Late assign",
            "Pending assign",
            "Avg assignment",
            "Completed on time",
            "Completed late",
          ]],
          body: [[
            String(ap.total),
            `${ap.assignOnTime} (${ap.assignOnTimePct}%)`,
            `${ap.lateAssign} (${ap.lateAssignPct}%)`,
            `${ap.pendingAssign} (${ap.pendingAssignPct}%)`,
            `${ap.averageAssignment}%`,
            `${ap.completedOnTime} (${ap.completedOnTimePct}%)`,
            `${ap.completedLate} (${ap.completedLatePct}%)`,
          ]],
          theme: "grid",
          showHead: "firstPage",
          rowPageBreak: "avoid",
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255,
            fontSize: 7,
            halign: "center",
            valign: "middle",
          },
          bodyStyles: { fontSize: 8.5, halign: "center", fontStyle: "bold" },
          styles: { cellPadding: 2.5, overflow: "linebreak" },
        });
        y = (doc.lastAutoTable?.finalY || y) + 8;

        // Drill-style detail: completed late vs time required (most actionable for admin)
        if (ap.completedLateTasks.length > 0) {
          ensureSpace(28);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(
            `Completed late vs time required (${ap.completedLateTasks.length})`,
            margin,
            y
          );
          y += 4;
          const lateRows = ap.completedLateTasks.map((t) => {
            const rc = getRequiredCompletion(t);
            return [
              String(t.task_no || "—"),
              String(t.company?.company_name || t.company?.name || "—"),
              formatDate(t.time_required || t.expected_date_to_close),
              formatDate(t.completed_at),
              rc.delayDays != null ? `${rc.delayDays}d over` : "—",
            ];
          });
          table(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            tableWidth: 160,
            head: [[
              "Task #",
              "Party",
              "Time required",
              "Completed",
              "Over by",
            ]],
            body: lateRows,
            theme: "striped",
            showHead: "firstPage",
            headStyles: {
              fillColor: [225, 29, 72],
              textColor: 255,
              fontSize: 7,
            },
            bodyStyles: { fontSize: 7, cellPadding: 1.4 },
            styles: { overflow: "linebreak" },
          });
          y = (doc.lastAutoTable?.finalY || y) + 8;
        }
      }

      // ========== TYPE DETAIL TABLES ==========
      const typeSections = [
        {
          title: "New System",
          key: "New System",
          headColor: [37, 99, 235],
        },
        {
          title: "Existing System Edit & Update",
          key: "Existing System Edit & Update",
          headColor: [124, 58, 237],
        },
        {
          title: "Error Received",
          key: "Error Received",
          headColor: [217, 119, 6],
        },
        {
          title: "Complaint Report",
          key: "Complaint Report",
          headColor: [225, 29, 72],
        },
        {
          title: "Meetings",
          key: "Meeting",
          headColor: [13, 148, 136],
        },
      ];

      typeSections.forEach((sec) => {
        const list = byTypeTasks[sec.key] || [];
        sectionTitle(`${sec.title} (${list.length})`);
        if (!list.length) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184);
          doc.text("No tasks in this category for the selected period.", margin, y);
          y += 8;
          return;
        }
        const rows = list.map((t) => {
          const party =
            t.company?.company_name || t.company?.name || "—";
          const system = t.systems?.name || "—";
          const target = formatDate(t.expected_date_to_close);
          const completedDate = completedDisplay(t);
          const { delayDays, open } = getTimeliness(t);
          const delay = delayLabel(delayDays, open);
          return [
            String(party),
            String(system),
            target,
            completedDate,
            delay,
          ];
        });
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [[
            "Party name",
            "System name",
            "Target date",
            "Completed date",
            "Delay",
          ]],
          body: rows,
          theme: "striped",
          headStyles: {
            fillColor: sec.headColor,
            textColor: 255,
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8, cellPadding: 2 },
          styles: { overflow: "linebreak" },
          columnStyles: {
            2: { cellWidth: 26, halign: "center" },
            3: { cellWidth: 28, halign: "center" },
            4: { cellWidth: 24, halign: "center" },
          },
        });
        y = (doc.lastAutoTable?.finalY || y) + 10;
      });

      // ========== 7. DELEGATION ==========
      // Keep summary + start of detail together (avoid header-only orphan on previous page)
      ensureSpace(70);
      sectionTitle("7. Delegation");
      const dlg = (() => {
        const inRange = (d) => {
          const raw = d.created_at || d.target_date || d.planned_date;
          if (!raw) return !(dateFrom || dateTo);
          try {
            const day = toInputDate(raw);
            if (!day) return true;
            if (dateFrom && day < dateFrom) return false;
            if (dateTo && day > dateTo) return false;
            return true;
          } catch {
            return true;
          }
        };
        const rows = (delegatedTasks || []).filter(inRange);
        let pending = 0;
        let completed = 0;
        let extended = 0;
        let onTime = 0;
        let late = 0;
        rows.forEach((d) => {
          const st = String(d.status || "").toLowerCase();
          if (st === "completed") {
            completed += 1;
            let delay = d.delay_duration;
            if (delay == null && d.actual_date && d.planned_date) {
              try {
                const a = toDayTs(d.actual_date);
                const p = toDayTs(d.planned_date);
                if (a != null && p != null) {
                  delay = Math.round((a - p) / (1000 * 60 * 60 * 24));
                }
              } catch {
                /* ignore */
              }
            }
            if (typeof delay === "number") {
              if (delay <= 0) onTime += 1;
              else late += 1;
            }
          } else if (st === "extended") extended += 1;
          else pending += 1;
        });
        return { rows, pending, completed, extended, onTime, late, total: rows.length };
      })();

      table(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: 165,
        head: [[
          "Total",
          "Pending",
          "Completed",
          "Extended",
          "On time",
          "Late",
        ]],
        body: [[
          String(dlg.total),
          String(dlg.pending),
          String(dlg.completed),
          String(dlg.extended),
          `${dlg.onTime} (${dlg.total > 0 ? Math.round((dlg.onTime / dlg.total) * 100) : 0}%)`,
          `${dlg.late} (${dlg.total > 0 ? Math.round((dlg.late / dlg.total) * 100) : 0}%)`,
        ]],
        theme: "grid",
        showHead: "firstPage",
        rowPageBreak: "avoid",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontSize: 8.5,
          halign: "center",
        },
        bodyStyles: { fontSize: 10, halign: "center", fontStyle: "bold" },
        styles: { cellPadding: 3, overflow: "linebreak" },
      });
      y = (doc.lastAutoTable?.finalY || y) + 5;

      if (!dlg.rows.length) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No delegated tasks in this period.", margin, y);
        y += 8;
      } else {
        const dlgRows = dlg.rows.map((d) => {
          let delay = d.delay_duration;
          if (delay == null && d.actual_date && d.planned_date) {
            try {
              const a = toDayTs(d.actual_date);
              const p = toDayTs(d.planned_date);
              if (a != null && p != null) {
                delay = Math.round((a - p) / (1000 * 60 * 60 * 24));
              }
            } catch {
              /* ignore */
            }
          }
          const delayTxt =
            delay == null
              ? "—"
              : delay === 0
                ? "On time"
                : delay < 0
                  ? `${Math.abs(delay)}d early`
                  : `${delay}d late`;
          return [
            String(d.serial_number || "—"),
            String(d.task_details || "—"),
            String(d.assigner?.name || d.assigner?.username || "—"),
            formatDate(d.target_date),
            formatDate(d.planned_date),
            formatDate(d.actual_date),
            delayTxt,
            String(d.status || "—"),
          ];
        });
        // Slightly wider than compact, still under full page width (~182mm content)
        ensureSpace(36);
        const dlgDetailW = 168;
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: dlgDetailW,
          head: [[
            "Serial",
            "Task",
            "Assigned by",
            "Target",
            "Planned",
            "Actual",
            "Delay",
            "Status",
          ]],
          body: dlgRows,
          theme: "striped",
          showHead: "firstPage",
          headStyles: {
            fillColor: [67, 56, 202],
            textColor: 255,
            fontSize: 7.5,
            cellPadding: 1.6,
          },
          bodyStyles: { fontSize: 7.5, cellPadding: 1.6 },
          styles: { overflow: "linebreak", cellPadding: 1.6 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 44 },
            2: { cellWidth: 26 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 18 },
            7: { cellWidth: 18 },
          },
        });
        y = (doc.lastAutoTable?.finalY || y) + 8;
      }

      // ========== 8. CHECKLIST ==========
      ensureSpace(50);
      sectionTitle("8. Checklist");
      const clPdf = (() => {
        const inRange = (r) => {
          const raw = r.created_at || r.updated_at;
          if (!raw) return !(dateFrom || dateTo);
          try {
            const day = toInputDate(raw);
            if (!day) return true;
            if (dateFrom && day < dateFrom) return false;
            if (dateTo && day > dateTo) return false;
            return true;
          } catch {
            return true;
          }
        };
        const rows = (checklistTasks || []).filter(inRange);
        let pending = 0;
        let completed = 0;
        let operational = 0;
        let customer = 0;
        rows.forEach((r) => {
          const st = String(r.status || "").toLowerCase();
          if (st === "completed") completed += 1;
          else pending += 1;
          const tt = String(r.task_type || "").toLowerCase();
          if (tt.includes("customer")) customer += 1;
          else operational += 1;
        });
        return {
          rows,
          total: rows.length,
          pending,
          completed,
          operational,
          customer,
          completionPct:
            rows.length > 0
              ? Math.round((completed / rows.length) * 100)
              : 0,
        };
      })();
      table(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: 165,
        head: [[
          "Total",
          "Pending",
          "Completed",
          "Completion %",
          "Operational",
          "Customer",
        ]],
        body: [[
          String(clPdf.total),
          String(clPdf.pending),
          String(clPdf.completed),
          `${clPdf.completionPct}%`,
          String(clPdf.operational),
          String(clPdf.customer),
        ]],
        theme: "grid",
        showHead: "firstPage",
        rowPageBreak: "avoid",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontSize: 8.5,
          halign: "center",
        },
        bodyStyles: { fontSize: 10, halign: "center", fontStyle: "bold" },
        styles: { cellPadding: 3, overflow: "linebreak" },
      });
      y = (doc.lastAutoTable?.finalY || y) + 5;
      if (!clPdf.rows.length) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No checklist tasks in this period.", margin, y);
        y += 8;
      } else {
        const clRows = clPdf.rows.map((r) => [
          String(r.task_name || "—"),
          String(r.task_type || "—"),
          String(r.task_category || "—"),
          Array.isArray(r.days) ? r.days.join(", ") : "—",
          String(r.status || "Pending"),
          String(r.remarks || "—"),
        ]);
        ensureSpace(36);
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: 168,
          head: [["Task", "Type", "Category", "Days", "Status", "Remarks"]],
          body: clRows,
          theme: "striped",
          showHead: "firstPage",
          headStyles: {
            fillColor: [5, 150, 105],
            textColor: 255,
            fontSize: 7.5,
            cellPadding: 1.6,
          },
          bodyStyles: { fontSize: 7.5, cellPadding: 1.6 },
          styles: { overflow: "linebreak", cellPadding: 1.6 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 32 },
            2: { cellWidth: 22 },
            3: { cellWidth: 28 },
            4: { cellWidth: 20 },
            5: { cellWidth: 26 },
          },
        });
        y = (doc.lastAutoTable?.finalY || y) + 8;
      }

      // ========== 9. WEEKLY CALLS ==========
      ensureSpace(50);
      sectionTitle("9. Weekly Calls");
      const wcPdf = (() => {
        const inRange = (r) => {
          const raw = r.created_at || r.updated_at;
          if (!raw) return !(dateFrom || dateTo);
          try {
            const day = toInputDate(raw);
            if (!day) return true;
            if (dateFrom && day < dateFrom) return false;
            if (dateTo && day > dateTo) return false;
            return true;
          } catch {
            return true;
          }
        };
        const rows = (weeklyCalls || []).filter(inRange);
        let completed = 0;
        let issues = 0;
        let withProof = 0;
        rows.forEach((r) => {
          const st = String(r.status || "").toLowerCase();
          if (st === "completed") completed += 1;
          if (
            r.has_issue === true ||
            st === "issue"
          )
            issues += 1;
          if (r.proof_url) withProof += 1;
        });
        return {
          rows,
          total: rows.length,
          pending: rows.length - completed,
          completed,
          issues,
          withProof,
          completionPct:
            rows.length > 0
              ? Math.round((completed / rows.length) * 100)
              : 0,
        };
      })();
      table(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: 165,
        head: [[
          "Total",
          "Pending",
          "Completed",
          "Issues",
          "With proof",
          "Completion %",
        ]],
        body: [[
          String(wcPdf.total),
          String(wcPdf.pending),
          String(wcPdf.completed),
          String(wcPdf.issues),
          String(wcPdf.withProof),
          `${wcPdf.completionPct}%`,
        ]],
        theme: "grid",
        showHead: "firstPage",
        rowPageBreak: "avoid",
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: 255,
          fontSize: 8.5,
          halign: "center",
        },
        bodyStyles: { fontSize: 10, halign: "center", fontStyle: "bold" },
        styles: { cellPadding: 3, overflow: "linebreak" },
      });
      y = (doc.lastAutoTable?.finalY || y) + 5;
      if (!wcPdf.rows.length) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No weekly calls in this period.", margin, y);
        y += 8;
      } else {
        const wcRows = wcPdf.rows.map((r) => [
          String(r.party_name || "—"),
          String(r.responsible_person || "—"),
          String(r.task_description || "—"),
          Array.isArray(r.calling_days) ? r.calling_days.join(", ") : "—",
          String(r.status || "Pending"),
          r.has_issue === true ? "Yes" : r.has_issue === false ? "No" : "—",
          r.customer_said
            ? String(r.customer_said).slice(0, 80)
            : "—",
        ]);
        ensureSpace(36);
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          tableWidth: 168,
          head: [[
            "Party",
            "Responsible",
            "Description",
            "Days",
            "Status",
            "Issue",
            "Customer said",
          ]],
          body: wcRows,
          theme: "striped",
          showHead: "firstPage",
          headStyles: {
            fillColor: [124, 58, 237],
            textColor: 255,
            fontSize: 7.5,
            cellPadding: 1.6,
          },
          bodyStyles: { fontSize: 7.5, cellPadding: 1.6 },
          styles: { overflow: "linebreak", cellPadding: 1.6 },
          columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 24 },
            2: { cellWidth: 36 },
            3: { cellWidth: 22 },
            4: { cellWidth: 18 },
            5: { cellWidth: 14 },
            6: { cellWidth: 26 },
          },
        });
        y = (doc.lastAutoTable?.finalY || y) + 8;
      }

      sectionTitle("10. Monthly report");
      const monthKeys = Object.keys(byMonth).sort();
      if (!monthKeys.length) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("No monthly data in this period.", margin, y);
        y += 8;
      } else {
        const monthRows = monthKeys.map((k) => {
          const [yy, mm] = k.split("-");
          const label = new Date(Number(yy), Number(mm) - 1, 1).toLocaleDateString(
            "en-IN",
            { month: "long", year: "numeric" }
          );
          const m = byMonth[k];
          return [
            label,
            String(m.total),
            String(m.new),
            String(m.update),
            String(m.error),
            String(m.complain),
            String(m.meeting || 0),
            String(m.onTime),
            String(m.late),
          ];
        });
        // Keep whole monthly table on one page when possible
        ensureSpace(20 + monthRows.length * 8);
        table(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [[
            "Month",
            "Total tasks",
            "New system",
            "Existing system edit and updates",
            "Errors solved",
            "Complaint Report",
            "Meetings",
            "Completed on time",
            "Completed late",
          ]],
          body: monthRows,
          theme: "grid",
          headStyles: {
            fillColor: [14, 165, 233],
            textColor: 255,
            fontSize: 6.5,
            halign: "center",
            valign: "middle",
          },
          bodyStyles: { fontSize: 7.5, halign: "center" },
          columnStyles: {
            0: { halign: "left", cellWidth: 28 },
          },
          styles: { cellPadding: 2, overflow: "linebreak" },
        });
        y = (doc.lastAutoTable?.finalY || y) + 10;
      }

      // ========== 8. DELEGATION ==========
      // Footer on all pages (supports mixed portrait + landscape)
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        const m = 12;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(m, ph - 10, pw - m, ph - 10);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${member.name || "Employee"}  ·  Confidential  ·  ${generatedAt}`,
          m,
          ph - 5
        );
        doc.text(`Page ${i} of ${pageCount}`, pw - m, ph - 5, {
          align: "right",
        });
      }

      const safeName = String(member.name || "employee")
        .replace(/[^\w\-]+/g, "_")
        .slice(0, 40);
      const rangePart =
        dateFrom || dateTo ? `_${dateFrom || "start"}_${dateTo || "end"}` : "";
      doc.save(`Employee_Report_${safeName}${rangePart}.pdf`);
    } catch (err) {
      console.error("Export PDF failed:", err);
      window.alert(
        `PDF export failed: ${err?.message || err}. Check browser console for details.`
      );
    }
  };

  // ---- Monthly report table ----
  const renderMonthlyRow = (m) => (
    <tr key={m.key} className="hover:bg-slate-50/70 transition">
      <td className="px-3.5 py-2.5 text-center font-medium text-slate-800 whitespace-nowrap align-middle">
        {m.label}
      </td>
      <td className="px-3 py-2.5 text-center font-bold tabular-nums text-slate-900 align-middle">
        {m.total}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 align-middle">
        {m.new}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 align-middle">
        {m.update}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 align-middle">
        {m.error}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 align-middle">
        {m.complain}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-600 align-middle">
        {m.meeting}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-emerald-700 align-middle">
        {m.onTime}
      </td>
      <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-rose-600 align-middle">
        {m.late}
      </td>
    </tr>
  );

  const renderMonthlyCard = (m) => (
    <div key={m.key} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {m.label}
          </span>
        </div>
        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
          Total: {m.total}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">New</span>
          <span className="font-semibold text-gray-900">{m.new}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Update</span>
          <span className="font-semibold text-gray-900">{m.update}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Errors</span>
          <span className="font-semibold text-rose-500">{m.error}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Complain</span>
          <span className="font-semibold text-orange-500">{m.complain}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meeting</span>
          <span className="font-semibold text-blue-600">{m.meeting}</span>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-200/60 pt-3">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">On Time</span>
            <span className="font-semibold text-emerald-700">{m.onTime}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Late</span>
            <span className="font-semibold text-rose-600">{m.late}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!open || !member) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white sm:rounded-3xl shadow-2xl shadow-slate-900/25 ring-1 ring-black/5 flex flex-col overflow-hidden"
        style={{ animation: "teamModalIn 0.22s ease-out" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-500/25 shrink-0">
                {(member.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {member.name}
                </h2>
                <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="font-mono">@{member.username}</span>
                  {member.teams?.length > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="truncate">{member.teams.join(", ")}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 inline-flex p-1 bg-white/80 rounded-2xl ring-1 ring-gray-100 shadow-sm">
            {[
              { id: "active", label: "Pending", count: counts.active, icon: Clock },
              { id: "report", label: "Report", count: report.total, icon: BarChart3 },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== "report") setReportFilter(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                  tab === t.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    tab === t.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-3 border-b border-gray-50 bg-gray-50/40 flex flex-col sm:flex-row gap-2">
          {tab !== "report" ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task, company, system…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center">
              <p className="text-xs text-gray-500 font-medium">
                Filter report by date
                {(dateFrom || dateTo) && (
                  <span className="ml-2 text-blue-600">
                    ({dateFrom ? formatDate(dateFrom) : "…"} → {dateTo ? formatDate(dateTo) : "…"})
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            {tab !== "report" && (
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="all">All status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs text-gray-700 border-0 bg-transparent focus:outline-none w-[110px]"
                title="From date"
              />
              <span className="text-gray-300 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs text-gray-700 border-0 bg-transparent focus:outline-none w-[110px]"
                title="To date"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-[10px] font-semibold text-blue-700 hover:underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
            {tab === "report" && (
              <button
                type="button"
                onClick={exportMemberPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-sm shadow-blue-600/20 transition"
                title="Download full employee report as PDF"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {tab === "report" && !reportFilter ? (
            loading ? (
              <div className="py-16 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin inline mr-2" />
                Loading report…
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary — stat cards */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Summary
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {report.total} task{report.total === 1 ? "" : "s"} in selected period
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        key: "total",
                        label: "Total tasks",
                        count: report.total,
                        drill: true,
                        accent: "from-slate-600 to-slate-800",
                        ring: "ring-slate-100",
                        bg: "bg-slate-50",
                      },
                      {
                        key: "New System",
                        label: "New system",
                        count: report.newSystem,
                        drill: true,
                        accent: "from-blue-500 to-blue-600",
                        ring: "ring-blue-100",
                        bg: "bg-blue-50/50",
                      },
                      {
                        key: "Existing System Edit & Update",
                        label: "Edit & update",
                        count: report.updated,
                        drill: true,
                        accent: "from-violet-500 to-violet-600",
                        ring: "ring-violet-100",
                        bg: "bg-violet-50/50",
                      },
                      {
                        key: "Error Received",
                        label: "Errors solved",
                        count: report.error,
                        drill: true,
                        accent: "from-amber-500 to-orange-500",
                        ring: "ring-amber-100",
                        bg: "bg-amber-50/50",
                      },
                      {
                        key: "Complaint Report",
                        label: "Complaints",
                        count: report.complain,
                        drill: true,
                        accent: "from-rose-500 to-rose-600",
                        ring: "ring-rose-100",
                        bg: "bg-rose-50/50",
                      },
                      {
                        key: "Meeting",
                        label: "Meetings",
                        count: report.meeting,
                        drill: true,
                        accent: "from-teal-500 to-teal-600",
                        ring: "ring-teal-100",
                        bg: "bg-teal-50/50",
                      },
                      {
                        key: "onTime",
                        label: "On time",
                        count: report.onTime,
                        drill: false,
                        pct:
                          report.total > 0
                            ? Math.round((report.onTime / report.total) * 100)
                            : 0,
                        accent: "from-emerald-500 to-emerald-600",
                        ring: "ring-emerald-100",
                        bg: "bg-emerald-50/50",
                      },
                      {
                        key: "late",
                        label: "Late",
                        count: report.late,
                        drill: false,
                        pct:
                          report.total > 0
                            ? Math.round((report.late / report.total) * 100)
                            : 0,
                        accent: "from-rose-500 to-pink-600",
                        ring: "ring-rose-100",
                        bg: "bg-rose-50/40",
                      },
                    ].map((col) => {
                      if (!col.drill) {
                        return (
                          <div
                            key={col.key}
                            className={`rounded-2xl border border-slate-100 ${col.bg} p-3.5 shadow-sm ring-1 ${col.ring}`}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {col.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
                              {col.count}
                              {col.pct != null && (
                                <span className="ml-1.5 text-xs font-semibold text-slate-400">
                                  {col.pct}%
                                </span>
                              )}
                            </p>
                            <div
                              className={`mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r ${col.accent}`}
                            />
                          </div>
                        );
                      }
                      return (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => setReportFilter(col.key)}
                          title={`View ${col.label.toLowerCase()} tasks`}
                          className={`group relative text-left rounded-2xl border border-slate-200/80 ${col.bg} p-3.5 shadow-sm ring-1 ${col.ring} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 hover:ring-blue-100 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {col.label}
                            </p>
                            <span className="text-[10px] font-semibold text-blue-600 opacity-70 group-hover:opacity-100 transition-opacity">
                              View →
                            </span>
                          </div>
                          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                            {col.count}
                            {col.pct != null && (
                              <span className="ml-1.5 text-xs font-semibold text-slate-400">
                                {col.pct}%
                              </span>
                            )}
                          </p>
                          <div
                            className={`mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r ${col.accent} group-hover:w-12 transition-all`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Assignment Performance */}
                {canViewAssignmentPerf && (
                  <section>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Assignment Performance
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                          Admin / HOD
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-white shadow-sm shadow-indigo-200">
                        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                          Score
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {assignmentPerf.averageAssignment}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {[
                        {
                          label: "Total assign",
                          value: assignmentPerf.total,
                          filter: "total",
                          tone: "text-slate-900",
                        },
                        {
                          label: "Assign on time",
                          value: assignmentPerf.assignOnTime,
                          pct: assignmentPerf.assignOnTimePct,
                          filter: "assign-on-time",
                          tone: "text-emerald-700",
                        },
                        {
                          label: "Late assign",
                          value: assignmentPerf.lateAssign,
                          pct: assignmentPerf.lateAssignPct,
                          filter: "assign-late",
                          tone: "text-rose-600",
                        },
                        {
                          label: "Pending assign",
                          value: assignmentPerf.pendingAssign,
                          pct: assignmentPerf.pendingAssignPct,
                          filter: "assign-pending",
                          tone: "text-amber-700",
                        },
                        {
                          label: "Completed on time",
                          value: assignmentPerf.completedOnTime,
                          pct: assignmentPerf.completedOnTimePct,
                          filter: "assign-completed-on-time",
                          tone: "text-teal-700",
                        },
                        {
                          label: "Completed late",
                          value: assignmentPerf.completedLate,
                          pct: assignmentPerf.completedLatePct,
                          filter: "assign-completed-late",
                          tone: "text-rose-600",
                        },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setReportFilter(item.filter)}
                          title={`View ${item.label.toLowerCase()}`}
                          className="group text-left rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-black/[0.02] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md hover:ring-indigo-100 active:translate-y-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {item.label}
                            </p>
                            <span className="text-[10px] font-semibold text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity">
                              View →
                            </span>
                          </div>
                          <p
                            className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${item.tone}`}
                          >
                            {item.value}
                            {item.pct != null && (
                              <span className="ml-1.5 text-xs font-semibold text-slate-400">
                                {item.pct}%
                              </span>
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Type breakdown */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      By work type
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {[
                      {
                        key: "New System",
                        title: "New System",
                        count: report.newSystem,
                        color: "blue",
                        bar: "bg-blue-500",
                      },
                      {
                        key: "Existing System Edit & Update",
                        title: "Existing Edit & Update",
                        count: report.updated,
                        color: "violet",
                        bar: "bg-violet-500",
                      },
                      {
                        key: "Error Received",
                        title: "Error Received",
                        count: report.error,
                        color: "amber",
                        bar: "bg-amber-500",
                      },
                      {
                        key: "Complaint Report",
                        title: "Complaint Report",
                        count: report.complain,
                        color: "rose",
                        bar: "bg-rose-500",
                      },
                      {
                        key: "Meeting",
                        title: "Meetings",
                        count: report.meeting,
                        color: "teal",
                        bar: "bg-teal-500",
                      },
                    ].map((sec) => {
                      const list = (report.tasksByType?.[sec.key] || []).slice(
                        0,
                        3
                      );
                      return (
                        <div
                          key={sec.key}
                          role={sec.count > 0 ? "button" : undefined}
                          tabIndex={sec.count > 0 ? 0 : undefined}
                          onClick={() => {
                            if (sec.count > 0) setReportFilter(sec.key);
                          }}
                          onKeyDown={(e) => {
                            if (
                              sec.count > 0 &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              setReportFilter(sec.key);
                            }
                          }}
                          className={`rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden flex flex-col transition-all duration-200 ${
                            sec.count > 0
                              ? "cursor-pointer hover:border-blue-200 hover:shadow-md hover:ring-blue-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-50">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`h-2 w-2 rounded-full shrink-0 ${sec.bar}`}
                              />
                              <h4 className="text-sm font-semibold text-slate-800 truncate">
                                {sec.title}
                              </h4>
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                                {sec.count}
                              </span>
                            </div>
                            {sec.count > 0 && (
                              <span className="text-[11px] font-semibold text-blue-600 shrink-0">
                                View all →
                              </span>
                            )}
                          </div>
                          <div className="px-4 py-3 flex-1">
                            {sec.count === 0 ? (
                              <p className="text-xs text-slate-400 py-2">
                                No tasks in this category
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {list.map((t) => {
                                  const party =
                                    t.company?.company_name ||
                                    t.company?.name ||
                                    "—";
                                  const system = t.systems?.name || "—";
                                  return (
                                    <li
                                      key={t.id}
                                      className="rounded-xl bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100"
                                    >
                                      <p className="text-xs font-semibold text-slate-800 truncate">
                                        {party}
                                      </p>
                                      <p className="text-[11px] text-slate-500 truncate">
                                        {system}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400">
                                        <span>
                                          Target{" "}
                                          {formatDate(
                                            t.expected_date_to_close
                                          )}
                                        </span>
                                        <span>·</span>
                                        <span>{t.status || "Pending"}</span>
                                      </div>
                                    </li>
                                  );
                                })}
                                {sec.count > 3 && (
                                  <li className="text-[11px] text-slate-400 text-center pt-0.5">
                                    +{sec.count - 3} more
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Ops modules: Delegation / Checklist / Weekly */}
                <section>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Checklist &amp; Delegation
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Internal ops for this person · click to drill into details
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Delegation card */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50/80">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          <h4 className="text-sm font-semibold text-slate-800">
                            Delegation
                          </h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 tabular-nums">
                          {delegationReport.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-slate-100/80 border-b border-slate-100">
                        {[
                          {
                            label: "Pending",
                            v: delegationReport.pending,
                            c: "text-amber-700",
                          },
                          {
                            label: "Done",
                            v: delegationReport.completed,
                            c: "text-emerald-700",
                          },
                          {
                            label: "Extended",
                            v: delegationReport.extended,
                            c: "text-violet-700",
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="bg-white px-2 py-2.5 text-center"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              {m.label}
                            </p>
                            <p
                              className={`text-lg font-bold tabular-nums ${m.c}`}
                            >
                              {m.v}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-3 py-2.5 text-center text-[11px] text-slate-500">
                        <div>
                          <span className="font-semibold text-teal-700">
                            {delegationReport.onTime}
                          </span>{" "}
                          on time
                        </div>
                        <div>
                          <span className="font-semibold text-rose-600">
                            {delegationReport.late}
                          </span>{" "}
                          late
                        </div>
                        <div>
                          avg{" "}
                          <span className="font-semibold text-slate-700">
                            {delegationReport.avgDelay != null
                              ? `${delegationReport.avgDelay}d`
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto p-3 pt-0">
                        <button
                          type="button"
                          onClick={() => setReportFilter("delegation")}
                          className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition"
                        >
                          View tasks →
                        </button>
                      </div>
                    </div>

                    {/* Checklist card */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-50/80">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <h4 className="text-sm font-semibold text-slate-800">
                            Checklist
                          </h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 tabular-nums">
                          {checklistReport.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-slate-100/80 border-b border-slate-100">
                        {[
                          {
                            label: "Pending",
                            v: checklistReport.pending,
                            c: "text-amber-700",
                          },
                          {
                            label: "Done",
                            v: checklistReport.completed,
                            c: "text-emerald-700",
                          },
                          {
                            label: "Rate",
                            v: `${checklistReport.completionPct}%`,
                            c: "text-teal-700",
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="bg-white px-2 py-2.5 text-center"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              {m.label}
                            </p>
                            <p
                              className={`text-lg font-bold tabular-nums ${m.c}`}
                            >
                              {m.v}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-3 py-2.5 text-center text-[11px] text-slate-500">
                        <div>
                          <span className="font-semibold text-indigo-700">
                            {checklistReport.operational}
                          </span>{" "}
                          operational
                        </div>
                        <div>
                          <span className="font-semibold text-violet-700">
                            {checklistReport.customer}
                          </span>{" "}
                          customer
                        </div>
                      </div>
                      <div className="mt-auto p-3 pt-0">
                        <button
                          type="button"
                          onClick={() => setReportFilter("checklist")}
                          className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition"
                        >
                          View tasks →
                        </button>
                      </div>
                    </div>

                    {/* Weekly Calls card */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-white border-b border-violet-50/80">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-violet-500" />
                          <h4 className="text-sm font-semibold text-slate-800">
                            Weekly Calls
                          </h4>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700 tabular-nums">
                          {weeklyReport.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-slate-100/80 border-b border-slate-100">
                        {[
                          {
                            label: "Pending",
                            v: weeklyReport.pending,
                            c: "text-amber-700",
                          },
                          {
                            label: "Done",
                            v: weeklyReport.completed,
                            c: "text-emerald-700",
                          },
                          {
                            label: "Issues",
                            v: weeklyReport.issues,
                            c: "text-rose-600",
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="bg-white px-2 py-2.5 text-center"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              {m.label}
                            </p>
                            <p
                              className={`text-lg font-bold tabular-nums ${m.c}`}
                            >
                              {m.v}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-3 py-2.5 text-center text-[11px] text-slate-500">
                        <div>
                          <span className="font-semibold text-indigo-700">
                            {weeklyReport.withProof}
                          </span>{" "}
                          with proof
                        </div>
                        <div>
                          <span className="font-semibold text-teal-700">
                            {weeklyReport.completionPct}%
                          </span>{" "}
                          complete
                        </div>
                      </div>
                      <div className="mt-auto p-3 pt-0">
                        <button
                          type="button"
                          onClick={() => setReportFilter("weekly")}
                          className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 active:scale-[0.98] transition"
                        >
                          View calls →
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Monthly report */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Monthly report
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
                    {!report.monthRows?.length ? (
                      <p className="px-4 py-8 text-sm text-slate-400 text-center">
                        No monthly data in this period
                      </p>
                    ) : (
                      <DataTable
                        headers={MONTHLY_HEADERS}
                        data={monthlyPagination.pageItems}
                        renderRow={renderMonthlyRow}
                        renderCard={renderMonthlyCard}
                        minWidth="min-w-[700px]"
                        {...monthlyPagination.paginationProps}
                      />
                    )}
                  </div>
                </section>

              </div>
            )
          ) : tab === "report" &&
            (reportFilter === "delegation" ||
              reportFilter === "checklist" ||
              reportFilter === "weekly") ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setReportFilter(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  ← Back to Report
                </button>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {reportFilter === "delegation"
                      ? "Delegation tasks"
                      : reportFilter === "checklist"
                        ? "Checklist tasks"
                        : "Weekly calls"}
                  </span>
                  {" · "}
                  {reportFilter === "delegation"
                    ? delegationReport.rows.length
                    : reportFilter === "checklist"
                      ? checklistReport.rows.length
                      : weeklyReport.rows.length}{" "}
                  item
                  {(reportFilter === "delegation"
                    ? delegationReport.rows.length
                    : reportFilter === "checklist"
                      ? checklistReport.rows.length
                      : weeklyReport.rows.length) === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              {reportFilter === "delegation" && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
                  {delegationReport.rows.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-gray-400 text-center">
                      No delegated tasks in this period
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm hidden lg:table">
                          <thead>
                            <tr className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                            <th className="font-semibold px-3 py-2.5 text-center">Serial</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Task</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Assigned by</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Target</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Planned</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Actual</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Delay</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {delegationReport.rows.map((d) => {
                            const by =
                              d.assigner?.name || d.assigner?.username || "—";
                            let delay = d.delay_duration;
                            if (delay == null && d.actual_date && d.planned_date) {
                              try {
                                const a = toDayTs(d.actual_date);
                                const p = toDayTs(d.planned_date);
                                if (a != null && p != null) {
                                  delay = Math.round((a - p) / (1000 * 60 * 60 * 24));
                                }
                              } catch {
                                /* ignore */
                              }
                            }
                            const delayTxt =
                              delay == null
                                ? "—"
                                : delay === 0
                                  ? "On time"
                                  : delay < 0
                                    ? `${Math.abs(delay)}d early`
                                    : `${delay}d late`;
                            return (
                              <tr key={d.id} className="hover:bg-slate-50/70 transition">
                                <td className="px-3 py-2.5 font-mono text-[11px] font-semibold text-indigo-700 text-center align-middle">
                                  {d.serial_number || "—"}
                                </td>
                                <td className="px-3 py-2.5 text-gray-800 max-w-[200px] text-center align-middle">
                                  <span className="line-clamp-2">{d.task_details || "—"}</span>
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 text-center align-middle">{by}</td>
                                <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums text-[13px] align-middle">
                                  <div>{formatDate(d.target_date)}</div>
                                  {d.target_time && (
                                    <div className="mt-0.5">
                                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                        <Clock className="h-2.5 w-2.5 text-indigo-500" />
                                        {d.target_time}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums text-[13px] align-middle">
                                  {formatDate(d.planned_date)}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums text-[13px] align-middle">
                                  {formatDate(d.actual_date)}
                                </td>
                                <td className="px-3 py-2.5 text-center align-middle">
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {delayTxt}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center align-middle">
                                  <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                                    {d.status || "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="block lg:hidden flex flex-col gap-4 p-3 sm:p-4 bg-transparent">
                      {delegationReport.rows.map((d) => {
                        let delay = d.delay_duration;
                        if (delay == null && d.actual_date && d.planned_date) {
                          try {
                            const a = toDayTs(d.actual_date);
                            const p = toDayTs(d.planned_date);
                            if (a != null && p != null) {
                              delay = Math.round((a - p) / (1000 * 60 * 60 * 24));
                            }
                          } catch {
                            /* ignore */
                          }
                        }
                        const delayTxt =
                          delay == null
                            ? "—"
                            : delay === 0
                              ? "On time"
                              : delay < 0
                                ? `${Math.abs(delay)}d early`
                                : `${delay}d late`;
                        return (
                          <div key={d.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
                            <div className="flex justify-between items-start mt-1">
                              <div>
                                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                                  {d.serial_number || "—"}
                                </span>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">{d.task_details || "—"}</p>
                              </div>
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                                {d.status || "Pending"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned By</span>
                                <span className="font-semibold text-gray-900">{d.assigner?.name || d.assigner?.username || "—"}</span>
                              </div>
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target</span>
                                <div className="font-semibold text-gray-900">
                                  {formatDate(d.target_date)}
                                  {d.target_time && (
                                    <div className="mt-0.5">
                                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                        <Clock className="h-2.5 w-2.5 text-indigo-500" />
                                        {d.target_time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Planned</span>
                                <span className="font-semibold text-gray-900">{formatDate(d.planned_date)}</span>
                              </div>
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actual</span>
                                <span className="font-semibold text-gray-900">{formatDate(d.actual_date)}</span>
                              </div>
                              <div className="col-span-2 pt-2 mt-2 border-t border-gray-200/50">
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delay</span>
                                <span className={`font-semibold ${delayTxt === 'On time' ? 'text-emerald-600' : delayTxt.includes('late') ? 'text-rose-600' : delayTxt.includes('early') ? 'text-blue-600' : 'text-gray-900'}`}>{delayTxt}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </>
                  )}
                </div>
              )}

              {reportFilter === "checklist" && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
                  {checklistReport.rows.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-gray-400 text-center">
                      No checklist tasks in this period
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm hidden lg:table">
                          <thead>
                            <tr className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                            <th className="font-semibold px-3 py-2.5 text-center">Task</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Type</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Category</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Days</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Status</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {checklistReport.rows.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-3 py-2.5 text-gray-800 max-w-[180px] text-center align-middle">
                                <span className="line-clamp-2 font-medium">{r.task_name || "—"}</span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-600 text-center align-middle">{r.task_type || "—"}</td>
                              <td className="px-3 py-2.5 capitalize text-gray-600 text-center align-middle">{r.task_category || "—"}</td>
                              <td className="px-3 py-2.5 text-gray-500 text-[12px] text-center align-middle">
                                {Array.isArray(r.days) ? r.days.join(", ") : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center align-middle">
                                <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                                  {r.status || "Pending"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[140px] text-center align-middle">
                                <span className="line-clamp-2">{r.remarks || "—"}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="block lg:hidden flex flex-col gap-4 p-3 sm:p-4 bg-transparent">
                      {checklistReport.rows.map((r) => (
                        <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
                          <div className="flex justify-between items-start mt-1">
                            <div>
                              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                                {r.task_name || "—"}
                              </span>
                              <p className="text-xs font-medium text-gray-500 mt-0.5">{r.task_type || "—"}</p>
                            </div>
                            <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                              {r.status || "Pending"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                            <div>
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</span>
                              <span className="font-semibold text-gray-900 capitalize">{r.task_category || "—"}</span>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Days</span>
                              <span className="font-semibold text-gray-900">{Array.isArray(r.days) ? r.days.join(", ") : "—"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks</span>
                              <span className="font-semibold text-gray-900">{r.remarks || "—"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              )}

              {reportFilter === "weekly" && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
                  {weeklyReport.rows.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-gray-400 text-center">
                      No weekly calls in this period
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm hidden lg:table">
                          <thead>
                            <tr className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                            <th className="font-semibold px-3 py-2.5 text-center">Party</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Responsible</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Description</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Days</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Status</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Issue</th>
                            <th className="font-semibold px-3 py-2.5 text-center">Customer said</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {weeklyReport.rows.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-3 py-2.5 font-medium text-gray-800 text-center align-middle">{r.party_name || "—"}</td>
                              <td className="px-3 py-2.5 text-gray-600 text-center align-middle">{r.responsible_person || "—"}</td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[180px] text-center align-middle">
                                <span className="line-clamp-2">{r.task_description || "—"}</span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 text-[12px] text-center align-middle">
                                {Array.isArray(r.calling_days) ? r.calling_days.join(", ") : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center align-middle">
                                <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                                  {r.status || "Pending"}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center text-sm font-semibold align-middle">
                                {r.has_issue === true
                                  ? "Yes"
                                  : r.has_issue === false
                                    ? "No"
                                    : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[140px] text-center align-middle">
                                <span className="line-clamp-2">{r.customer_said || "—"}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="block lg:hidden flex flex-col gap-4 p-3 sm:p-4 bg-transparent">
                      {weeklyReport.rows.map((r) => (
                        <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
                          <div className="flex justify-between items-start mt-1">
                            <div>
                              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                                {r.party_name || "—"}
                              </span>
                              <p className="text-xs font-medium text-gray-500 mt-0.5">{r.responsible_person || "—"}</p>
                            </div>
                            <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
                              {r.status || "Pending"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                            <div className="col-span-2">
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
                              <span className="font-semibold text-gray-900 line-clamp-2">{r.task_description || "—"}</span>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Days</span>
                              <span className="font-semibold text-gray-900">{Array.isArray(r.calling_days) ? r.calling_days.join(", ") : "—"}</span>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Issue</span>
                              <span className="font-semibold text-gray-900">
                                {r.has_issue === true ? "Yes" : r.has_issue === false ? "No" : "—"}
                              </span>
                            </div>
                            <div className="col-span-2 pt-2 mt-2 border-t border-gray-200/50">
                              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Said</span>
                              <span className="font-semibold text-gray-900 line-clamp-2">{r.customer_said || "—"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin inline mr-2" />
              Loading tasks…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              {tab === "report" && reportFilter && (
                <button
                  type="button"
                  onClick={() => setReportFilter(null)}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  ← Back to Report
                </button>
              )}
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                No tasks in this category
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tab === "report"
                  ? "Try another report category"
                  : "Try clearing date or status filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tab === "report" && reportFilter && (
                <div className="flex items-center justify-between gap-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setReportFilter(null)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    ← Back to Report
                  </button>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      {reportFilter === "total"
                        ? "All tasks"
                        : reportFilter === "self"
                          ? "Self assigned"
                          : reportFilter === "company"
                            ? "From company"
                            : reportFilter === "assign-on-time"
                              ? "Assign on time"
                              : reportFilter === "assign-late"
                                ? "Late assign"
                                : reportFilter === "assign-pending"
                                  ? "Pending assign"
                                  : reportFilter === "assign-completed-on-time"
                                    ? "Completed on time (vs time required)"
                                    : reportFilter === "assign-completed-late"
                                      ? "Completed late (vs time required)"
                                      : reportFilter}
                    </span>
                    {" · "}
                    {filtered.length} task{filtered.length === 1 ? "" : "s"}
                  </p>
                </div>
              )}
              {filtered.map((t) => {
                const company =
                  t.company?.company_name || t.company?.name || "—";
                const system = t.systems?.name || "—";
                const st = t.status || "Pending";
                return (
                  <div
                    key={t.id}
                    className="group rounded-2xl border border-gray-100 bg-white p-4 hover:border-blue-200 hover:shadow-md hover:bg-slate-50/40 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {t.task_no && (
                            <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              #{t.task_no}
                            </span>
                          )}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${
                              STATUS_STYLE[st] || STATUS_STYLE.Pending
                            }`}
                          >
                            {st}
                          </span>
                          {(t.is_testing_issue || t.relation_type === "Testing Issue" || (typeof t.description_of_work === "string" && /\[Testing issue/i.test(t.description_of_work))) && (
                            <span
                              className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                              title={t.issue_remarks ? `Rejected Reason: ${t.issue_remarks}` : "Rejected from testing"}
                            >
                              Rejected from Testing
                            </span>
                          )}
                          {t.priority && (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.Medium
                              }`}
                            >
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {t.description_of_work ||
                            t.type_of_work ||
                            "Untitled task"}
                        </p>
                        {t.type_of_work && t.description_of_work && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.type_of_work}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {system}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Given {formatDate(t.given_date || t.created_at)}
                      </span>
                      {t.expected_date_to_close && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {formatDate(t.expected_date_to_close)}
                        </span>
                      )}
                      {t.completed_at && (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Done {formatDate(t.completed_at)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {canReassign &&
                      !t.is_subtask &&
                      st !== "Completed" &&
                      st !== "Cancelled" &&
                      memberOptions.length > 0 ? (
                        <>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-900">
                            <User className="w-3 h-3" />
                            M1 <span className="text-red-500">*</span>:
                            <Select
                              value={t.assigned_member_1 || ""}
                              disabled={reassigningId === t.id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleReassign(
                                  t,
                                  "assigned_member_1",
                                  e.target.value || null
                                )
                              }
                              className="ml-0.5 max-w-[180px] text-[11px] font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-50"
                            >
                              {memberOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-900">
                            <User className="w-3 h-3" />
                            M2:
                            <Select
                              value={t.assigned_member_2 || ""}
                              disabled={reassigningId === t.id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleReassign(
                                  t,
                                  "assigned_member_2",
                                  e.target.value || null
                                )
                              }
                              className="ml-0.5 max-w-[180px] text-[11px] font-medium rounded-lg border border-violet-200 bg-violet-50 text-violet-900 px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400/40 disabled:opacity-50"
                            >
                              <option value="">— None —</option>
                              {memberOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </label>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-medium ring-1 ring-indigo-100">
                            <User className="w-3 h-3" />
                            M1:{" "}
                            {t.assigned_member_1_user?.name ||
                              t.assigned_member_1_user?.username ||
                              (t.assigned_member_1
                                ? `#${t.assigned_member_1}`
                                : "—")}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-800 text-[11px] font-medium ring-1 ring-violet-100">
                            <User className="w-3 h-3" />
                            M2:{" "}
                            {t.assigned_member_2_user?.name ||
                              t.assigned_member_2_user?.username ||
                              (t.assigned_member_2
                                ? `#${t.assigned_member_2}`
                                : "—")}
                          </span>
                        </>
                      )}
                      {canForward &&
                        !t.is_subtask &&
                        st !== "Completed" &&
                        st !== "Cancelled" &&
                        t.assigned_member_1 &&
                        t.assigned_member_2 && (
                          <button
                            type="button"
                            disabled={
                              forwardingId === t.id || reassigningId === t.id
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForward(t);
                            }}
                            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
                          >
                            {forwardingId === t.id
                              ? "Forwarding…"
                              : `Forward → ${
                                  t.assigned_member_2_user?.name ||
                                  t.assigned_member_2_user?.username ||
                                  "Member 2"
                                }`}
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-600">{filtered.length}</span>{" "}
            of {tasks.length} tasks
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
      <style>{`
        @keyframes teamModalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function TeamOverview({ userFilterData, userRole }) {
  const hodId = userFilterData?.userId ? Number(userFilterData.userId) : null;
  const isHod = userRole === "hod";
  const canView =
    userRole === "hod" ||
    userRole === "admin" ||
    userRole === "superadmin";

  const [teams, setTeams] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // HOD: never use global "all teams" — only their team(s). Admin/superadmin keep "all".
  const [selectedTeamId, setSelectedTeamId] = useState(isHod ? null : "all");
  const [selectedMember, setSelectedMember] = useState(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      let teamRows = [];
      if (userRole === "hod" && hodId) {
        teamRows = await fetchTeamsForHod(hodId);
      } else {
        const { data, error: err } = await supabase
          .from("teams")
          .select(
            `id, name, team_type, description, is_active, hod_id,
             team_members ( id, user_id, users ( id, name, username, role ) )`
          )
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (err) throw err;
        teamRows = data || [];
      }
      setTeams(teamRows);

      // HOD: auto-select their only team (or first) — no "All teams" view
      if (userRole === "hod" && teamRows.length > 0) {
        setSelectedTeamId((prev) => {
          if (prev && teamRows.some((t) => String(t.id) === String(prev))) {
            return prev;
          }
          return String(teamRows[0].id);
        });
      }

      const memberIds = new Set();
      teamRows.forEach((t) => {
        (t.team_members || []).forEach((m) => {
          if (m.user_id) memberIds.add(Number(m.user_id));
          if (m.users?.id) memberIds.add(Number(m.users.id));
        });
      });

      const ids = [...memberIds];
      const stats = {};
      ids.forEach((id) => {
        stats[id] = {
          pending: 0,
          inProgress: 0,
          completed: 0,
          total: 0,
          onTimeCompleted: 0,
          lastAssignDate: null,
          timeRemainingMinutes: 0,
        };
      });

      if (ids.length) {
        // Primary ownership is assigned_member_1 only (same as Task List / Pending queues).
        // After forward, previous owner becomes M2 and no longer counts as active on this task.
        // Extra fields support dashboard columns: Last Assign Date, Time Required,
        // Completion Rate, Completed On Time, Status.
        const taskRows = await fetchTasksWithSubtasks(
          "id, status, assigned_member_1, given_date, assigned_at, completed_at, expected_date_to_close, time_required",
          (q) => q.in("assigned_member_1", ids)
        );

        const now = Date.now();

        (taskRows || []).forEach((task) => {
          const s = (task.status || "").toLowerCase();
          const uid = task.assigned_member_1
            ? Number(task.assigned_member_1)
            : null;
          if (!uid || !stats[uid]) return;
          stats[uid].total += 1;
          // In Testing = the member finished it; only Frontend/Backend testing is left
          if (s === "completed" || s === "in testing") {
            stats[uid].completed += 1;
            // On-time: completed_at on or before expected_date_to_close (calendar day)
            if (task.completed_at && task.expected_date_to_close) {
              const completed = new Date(task.completed_at);
              const due = new Date(task.expected_date_to_close);
              if (!Number.isNaN(completed.getTime()) && !Number.isNaN(due.getTime())) {
                const c = new Date(
                  completed.getFullYear(),
                  completed.getMonth(),
                  completed.getDate()
                );
                const d = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                if (c <= d) stats[uid].onTimeCompleted += 1;
              }
            }
          } else if (s === "in progress") {
            stats[uid].inProgress += 1;
          } else if (s !== "cancelled") {
            stats[uid].pending += 1;
          }

          // Latest assign date
          const assignRaw = task.assigned_at || task.given_date;
          if (assignRaw) {
            const ad = new Date(assignRaw);
            if (!Number.isNaN(ad.getTime())) {
              if (
                !stats[uid].lastAssignDate ||
                ad > new Date(stats[uid].lastAssignDate)
              ) {
                stats[uid].lastAssignDate = assignRaw;
              }
            }
          }

          // Time Required: how much time is left from now to finish open work.
          // Primary: admin-set time_required (date); fallback: expected_date_to_close.
          // Per open task: max(0, due − now). Sum across member's open tasks.
          if (s !== "completed" && s !== "cancelled") {
            const endRaw = task.time_required || task.expected_date_to_close;
            if (endRaw) {
              const end = new Date(endRaw);
              if (!Number.isNaN(end.getTime())) {
                const mins = Math.max(
                  0,
                  Math.floor((end.getTime() - now) / 60000)
                );
                stats[uid].timeRemainingMinutes += mins;
              }
            }
          }
        });
      }
      setTaskStats(stats);
    } catch (err) {
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [canView, hodId, userRole]);

  useEffect(() => {
    load();
  }, [load]);

  const members = useMemo(() => {
    const map = new Map();
    // HOD: never fall back to all org teams — only selected team or their teams list
    const source =
      selectedTeamId === "all" && !isHod
        ? teams
        : selectedTeamId
          ? teams.filter((t) => String(t.id) === String(selectedTeamId))
          : isHod
            ? teams
            : teams;

    source.forEach((team) => {
      (team.team_members || []).forEach((m) => {
        const u = m.users;
        const id = Number(u?.id || m.user_id);
        if (!id) return;
        if (map.has(id)) {
          const prev = map.get(id);
          if (!prev.teams.includes(team.name)) prev.teams.push(team.name);
          return;
        }
        map.set(id, {
          id,
          name: u?.name || "Unknown",
          username: u?.username || "",
          role: u?.role || "employee",
          teams: [team.name],
        });
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, selectedTeamId, isHod]);

  const totals = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        const s = taskStats[m.id] || {};
        acc.pending += s.pending || 0;
        acc.inProgress += s.inProgress || 0;
        acc.completed += s.completed || 0;
        acc.people += 1;
        return acc;
      },
      { pending: 0, inProgress: 0, completed: 0, people: 0 }
    );
  }, [members, taskStats]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
        <Users className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-800">Restricted</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Team Overview is for HOD / Admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 max-w-xs">
        {[
          { label: "Team members", value: totals.people, icon: Users },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <s.icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Admin / Superadmin: can see All teams. HOD: only their own team(s) — no All teams. */}
        {!isHod && (
          <button
            type="button"
            onClick={() => setSelectedTeamId("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
              selectedTeamId === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All teams ({teams.length})
          </button>
        )}
        {teams.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTeamId(String(t.id))}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition ${
              String(selectedTeamId) === String(t.id)
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.name}
            <span className="ml-1 opacity-70">
              ({(t.team_members || []).length})
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm hidden lg:table">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Member</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Team(s)</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Tasks</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Last Assign Date</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Time Required</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Completion Rate</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Completed On Time</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-gray-400 align-middle">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                    Loading team…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-gray-400 align-middle">
                    No team members found. Assign people to a team under this HOD
                    in the database.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const s = taskStats[m.id] || {
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                    total: 0,
                    onTimeCompleted: 0,
                    lastAssignDate: null,
                    timeRemainingMinutes: 0,
                  };
                  const completionRate =
                    s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                  const onTimeRate =
                    s.completed > 0
                      ? Math.round((s.onTimeCompleted / s.completed) * 100)
                      : 0;
                  const isBusy = (s.pending || 0) + (s.inProgress || 0) > 0;
                  const statusLabel = isBusy ? "busy" : "available";
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-blue-400"
                      title="Click to view report & tasks"
                    >
                      <td className="px-5 py-3.5 text-center align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 group-hover:shadow-md group-hover:shadow-blue-500/20 transition">
                            {(m.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-800">
                              {m.name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              @{m.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[140px] text-center align-middle">
                        <div className="flex flex-col gap-1">
                          {m.teams.map((tn) => (
                            <span
                              key={tn}
                              title={tn}
                              className="inline-flex max-w-full px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 ring-1 ring-blue-100 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                              {tn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center align-middle">
                        <div className="text-sm font-medium text-gray-900">
                          {s.completed}/{s.total}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Completed/Total
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-800 text-center align-middle">
                        {s.lastAssignDate
                          ? formatDate(s.lastAssignDate)
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-800 text-center align-middle">
                        {formatMinutes(s.timeRemainingMinutes)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center align-middle">
                        <div className="w-[112px]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-semibold text-gray-900 tabular-nums tracking-tight">
                              {completionRate}%
                            </span>
                          </div>
                          <div className="h-[6px] w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/90 transition-all duration-500 ease-out"
                              style={{
                                width: `${Math.min(100, Math.max(0, completionRate))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center align-middle">
                        <div className="w-[112px]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-semibold text-gray-900 tabular-nums tracking-tight">
                              {onTimeRate}%
                            </span>
                            <span className="text-[11px] text-gray-400 tabular-nums">
                              {s.onTimeCompleted || 0}/{s.completed || 0}
                            </span>
                          </div>
                          <div className="h-[6px] w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500/90 transition-all duration-500 ease-out"
                              style={{
                                width: `${Math.min(100, Math.max(0, onTimeRate))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center align-middle">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            isBusy
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <span className="ml-2 text-[10px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                          View →
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="block lg:hidden flex flex-col gap-4 p-3 sm:p-4 bg-transparent">
          {loading ? (
            <div className="p-14 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Loading team…
            </div>
          ) : members.length === 0 ? (
            <div className="p-14 text-center text-gray-400">
              No team members found. Assign people to a team under this HOD in the database.
            </div>
          ) : (
            members.map((m) => {
              const s = taskStats[m.id] || { pending: 0, inProgress: 0, completed: 0, total: 0, onTimeCompleted: 0, lastAssignDate: null, timeRemainingMinutes: 0 };
              const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              const onTimeRate = s.completed > 0 ? Math.round((s.onTimeCompleted / s.completed) * 100) : 0;
              const isBusy = (s.pending || 0) + (s.inProgress || 0) > 0;
              const statusLabel = isBusy ? "busy" : "available";
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md cursor-pointer">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
                  <div className="flex justify-between items-start mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(m.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                          {m.name}
                        </span>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">@{m.username}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${isBusy ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                    <div>
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tasks</span>
                      <span className="font-semibold text-gray-900">{s.completed}/{s.total}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Completion</span>
                      <span className="font-semibold text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Team(s)</span>
                      <span className="font-semibold text-gray-900">{m.teams?.length ? m.teams.join(", ") : "—"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Assign</span>
                      <span className="font-semibold text-gray-900">{s.lastAssignDate ? formatDate(s.lastAssignDate) : "—"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Req.</span>
                      <span className="font-semibold text-gray-900">{formatMinutes(s.timeRemainingMinutes)}</span>
                    </div>
                    <div className="col-span-2 pt-2 mt-2 border-t border-gray-200/50 text-center">
                      <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Completed On Time</span>
                      <span className={`font-bold ${onTimeRate >= 80 ? 'text-emerald-600' : onTimeRate >= 50 ? 'text-amber-500' : 'text-rose-600'}`}>{onTimeRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" />
        Click any member row to open Pending tasks and Report. In Report, click
        a metric to view that category&apos;s tasks.
      </p>

      <MemberTasksModal
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        userRole={userRole}
        userFilterData={userFilterData}
        teamMembers={members}
        taskStats={taskStats}
        onAfterChange={load}
      />
    </div>
  );
}
