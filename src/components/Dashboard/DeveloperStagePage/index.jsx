"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  RefreshCw,
  Clock,
  History,
  Users,
  Save,
  Search,
  Filter,
} from "lucide-react";
import { formatDate } from "../../../utils/dateFormatters";
import Button from "../shared/Button";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";
import ExpandableText from "../shared/ExpandableText";
import DataTable from "../shared/DataTable";
import {
  fetchCmpTasks,
  updateCmpTask,
  fetchAssignableMembers,
  convertCmpTaskToUserTask,
  WORK_TYPE_OPTIONS,
} from "../../../services/schemaApi";
import Select from "../shared/Select";

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

/**
 * cmp_task columns (v5.2 includes link, attachment, notes, remarks, time_required)
 * select / assignMember / remarks / timeRequired → admin + pending only
 * assignedTo / assignedBy → history
 */
const TABLE_COLUMNS = [
  // 1) Convert actions (admin/hod/superadmin, pending Open tickets)
  { key: "select", label: "Select", pendingAdminOnly: true },
  { key: "typeOfWork", label: "Type of Work", pendingAdminOnly: true },
  { key: "expectedDate", label: "Expected Close", pendingAdminOnly: true },
  { key: "assignMember1", label: "Assign Member 1", pendingAdminOnly: true },
  { key: "assignMember2", label: "Assign Member 2", pendingAdminOnly: true, adminOnlyAssign: true },
  { key: "timeRequired", label: "Time Required", pendingAdminOnly: true },
  { key: "remarks", label: "Remarks", pendingAdminOnly: true },
  // 2) History-only
  { key: "assignedTo", label: "Member 1", historyOnly: true },
  { key: "assignedTo2", label: "Member 2", historyOnly: true },
  { key: "assignedBy", label: "Assigned By", historyOnly: true },
  { key: "convertedTaskNo", label: "Internal Task", historyOnly: true },
  // 3) Ticket identity
  { key: "taskNo", label: "Task No" },
  { key: "taskName", label: "Task Name" },
  { key: "givenDate", label: "Given Date" },
  { key: "postedBy", label: "Posted By" },
  // 4) Context
  { key: "company", label: "Company" },
  { key: "system", label: "System" },
  // 5) Details
  { key: "description", label: "Description" },
  { key: "link", label: "Link" },
  { key: "attachment", label: "Attachment" },
  { key: "notes", label: "Notes" },
  // 6) Status
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
];

const defaultVisible = Object.fromEntries(
  TABLE_COLUMNS.map((c) => [c.key, true])
);

function dash(v) {
  if (v === null || v === undefined || v === "") return "—";
  return v;
}

export default function DeveloperStagePage({
  onRefreshStats,
  userRole = "admin",
  userFilterData,
  companyData,
}) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewTab, setViewTab] = useState("pending"); // pending | history
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPostedBy, setFilterPostedBy] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState(defaultVisible);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const columnFilterRef = useRef(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  // drafts[id] = { member1Id, member2Id, timeRequired, remarks }
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const isAdmin = userRole === "admin" || userRole === "superadmin" || userRole === "hod";
  // Only admin / superadmin may set Member 2 at convert time
  const canAssignMember2 = userRole === "admin" || userRole === "superadmin";
  const isCompanyUser = userRole === "company";

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (isCompanyUser && companyData?.companyId) {
        filters.companyId = companyData.companyId;
      }
      const [taskRows, memberRows] = await Promise.all([
        fetchCmpTasks(filters),
        isAdmin ? fetchAssignableMembers() : Promise.resolve([]),
      ]);
      setTasks(taskRows || []);
      setMembers(memberRows || []);
      setSelectedIds(new Set());
      setDrafts({});
    } catch (err) {
      console.error("Error loading company tasks:", err);
      setError(err.message || "Failed to load company tasks");
    } finally {
      setLoading(false);
    }
  }, [isCompanyUser, companyData, isAdmin]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!showColumnFilter) return;
    const onDown = (e) => {
      if (
        columnFilterRef.current &&
        !columnFilterRef.current.contains(e.target)
      ) {
        setShowColumnFilter(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showColumnFilter]);

  // Pending = company tickets still Open (not yet converted to internal work)
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === "Open"),
    [tasks]
  );

  // History = Converted / Closed
  const historyTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === "Converted" || t.status === "Closed"
      ),
    [tasks]
  );

  const uniquePosters = useMemo(() => {
    const names = new Set();
    tasks.forEach((t) => {
      if (t.posted_by_user?.name) names.add(t.posted_by_user.name);
    });
    return [...names].sort();
  }, [tasks]);

  const applySearchAndFilter = useCallback(
    (rows) => {
      let out = rows;
      if (filterPostedBy !== "all") {
        out = out.filter(
          (t) => (t.posted_by_user?.name || "") === filterPostedBy
        );
      }
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        out = out.filter((t) => {
          const blob = [
            t.task_name,
            t.description,
            t.companies?.name,
            t.systems?.name,
            t.posted_by_user?.name,
            t.notes,
            t.remarks,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return blob.includes(q);
        });
      }
      return out;
    },
    [searchTerm, filterPostedBy]
  );

  const visibleTasks = useMemo(() => {
    const base = viewTab === "pending" ? pendingTasks : historyTasks;
    return applySearchAndFilter(base);
  }, [viewTab, pendingTasks, historyTasks, applySearchAndFilter]);

  // Reset to first page whenever role / tab / search / filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userRole, viewTab, searchTerm, filterPostedBy]);

  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / itemsPerPage));

  // Keep currentPage in range if the list shrinks (e.g. after refresh / convert)
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

  const activeColumns = useMemo(() => {
    return TABLE_COLUMNS.filter((col) => {
      if (!visibleColumns[col.key]) return false;
      if (col.pendingAdminOnly && (!isAdmin || viewTab !== "pending"))
        return false;
      if (col.adminOnlyAssign && !canAssignMember2) return false;
      if (col.historyOnly && viewTab !== "history") return false;
      if (
        isCompanyUser &&
        (col.key === "select" || col.key === "assignMember1" || col.key === "assignMember2")
      )
        return false;
      return true;
    });
  }, [visibleColumns, isAdmin, isCompanyUser, viewTab, canAssignMember2]);

  const filterableColumns = TABLE_COLUMNS.filter((col) => {
    if (col.pendingAdminOnly && !isAdmin) return false;
    if (col.adminOnlyAssign && !canAssignMember2) return false;
    if (col.historyOnly && viewTab !== "history") return false;
    if (
      isCompanyUser &&
      (col.key === "select" || col.key === "assignMember1" || col.key === "assignMember2")
    )
      return false;
    return true;
  });

  const toggleColumn = (key) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSelectAllColumns = (checked) =>
    setVisibleColumns(
      Object.fromEntries(TABLE_COLUMNS.map((c) => [c.key, checked]))
    );

  // ── Draft helpers + checkbox gate ─────────────────────────────
  const setDraftField = (id, field, value) => {
    setDrafts((prev) => {
      const cur =
        prev[id] && typeof prev[id] === "object"
          ? prev[id]
          : { member1Id: prev[id] || "", member2Id: "" };
      return { ...prev, [id]: { ...cur, [field]: value } };
    });
  };

  const getDraft = (id) => {
    const d = drafts[id];
    const empty = {
      member1Id: "",
      member2Id: "",
      timeRequired: "",
      remarks: "",
      typeOfWork: "",
      expectedDate: "",
    };
    if (!d) return empty;
    if (typeof d === "object") {
      return {
        member1Id: d.member1Id || d.memberId || "",
        member2Id: d.member2Id || "",
        timeRequired: d.timeRequired || "",
        remarks: d.remarks || "",
        typeOfWork: d.typeOfWork || "",
        expectedDate: d.expectedDate || "",
      };
    }
    return { ...empty, member1Id: d || "", member2Id: "" };
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setDrafts((d) => {
          const copy = { ...d };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmitAssignments = async () => {
    // Convert Open company tickets -> internal user_tasks
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      alert("Select at least one Open ticket to convert.");
      return;
    }
    for (const id of ids) {
      const d = getDraft(id);
      if (!d.typeOfWork) {
        alert("Type of Work is required for every selected ticket.");
        return;
      }
      if (!d.expectedDate) {
        alert("Expected Close date is required for every selected ticket.");
        return;
      }
      if (!d.member1Id && !d.memberId) {
        alert("Assign Member 1 is required (active owner on internal task).");
        return;
      }
    }

    const assignedBy = userFilterData?.userId
      ? Number(userFilterData.userId)
      : null;
    if (!assignedBy) {
      alert("Session user id missing — re-login and try again.");
      return;
    }

    setSubmitting(true);
    try {
      let ok = 0;
      for (const id of ids) {
        const ticket = tasks.find((x) => x.id === id);
        if (!ticket) continue;
        const d = getDraft(id);
        const memberId = Number(d.member1Id || d.memberId);
        const member2Raw =
          canAssignMember2 && d.member2Id ? Number(d.member2Id) : null;
        const member2Id =
          member2Raw && member2Raw !== memberId ? member2Raw : null;
        if (!memberId) {
          throw new Error("Assign Member 1 is required.");
        }
        if (memberId === assignedBy) {
          throw new Error(
            "You cannot set yourself as Taken From. Pick a team member."
          );
        }
        await convertCmpTaskToUserTask({
          cmpTask: ticket,
          typeOfWork: d.typeOfWork,
          expectedDateToClose: d.expectedDate,
          takenFromUserId: memberId,
          assignedMember1Id: memberId,
          assignedMember2Id: member2Id,
          assignedByUserId: assignedBy,
          remarks: d.remarks?.trim() || null,
          timeRequired: d.timeRequired || null,
        });
        ok += 1;
      }
      alert(
        `${ok} ticket(s) converted.\n` +
          "Member 1 sees them in Pending Tasks. Member 2 only after Forward."
      );
      if (typeof onRefreshStats === "function") onRefreshStats();
      await loadTasks();
      setViewTab("history");
    } catch (err) {
      alert("Conversion failed: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const taskNo = (t) => `CT-${String(t.id).padStart(4, "0")}`;

  // Headers follow exactly the same role/tab/visibility rules as the row cells
  const headers = activeColumns.map((col) => col.label);

  const tdClass = "px-4 py-3 text-sm text-gray-700 text-center align-middle";

  const renderCell = (col, task) => {
    const selected = selectedIds.has(task.id);
    const draft = getDraft(task.id);

    switch (col.key) {
      case "select":
        return (
          <td key={col.key} className="px-4 py-3 text-center align-middle">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleSelect(task.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </td>
        );


      case "typeOfWork":
        return (
          <td key={col.key} className="px-4 py-3 min-w-[180px] text-center align-middle">
            <Select
              value={draft.typeOfWork}
              disabled={!selected}
              onChange={(e) =>
                setDraftField(task.id, "typeOfWork", e.target.value)
              }
              className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <option value="">Select type</option>
              {WORK_TYPE_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </td>
        );

      case "expectedDate":
        return (
          <td key={col.key} className="px-4 py-3 min-w-[150px] text-center align-middle">
            <input
              type="date"
              value={draft.expectedDate}
              disabled={!selected}
              onChange={(e) =>
                setDraftField(task.id, "expectedDate", e.target.value)
              }
              className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            />
          </td>
        );

      case "assignMember1":
        return (
          <td key={col.key} className="px-4 py-3 min-w-[160px] text-center align-middle">
            <Select
              value={draft.member1Id || draft.memberId || ""}
              disabled={!selected}
              onChange={(e) =>
                setDraftField(task.id, "member1Id", e.target.value)
              }
              title={
                selected
                  ? "Active owner (Pending Tasks)"
                  : "Tick the checkbox first to assign"
              }
              className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <option value="">Member 1 *</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </td>
        );

      case "assignMember2":
        if (!canAssignMember2) return null;
        return (
          <td key={col.key} className="px-4 py-3 min-w-[160px] text-center align-middle">
            <Select
              value={draft.member2Id || ""}
              disabled={!selected}
              onChange={(e) =>
                setDraftField(task.id, "member2Id", e.target.value)
              }
              title={
                selected
                  ? "Optional. Sees task in Pending only after Forward"
                  : "Tick the checkbox first"
              }
              className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <option value="">Member 2 (optional)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </td>
        );

      case "assignedTo":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.assigned_member?.name || task.converted_task?.assigned_member_1)}
          </td>
        );

      case "assignedTo2":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.assigned_member_2_name)}
          </td>
        );

      case "convertedTaskNo":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.converted_task?.task_no)}
          </td>
        );

      case "taskNo":
        return (
          <td
            key={col.key}
            className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap text-center align-middle"
          >
            {taskNo(task)}
          </td>
        );

case "taskName":
  return (
    <td
      key={col.key}
      className="px-4 py-3 text-sm text-gray-800 min-w-[200px] max-w-[280px] text-center align-middle"
    >
      <ExpandableText text={task.task_name || ""} />
    </td>
  );

      case "givenDate":
        return (
          <td key={col.key} className={tdClass}>
            {formatDate(task.created_at) || "—"}
          </td>
        );

      case "postedBy":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.posted_by_user?.name)}
          </td>
        );

      case "company":
        return (
          <td key={col.key} className={tdClass}>
            {dash(
              task.company?.company_name ||
                task.company?.name ||
                task.company?.company_name || task.company?.name || task.companies?.name
            )}
          </td>
        );

      case "system":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.systems?.name)}
          </td>
        );

case "description":
  return (
    <td
      key={col.key}
      className="px-4 py-3 text-sm text-gray-700 min-w-[320px] max-w-[480px] w-[28%] text-center align-middle"
    >
      <ExpandableText text={task.description || ""} />
    </td>
  );

   case "link":
  return (
    <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap text-center align-middle">
      {task.link_of_system ? (
        <a
          href={task.link_of_system}
          target="_blank"
          rel="noreferrer"
          title={task.link_of_system}
          className="font-medium text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : (
        "—"
      )}
    </td>
  );

  case "attachment":
  return (
    <td key={col.key} className="px-4 py-3 text-sm text-center max-w-[140px] align-middle">
      {task.attachment_file ? (
        <a
          href={task.attachment_file}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          View file
        </a>
      ) : (
        "—"
      )}
    </td>
  );

case "notes":
  return (
    <td
      key={col.key}
      className="px-4 py-3 text-sm text-gray-700 min-w-[260px] max-w-[400px] w-[20%] text-center align-middle"
    >
      <ExpandableText text={task.notes || ""} />
    </td>
  );

      case "remarks":
        return (
          <td key={col.key} className="px-4 py-3 min-w-[140px] text-center align-middle">
            {viewTab === "pending" && isAdmin ? (
              <input
                type="text"
                value={draft.remarks}
                disabled={!selected}
                placeholder={selected ? "Remarks…" : "Select row first"}
                onChange={(e) =>
                  setDraftField(task.id, "remarks", e.target.value)
                }
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  selected
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              />
            ) : (
              dash(task.remarks)
            )}
          </td>
        );

      case "timeRequired":
        return (
          <td key={col.key} className="px-4 py-3 min-w-[150px] text-center align-middle">
            {viewTab === "pending" && isAdmin ? (
              <input
                type="datetime-local"
                value={draft.timeRequired}
                disabled={!selected}
                onChange={(e) =>
                  setDraftField(task.id, "timeRequired", e.target.value)
                }
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  selected
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              />
            ) : task.time_required ? (
              formatDate(task.time_required)
            ) : (
              "—"
            )}
          </td>
        );

      case "priority":
        return (
          <td key={col.key} className="px-4 py-3 text-center align-middle">
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                PRIORITY_COLORS[task.priority] || "bg-gray-100 text-gray-800"
              }`}
            >
              {dash(task.priority)}
            </span>
          </td>
        );

      case "status":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.status)}
          </td>
        );

      case "assignedBy":
        return (
          <td key={col.key} className={tdClass}>
            {dash(task.assigned_by_user?.name)}
          </td>
        );

      default:
        return <td key={col.key} />;
    }
  };

  const renderRow = (task) => (
    <tr
      key={task.id}
      className={`hover:bg-gray-50 ${
        selectedIds.has(task.id) ? "bg-blue-50/40" : ""
      }`}
    >
      {activeColumns.map((col) => renderCell(col, task))}
    </tr>
  );

  const renderCard = (task) => (
    <div key={task.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {task.task_name || "Untitled"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{taskNo(task)}</p>
        </div>
        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset bg-slate-50 text-slate-700 ring-slate-200">
          {task.status || "Pending"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company</span>
          <span className="font-semibold text-gray-900">{dash(task.company?.company_name || task.company?.name || task.companies?.name)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">System</span>
          <span className="font-semibold text-gray-900">{dash(task.systems?.name)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0 gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, company, system, description…"
            className="w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <Select
          value={filterPostedBy}
          onChange={(e) => setFilterPostedBy(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Posted By</option>
          {uniquePosters.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>

        <div className="relative" ref={columnFilterRef}>
          <button
            type="button"
            onClick={() => setShowColumnFilter((v) => !v)}
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 sm:w-auto"
          >
            <Filter className="w-4 h-4" />
            Filter Columns
          </button>

          {showColumnFilter && (
            <div className="absolute right-0 z-20 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Show/Hide Columns
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowColumnFilter(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <label className="flex items-center gap-2 mb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={filterableColumns.every(
                      (c) => visibleColumns[c.key]
                    )}
                    onChange={(e) => toggleSelectAllColumns(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  Select all
                </label>
                <div className="space-y-1 overflow-y-auto max-h-64">
                  {filterableColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleColumns[column.key]}
                        onChange={() => toggleColumn(column.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={loadTasks}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs + submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setViewTab("pending");
              setSelectedIds(new Set());
              setDrafts({});
            }}
            className={`inline-flex items-center gap-2 pb-2 text-sm font-medium border-b-2 ${
              viewTab === "pending"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            Open Tickets
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
              {pendingTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewTab("history");
              setSelectedIds(new Set());
              setDrafts({});
            }}
            className={`inline-flex items-center gap-2 pb-2 text-sm font-medium border-b-2 ${
              viewTab === "history"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="w-4 h-4" />
            Converted / Closed
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
              {historyTasks.length}
            </span>
          </button>
        </div>

        {isAdmin && viewTab === "pending" && (
          <Button
            type="button"
            disabled={submitting || selectedIds.size === 0}
            onClick={handleSubmitAssignments}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Converting…" : "Convert to Internal Tasks"}
          </Button>
        )}
      </div>

      {loading && <LoadingIndicator message="Loading company tasks…" />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && (
        <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-xl">
          <DataTable
            headers={headers}
            data={paginatedTasks}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1600px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
            totalResults={visibleTasks.length}
          />
        </div>
      )}
    </div>
  );
}