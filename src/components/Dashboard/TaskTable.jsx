"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Clock,
  History,
  Users,
  Save,
  Search,
} from "lucide-react";
import { formatDate } from "../../utils/dateFormatters";
import Button from "./shared/Button";
import DataTable from "./shared/DataTable";
import { LoadingIndicator, ErrorMessage } from "./shared/StatusIndicators";
import ExpandableText from "./shared/ExpandableText";
import {
  fetchEmplTasks,
  updateEmplTask,
  fetchAssignableMembersWithLoad,
  EMPL_TASK_STATUS_OPTIONS,
} from "../../services/schemaApi";
import Select from "./shared/Select";

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

export default function EmployeeTasksTable({
  onRefreshStats,
  userRole = "admin",
  userFilterData,
  companyData,
}) {
  // Assign desk: admin / superadmin / hod can assign Member 1 (+ optional 2)
  const isAdmin =
    userRole === "admin" ||
    userRole === "superadmin" ||
    userRole === "hod";
  // Owners who execute / forward work on assigned_member_1
  const isSelfRole =
    userRole === "employee" ||
    userRole === "user";
  const currentUserId = userFilterData?.userId
    ? Number(userFilterData.userId)
    : null;

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /** "pending" = no active assignee yet | "history" = assigned_member_1 set */
  const [viewTab, setViewTab] = useState("pending");
  const [selectedIds, setSelectedIds] = useState(new Set());
  /** per-row draft: { [taskId]: { memberId1, memberId2, timeRequired, remarks } } */
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (userRole === "company" && companyData?.companyId) {
        filters.companyId = companyData.companyId;
      } else if (isSelfRole && userFilterData?.userId) {
        // assignedMemberId filter = "tasks I currently own"
        // (maps to assigned_member_1 in schemaApi.fetchEmplTasks)
        filters.assignedMemberId = userFilterData.userId;
      }

      const [taskRows, memberRows] = await Promise.all([
        fetchEmplTasks(filters),
        isAdmin ? fetchAssignableMembersWithLoad() : Promise.resolve([]),
      ]);
      setTasks(taskRows);
      // Already sorted: free (0 active) first, then by active count asc
      setMembers(memberRows);
      setSelectedIds(new Set());
      setDrafts({});
    } catch (err) {
      console.error("Error loading employee tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole, userFilterData, companyData, isAdmin, isSelfRole]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // assigned_member_1 IS NULL -> still sitting in Admin's Pending
  // Assignment queue. Once Admin sets assigned_member_1, it moves to
  // history (which doubles as "my tasks" for the current owner).
  // Sub-tasks are created with the main task's members, so they go straight to history.
  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.assigned_member_1),
    [tasks]
  );
  const historyTasks = useMemo(
    () => tasks.filter((t) => !!t.assigned_member_1),
    [tasks]
  );
  const visibleTasks = useMemo(() => {
    let tasksList = viewTab === "pending" ? pendingTasks : historyTasks;

    if (filterPriority !== "All") {
      tasksList = tasksList.filter((t) => t.priority === filterPriority);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasksList = tasksList.filter(
        (t) =>
          (t.task_no && String(t.task_no).toLowerCase().includes(q)) ||
          (t.description_of_work && t.description_of_work.toLowerCase().includes(q)) ||
          ((t.company?.company_name || t.company?.name || t.companies?.name) && (t.company?.company_name || t.company?.name || t.companies?.name).toLowerCase().includes(q)) ||
          (t.systems?.name && t.systems.name.toLowerCase().includes(q))
      );
    }

    return tasksList;
  }, [viewTab, pendingTasks, historyTasks, filterPriority, searchQuery]);

  // Reset to first page whenever role / tab / filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userRole, viewTab, filterPriority, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / itemsPerPage));

  // Keep currentPage in range if the list shrinks (e.g. after a reload)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedTasks = useMemo(
    () =>
      visibleTasks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [visibleTasks, currentPage, itemsPerPage]
  );

  const updateDraft = (taskId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: {
        memberId1: "",
        memberId2: "",
        timeRequired: "",
        remarks: "",
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const toggleSelect = (task) => {
    const id = task.id;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDrafts((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          memberId1: task.assigned_member_1 ? String(task.assigned_member_1) : "",
          memberId2: task.assigned_member_2 ? String(task.assigned_member_2) : "",
          timeRequired: "",
          remarks: "",
        },
      };
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleTasks.length && visibleTasks.length > 0) {
      setSelectedIds(new Set());
    } else {
      const ids = visibleTasks.map((t) => t.id);
      setSelectedIds(new Set(ids));
      setDrafts((prev) => {
        const next = { ...prev };
        visibleTasks.forEach((t) => {
          if (!next[t.id]) {
            next[t.id] = {
              memberId1: t.assigned_member_1 ? String(t.assigned_member_1) : "",
              memberId2: t.assigned_member_2 ? String(t.assigned_member_2) : "",
              timeRequired: "",
              remarks: "",
            };
          }
        });
        return next;
      });
    }
  };

  // Members are assigned once, when the main task is first assigned. Sub-tasks are
  // created with the main task's members, so rows that already have them are read-only.
  const hasMembers = (task) => !!task?.assigned_member_1;

  const handleSubmitAssignments = async () => {
    if (selectedIds.size === 0) {
      alert("Select at least one task.");
      return;
    }

    const ids = [...selectedIds];
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    for (const id of ids) {
      const d = drafts[id];
      if (!hasMembers(taskById.get(id)) && !d?.memberId1) {
        alert("Please select Member 1 (current assignee) for every checked task.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const assignedBy = userFilterData?.userId
        ? Number(userFilterData.userId)
        : null;
      const now = new Date().toISOString();

      await Promise.all(
        ids.map((id) => {
          const d = drafts[id];
          const payload = {
            // Pending queue is for unassigned; once Member 1 is set → In Progress
            status: "In Progress",
            remarks: d.remarks?.trim() || null,
          };
          // Members are set only once; a task that already has them keeps them
          if (!hasMembers(taskById.get(id))) {
            payload.assigned_member_1 = Number(d.memberId1);
            payload.assigned_member_2 = d.memberId2 ? Number(d.memberId2) : null;
            payload.assigned_by = assignedBy;
            payload.assigned_at = now;
          }
          if (d.timeRequired) {
            payload.time_required = new Date(d.timeRequired).toISOString();
          }
          return updateEmplTask(id, payload);
        })
      );

      alert(
        `${ids.length} task(s) assigned. They will show in the member's Pending Tasks.`
      );
      setSelectedIds(new Set());
      setDrafts({});
      await loadTasks();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert("Failed to submit assignments: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setStatusUpdatingId(task.id);
    try {
      const payload = { status: newStatus };
      if (newStatus === "Completed") {
        payload.completed_at = new Date().toISOString();
      }
      const updated = await updateEmplTask(task.id, payload);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t))
      );
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert("Failed to update status: " + (err.message || err));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const tdBase = "px-4 py-3 text-center align-middle";

  const showAssignCols = isAdmin && viewTab === "pending";
  const showHistoryCols = viewTab === "history";
  const showActionCol = isSelfRole && viewTab === "history";

  // Column headers (with fixed widths -> rendered as <colgroup> by DataTable),
  // conditionally included per role x tab exactly as the original table.
  const headers = [
    ...(showAssignCols ? [{ label: "Select", width: 56 }] : []),
    ...(showAssignCols
      ? [
          { label: "Assign Member 1", width: 190 },
          { label: "Assign Member 2", width: 190 },
          { label: "Time Required", width: 210 },
          { label: "Remarks", width: 190 },
        ]
      : []),
    ...(showHistoryCols
      ? [
          { label: "Assigned To", width: 160 },
          { label: "Backup", width: 160 },
          { label: "Time Required", width: 210 },
          { label: "Remarks", width: 190 },
        ]
      : []),
    ...(showActionCol ? [{ label: "Action", width: 220 }] : []),
    { label: "Task No", width: 110 },
    { label: "Given Date", width: 115 },
    { label: "Posted By", width: 130 },
    { label: "Taken From", width: 130 },
    { label: "Type of Work", width: 160 },
    { label: "Company", width: 140 },
    { label: "System", width: 140 },
    { label: "Description", width: 340 },
    { label: "Notes", width: 260 },
    { label: "Link", width: 80 },
    { label: "Attachment", width: 100 },
    { label: "Expected Date", width: 120 },
    { label: "Priority", width: 100 },
    { label: "Status", width: 110 },
  ];

  // table-fixed + min-width equal to the sum of column widths (literal classes for Tailwind JIT)
  const minWidth = showAssignCols
    ? "table-fixed min-w-[2871px]"
    : showActionCol
    ? "table-fixed min-w-[2975px]"
    : showHistoryCols
    ? "table-fixed min-w-[2755px]"
    : "table-fixed min-w-[2035px]";

  const getDraft = (task) =>
    drafts[task.id] || {
      memberId1: "",
      memberId2: "",
      timeRequired: "",
      remarks: "",
    };

  const renderRow = (task) => {
    const selected = selectedIds.has(task.id);
    const draft = getDraft(task);
    const isRejected = task.is_testing_issue || task.relation_type === "Testing Issue" || (typeof task.description_of_work === "string" && /\[Testing issue/i.test(task.description_of_work));
    const rejectedReason = task.issue_remarks || (typeof task.description_of_work === "string" ? task.description_of_work.match(/^\[(?:Testing issue|Delivery not approved|Customer not informed)[^\]]*\]\s*(.*)$/i)?.[1]?.trim() : "");

    return (
      <tr
        key={task.id}
        className={`hover:bg-gray-50 ${
          selected ? "bg-blue-50/40" : isRejected ? "bg-rose-50/60 hover:bg-rose-100/60" : ""
        }`}
      >
        {isAdmin && viewTab === "pending" && (
          <td className={tdBase}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleSelect(task)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </td>
        )}

        {isAdmin && viewTab === "pending" && (
          <>
            <td className={tdBase}>
              {hasMembers(task) ? (
                <span className="text-sm font-medium text-gray-800">
                  {task.assigned_member_1_user?.name || "—"}
                </span>
              ) : selected ? (
                <Select
                  searchable
                  searchPlaceholder="Search member..."
                  value={draft.memberId1}
                  onChange={(e) =>
                    updateDraft(task.id, "memberId1", e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Member 1</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.username}
                      {m.isFree ? " — Available" : " — Busy"}
                    </option>
                  ))}
                </Select>
              ) : (
                <span
                  title="Tick the checkbox first to assign"
                  className="text-sm text-gray-400"
                >
                  Select row first
                </span>
              )}
            </td>
            <td className={tdBase}>
              {hasMembers(task) ? (
                <span className="text-sm text-gray-600">
                  {task.assigned_member_2_user?.name || "—"}
                </span>
              ) : selected ? (
                <Select
                  searchable
                  searchPlaceholder="Search member..."
                  value={draft.memberId2}
                  onChange={(e) =>
                    updateDraft(task.id, "memberId2", e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  title="Optional second member"
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.username}
                      {m.isFree ? " — Available" : " — Busy"}
                    </option>
                  ))}
                </Select>
              ) : (
                <span
                  title="Tick the checkbox first to assign"
                  className="text-sm text-gray-400"
                >
                  Select row first
                </span>
              )}
            </td>
            <td className={tdBase}>
              {selected ? (
                <input
                  type="datetime-local"
                  value={draft.timeRequired}
                  onChange={(e) =>
                    updateDraft(
                      task.id,
                      "timeRequired",
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span
                  title="Tick the checkbox first to assign"
                  className="text-sm text-gray-400"
                >
                  Select row first
                </span>
              )}
            </td>
            <td className={tdBase}>
              {selected ? (
                <input
                  type="text"
                  value={draft.remarks}
                  onChange={(e) =>
                    updateDraft(task.id, "remarks", e.target.value)
                  }
                  placeholder="Remarks…"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span
                  title="Tick the checkbox first to assign"
                  className="text-sm text-gray-400"
                >
                  Select row first
                </span>
              )}
            </td>
          </>
        )}

        {viewTab === "history" && (
          <>
            <td className={`${tdBase} text-sm font-medium text-gray-800 text-center align-middle`}>
              {task.assigned_member_1_user?.name || "—"}
            </td>
            <td className={`${tdBase} text-sm text-gray-600 text-center align-middle`}>
              {task.assigned_member_2_user?.name || "—"}
            </td>
            <td className={`${tdBase} text-sm text-gray-700 whitespace-nowrap text-center align-middle`}>
              {task.time_required
                ? formatDate(task.time_required)
                : "—"}
            </td>
            <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
              {isRejected && rejectedReason ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-100 text-rose-700">
                    Testing Issue
                  </span>
                  <span className="text-xs font-semibold text-rose-950">
                    {rejectedReason}
                  </span>
                  {task.remarks && task.remarks !== rejectedReason && (
                    <span className="text-xs text-gray-500">{task.remarks}</span>
                  )}
                </div>
              ) : (
                task.remarks || "—"
              )}
            </td>
          </>
        )}

        {isSelfRole && viewTab === "history" && (
          <td className={tdBase}>
            <div className="flex flex-col gap-1.5">
              <Select
                value={task.status}
                disabled={statusUpdatingId === task.id}
                onChange={(e) =>
                  handleStatusChange(task, e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {EMPL_TASK_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>

            </div>
          </td>
        )}

        <td className={`${tdBase} text-sm font-medium text-blue-600 whitespace-nowrap text-center align-middle`}>
          <div className="flex flex-col items-center justify-center gap-1">
            <span>{task.task_no}</span>
            {isRejected && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-100 text-rose-700 border border-rose-300"
                title={rejectedReason ? `Rejected Reason: ${rejectedReason}` : "Rejected from testing"}
              >
                Rejected
              </span>
            )}
          </div>
        </td>
        <td className={`${tdBase} text-sm text-gray-700 whitespace-nowrap text-center align-middle`}>
          {formatDate(task.given_date)}
        </td>
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.posted_by_user?.name || "—"}
        </td>
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.taken_from_user?.name || "—"}
        </td>
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.type_of_work || "—"}
        </td>
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.company?.company_name || task.company?.name || task.companies?.name || "—"}
        </td>
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.systems?.name || "—"}
        </td>

        {/* Description — top aligned, wide */}
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          <ExpandableText text={task.description_of_work} />
        </td>

        {/* Notes */}
        <td className={`${tdBase} text-sm text-gray-700 text-center align-middle`}>
          {task.notes ? (
            <ExpandableText text={task.notes} />
          ) : (
            "—"
          )}
        </td>

        {/* Link */}
        <td className={`${tdBase} text-sm whitespace-nowrap text-center align-middle`}>
          {task.link_of_system ? (
            <a
              href={task.link_of_system}
              target="_blank"
              rel="noopener noreferrer"
              title={task.link_of_system}
              className="font-medium text-blue-600 hover:underline"
            >
              Link
            </a>
          ) : (
            "—"
          )}
        </td>

        {/* Attachment */}
        <td className={`${tdBase} text-sm text-gray-700 whitespace-nowrap text-center align-middle`}>
          {task.attachment_file ? (
            <a
              href={task.attachment_file}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              View
            </a>
          ) : (
            "—"
          )}
        </td>

        <td className={`${tdBase} text-sm text-gray-700 whitespace-nowrap text-center align-middle`}>
          {formatDate(task.expected_date_to_close)}
        </td>
        <td className={tdBase}>
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
              PRIORITY_COLORS[task.priority] ||
              "bg-gray-100 text-gray-800"
            }`}
          >
            {task.priority}
          </span>
        </td>
        <td className={`${tdBase} text-sm text-gray-700 whitespace-nowrap text-center align-middle`}>
          {task.status}
        </td>
      </tr>
    );
  };

  const renderCard = (task) => {
    const selected = selectedIds.has(task.id);
    const draft = getDraft(task);

    return (
      <div
        key={task.id}
        className={`p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border relative overflow-hidden ${
          selected ? "bg-blue-50/80 border-blue-200 shadow-blue-900/5" : "bg-white border-gray-100 hover:shadow-md"
        }`}
      >
        {/* Accent top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

        <div className="flex justify-between items-start mt-1">
          <div className="flex items-center gap-3">
            {isAdmin && viewTab === "pending" && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleSelect(task)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
            )}
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
                {task.task_no}
              </span>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {formatDate(task.given_date)}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
              PRIORITY_COLORS[task.priority] || "bg-gray-100 text-gray-800"
            }`}
          >
            {task.priority}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Posted By</span>
            <span className="font-semibold text-gray-900">{task.posted_by_user?.name || "—"}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Taken From</span>
            <span className="font-semibold text-gray-900">{task.taken_from_user?.name || "—"}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company</span>
            <span className="font-medium text-gray-700">{task.company?.company_name || task.company?.name || task.companies?.name || "—"}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">System</span>
            <span className="font-medium text-gray-700">{task.systems?.name || "—"}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-100/80">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type of Work</span>
            <span className="font-medium text-gray-700">{task.type_of_work || "—"}</span>
          </div>
        </div>

        <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 text-sm border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <span className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">Description</span>
          <div className="text-gray-700 leading-relaxed font-medium">
            <ExpandableText text={task.description_of_work} />
          </div>
          {task.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200/60">
              <span className="block text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2">Notes</span>
              <div className="text-gray-700 leading-relaxed font-medium">
                <ExpandableText text={task.notes} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium">
          {task.link_of_system && (
            <a
              href={task.link_of_system}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="underline">System Link</span>
            </a>
          )}
          {task.attachment_file && (
            <a
              href={task.attachment_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="underline">View Attachment</span>
            </a>
          )}
        </div>

        {isAdmin && viewTab === "pending" && (
          <div className="mt-1 p-4 border border-blue-100 bg-blue-50/50 rounded-xl flex flex-col gap-4 shadow-inner">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Assignment Details
            </h4>
            {!selected ? (
              <p className="text-xs font-medium text-blue-600/70 italic px-3 border-l-2 border-blue-200">
                Check the box above to assign this task.
              </p>
            ) : (
              <div className="space-y-3">
                {hasMembers(task) ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[11px] font-bold text-blue-800 uppercase tracking-wide mb-0.5">Member 1</span>
                      <span className="font-medium text-gray-900">{task.assigned_member_1_user?.name || "—"}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-blue-800 uppercase tracking-wide mb-0.5">Member 2</span>
                      <span className="text-gray-700">{task.assigned_member_2_user?.name || "—"}</span>
                    </div>
                  </div>
                ) : (
                <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Assign Member 1 <span className="text-red-500">*</span></label>
                  <Select
                    searchable
                    searchPlaceholder="Search member..."
                    value={draft.memberId1}
                    onChange={(e) => updateDraft(task.id, "memberId1", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-blue-200 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  >
                    <option value="">Select Member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.username}
                        {m.isFree ? " — Available" : " — Busy"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Assign Member 2</label>
                  <Select
                    searchable
                    searchPlaceholder="Search member..."
                    value={draft.memberId2}
                    onChange={(e) => updateDraft(task.id, "memberId2", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-blue-200 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  >
                    <option value="">Select Backup (Optional)</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.username}
                        {m.isFree ? " — Available" : " — Busy"}
                      </option>
                    ))}
                  </Select>
                </div>
                </>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Expected Time</label>
                  <input
                    type="datetime-local"
                    value={draft.timeRequired}
                    onChange={(e) => updateDraft(task.id, "timeRequired", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-blue-200 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Remarks</label>
                  <input
                    type="text"
                    value={draft.remarks}
                    onChange={(e) => updateDraft(task.id, "remarks", e.target.value)}
                    placeholder="Add assignment notes..."
                    className="w-full px-3 py-2.5 text-sm font-medium border border-blue-200 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {viewTab === "history" && (
          <div className="mt-2 grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-0.5">Assigned To</span>
              <span className="font-medium text-gray-900">{task.assigned_member_1_user?.name || "—"}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-0.5">Backup</span>
              <span className="text-gray-700">{task.assigned_member_2_user?.name || "—"}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-0.5">Expected Time</span>
              <span className="text-gray-700">{task.time_required ? formatDate(task.time_required) : "—"}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-400 mb-0.5">Remarks</span>
              <span className="text-gray-700">{task.remarks || "—"}</span>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400">Current Status</span>
            <span className="font-semibold text-gray-800">{task.status}</span>
          </div>
          {isSelfRole && viewTab === "history" && (
            <div className="w-1/2 sm:w-1/3">
              <Select
                value={task.status}
                disabled={statusUpdatingId === task.id}
                onChange={(e) => handleStatusChange(task, e.target.value)}
                className="w-full px-2 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {EMPL_TASK_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-6">

      {/* Tabs, Search & Filter + submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setViewTab("pending");
              setSelectedIds(new Set());
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewTab === "pending"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-200 text-orange-800">
              {pendingTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewTab("history");
              setSelectedIds(new Set());
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewTab === "history"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <History className="w-4 h-4" />
            {isSelfRole ? "My Tasks" : "History"}
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-200 text-purple-800">
              {historyTasks.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>

          {isAdmin && viewTab === "pending" && (
            <Button
              type="button"
              disabled={submitting || selectedIds.size === 0}
              onClick={handleSubmitAssignments}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting
                ? "Submitting…"
                : `Submit${
                    selectedIds.size ? ` (${selectedIds.size})` : ""
                  }`}
            </Button>
          )}
        </div>
      </div>

      {loading && <LoadingIndicator message="Loading employee tasks…" />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && (
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-xl">
          <DataTable
            headers={headers}
            data={paginatedTasks}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth={minWidth}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={visibleTasks.length}
          />
        </div>
      )}
    </div>
  );
}
