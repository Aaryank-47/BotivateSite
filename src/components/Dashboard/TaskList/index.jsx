"use client";
import { publishCount } from "../../../utils/sidebarCounts";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Search,
    Filter,
} from "lucide-react";
import supabase from "../../../supabaseClient";

import { TABLE_COLUMNS, transformSupabaseData, fetchMasterSheetLinkData } from "./dataTransform";
import { PAGE_SIZE, fetchTasksByType, forwardTaskApi } from "./taskApi";
import { Button, LoadingState, ErrorState } from "./SubComponents";
import TaskTable from "./TaskTable";
import TaskUpdateModal from "./TaskUpdateModal";
import Select from "../shared/Select";

export default function TaskList({
    type = "all",
    userFilterData = null,
    companyData = null,
    onRefreshStats = null,
    userRole: userRoleProp = null,
}) {
    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterParty, setFilterParty] = useState("all");
    const [updatingTask, setUpdatingTask] = useState(null);
    const [pendingData, setPendingData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [uniqueParties, setUniqueParties] = useState([]);
    const [teamMembers1, setTeamMembers1] = useState([]);
    const [teamMembers2, setTeamMembers2] = useState([]);
    const [forwardingId, setForwardingId] = useState(null);
    const [currentUser, setCurrentUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [masterSheetData, setMasterSheetData] = useState(null);
    const [masterSheetLoading, setMasterSheetLoading] = useState(false);

    // Pagination state (server-side, page-indexed). currentPage values are 1-indexed.
    const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE);
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [pendingCount, setPendingCount] = useState(0);
    useEffect(() => {
        if (type === "pending") publishCount("pending-tasks", pendingCount);
    }, [type, pendingCount]);
    const [historyCount, setHistoryCount] = useState(0);
    const [pageLoading, setPageLoading] = useState(false);
    // Refs mirror the latest page/size so the 5-min refresh interval (stale closure) refetches the current page
    const pageStateRef = useRef({ pending: 1, completed: 1, itemsPerPage: PAGE_SIZE });
    pageStateRef.current = { pending: pendingCurrentPage, completed: historyCurrentPage, itemsPerPage };
    // Per-type request sequence numbers so out-of-order responses from rapid page clicks are ignored
    const requestSeqRef = useRef({ pending: 0, completed: 0 });

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState(
        TABLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const [columnFilterPos, setColumnFilterPos] = useState(null);
    const columnFilterBtnRef = useRef(null);

    const handleColumnToggle = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const handleSelectAllColumns = (selectAll) => {
        const newVisibleColumns = {};
        TABLE_COLUMNS.forEach(col => {
            newVisibleColumns[col.key] = selectAll;
        });
        setVisibleColumns(newVisibleColumns);
    };

    // Config

    // User type checks
    const isCompanyUser = companyData && companyData.companyName;
    const resolvedRole = (
      userRoleProp ||
      userRole ||
      (userFilterData?.isAdmin ? "admin" : "") ||
      ""
    ).toLowerCase();
    const isAdminUser =
      userFilterData?.isAdmin ||
      resolvedRole === "admin" ||
      resolvedRole === "superadmin";
    // Pending Tasks: Forward only for admin / superadmin (NOT HOD / employees).
    // HOD can forward only from Team Overview (to their own team members).
    const canForwardTask =
      resolvedRole === "admin" ||
      resolvedRole === "superadmin" ||
      !!userFilterData?.isAdmin;

    // Visible columns logic
    const getVisibleColumns = () => {
        let columns = TABLE_COLUMNS.filter(col => visibleColumns[col.key]);

        if (isCompanyUser) {
            const companyColumns = [
                { key: "typeOfWork", label: "Type Of Work" },
                { key: "partyName", label: "Party Name" },
                { key: "systemName", label: "System Name" },
                { key: "descriptionOfWork", label: "Description Of Work" },
                { key: "linkOfSystem", label: "Link Of System" },
                { key: "priorityInCustomer", label: "Priority In Customer" },
                { key: "notes", label: "Notes" },
                { key: "expectedDateToClose", label: "Expected Date To Close" },
            ];
            return companyColumns.filter(col => visibleColumns[col.key]);
        }

        if (type === "pending") {
            columns = columns.filter((col) => col.key !== "actualDate");
        }

        return columns;
    };

    const filteredColumns = getVisibleColumns();

    // User session helpers
    const getCurrentUser = () => {
        if (userFilterData && userFilterData.username) {
            return userFilterData.username;
        }
        try {
            const session = sessionStorage.getItem("userSession");
            if (session) {
                const userData = JSON.parse(session);
                return userData.username || currentUser;
            }
        } catch (e) {
            console.error("Error parsing session:", e);
        }
        return currentUser || "Unknown";
    };

    const getUserRole = () => {
        if (userFilterData) {
            return userFilterData.isAdmin ? "admin" : "user";
        }
        try {
            const session = sessionStorage.getItem("userSession");
            if (session) {
                const userData = JSON.parse(session);
                return userData.role || "user";
            }
        } catch (e) {
            console.error("Error parsing session:", e);
        }
        return "user";
    };

    useEffect(() => {
        const user = getCurrentUser();
        const role = getUserRole();
        setCurrentUser(user);
        setUserRole(role);
    }, []);

    // Access control
    const canUserAccessTask = (task) => {
        if (isCompanyUser || isAdminUser || canForwardTask) return true;
        if (userFilterData && userFilterData.showAllData) return true;
        // Employees: only the ACTIVE owner (Member 1) sees the task in Pending.
        // Member 2 sees it only after Forward (when they become Member 1).
        if (userFilterData && userFilterData.username) {
            const currentUsername = userFilterData.username.toLowerCase();
            const uid = userFilterData.userId ?? userFilterData.id ?? null;
            if (uid != null && task.assignedMember1Id != null) {
                return String(task.assignedMember1Id) === String(uid);
            }
            const assignedMember1 = task.assignedMember1
                ? task.assignedMember1.toString().toLowerCase()
                : "";
            return assignedMember1 === currentUsername;
        }
        return false;
    };

    const canUserSubmitTask = (task) => {
        if (isCompanyUser) return false;
        if (isAdminUser) return true;
        if (!userFilterData || !userFilterData.username) return false;

        const currentUsername = userFilterData.username.toLowerCase();
        const uid = userFilterData.userId ?? userFilterData.id ?? null;
        const statusAE = task.status1 ? task.status1.toString().toLowerCase() : "";

        if (statusAE.includes("completed by")) return false;
        if (task.submissionDate1 && task.submissionDate2) return false;

        // Only active owner (Member 1) can submit — not Member 2 until forwarded
        if (uid != null && task.assignedMember1Id != null) {
            return String(task.assignedMember1Id) === String(uid);
        }
        const assignedMember1 = task.assignedMember1
            ? task.assignedMember1.toString().toLowerCase()
            : "";
        return assignedMember1 === currentUsername;
    };

    const isTaskSelectable = (task) => canUserSubmitTask(task);

    // Master sheet loading
    const loadMasterSheetData = async () => {
        if (!isCompanyUser || masterSheetData) return masterSheetData;
        setMasterSheetLoading(true);
        try {
            const masterData = await fetchMasterSheetLinkData(supabase);
            if (masterData) {
                setMasterSheetData(masterData);
                return masterData;
            }
        } catch (error) {
            console.error("Error loading Master Sheet data:", error);
        } finally {
            setMasterSheetLoading(false);
        }
        return null;
    };

    // Which task types the current view displays. "pending"/"completed" views show one type;
    // any other type ("all", "user", ...) shows both combined, driven by one shared page index.
    const isCombinedView = type !== "pending" && type !== "completed";
    const viewTypes = type === "pending"
        ? ["pending"]
        : type === "completed"
            ? ["completed"]
            : ["pending", "completed"];

    /**
     * Fetch the given page (0-indexed) for each task type in `types` (fetched together, sharing one page index).
     * If the requested page is now past the end (e.g. tasks were completed/forwarded since), clamps to the last valid page.
     * @returns {Promise<{pageIndex: number, results: Array<{rows: Array, count: number|null}>}>} results aligned with `types`
     */
    const loadPages = async (types, pageIndex, pageSize) => {
        const fetchOne = async (taskType, idx) => {
            try {
                return await fetchTasksByType(taskType, idx, pageSize);
            } catch (err) {
                // PostgREST returns PGRST103 ("Requested range not satisfiable") when the offset is past the end
                if (err?.code === "PGRST103" && idx > 0) return { rows: [], count: null };
                throw err;
            }
        };

        let results = await Promise.all(types.map((t) => fetchOne(t, pageIndex)));

        if (pageIndex > 0 && results.every((r) => r.rows.length === 0)) {
            let counts = results.map((r) => r.count);
            if (counts.some((c) => c == null)) {
                counts = (await Promise.all(types.map((t) => fetchTasksByType(t, 0, pageSize)))).map((r) => r.count);
            }
            const lastIndex = Math.max(0, ...counts.map((c) => Math.ceil((c || 0) / pageSize) - 1));
            if (lastIndex !== pageIndex) {
                pageIndex = lastIndex;
                results = await Promise.all(types.map((t) => fetchOne(t, pageIndex)));
            }
        }

        return { pageIndex, results };
    };

    // Replace (not append) a type's data with one fetched page
    const applyPageResult = (taskType, result, pageIndex) => {
        const { tasks, teamMembers1: tm1, teamMembers2: tm2 } = transformSupabaseData(result.rows);
        if (taskType === "pending") {
            setPendingData(tasks);
            if (result.count != null) setPendingCount(result.count);
            setPendingCurrentPage(pageIndex + 1);
            setTeamMembers1(tm1);
            setTeamMembers2(tm2);
        } else {
            setHistoryData(tasks);
            if (result.count != null) setHistoryCount(result.count);
            setHistoryCurrentPage(pageIndex + 1);
        }
    };

    // Fetch + apply, ignoring responses superseded by a newer request for the same type
    const runPageLoad = async (types, pageIndex, pageSize) => {
        const seqs = {};
        types.forEach((t) => {
            requestSeqRef.current[t] += 1;
            seqs[t] = requestSeqRef.current[t];
        });
        const { pageIndex: finalIndex, results } = await loadPages(types, pageIndex, pageSize);
        types.forEach((t, i) => {
            if (requestSeqRef.current[t] === seqs[t]) applyPageResult(t, results[i], finalIndex);
        });
    };

    // Full (re)fetch with the page-level loading state. Refetches each type's CURRENT page
    // (or page 1 when resetPage is true) at the current page size.
    const fetchTasks = async (fetchType = "both", { resetPage = false } = {}) => {
        // Read page state synchronously, before any await/re-render
        const { pending: pendingPg, completed: historyPg, itemsPerPage: pageSize } = pageStateRef.current;
        const startPage = {
            pending: resetPage ? 1 : pendingPg,
            completed: resetPage ? 1 : historyPg,
        };

        setLoading(true);
        setError(null);

        try {
            let currentMasterData = masterSheetData;
            if (isCompanyUser && !currentMasterData) {
                currentMasterData = await loadMasterSheetData();
                if (!currentMasterData) {
                    throw new Error("Failed to load company mapping data");
                }
            }

            const types = fetchType === "both" ? ["pending", "completed"] : [fetchType];
            // Combined view: both types share one page index, so load them as one group
            const groups = isCombinedView && types.length === 2 ? [types] : types.map((t) => [t]);

            await Promise.all(
                groups.map((group) => runPageLoad(group, startPage[group[0]] - 1, pageSize))
            );
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const allCurrentTasks = [...pendingData, ...historyData];
        setUniqueParties([
            ...new Set(allCurrentTasks.map((item) => item.partyName).filter(Boolean)),
        ]);
    }, [pendingData, historyData]);

    // Pagination values for the current view
    const pageCountFor = (count) => Math.max(1, Math.ceil(count / itemsPerPage));
    const currentPage = type === "completed" ? historyCurrentPage : pendingCurrentPage;
    const totalResults = type === "pending"
        ? pendingCount
        : type === "completed"
            ? historyCount
            : pendingCount + historyCount;
    const totalPages = isCombinedView
        ? Math.max(pageCountFor(pendingCount), pageCountFor(historyCount))
        : pageCountFor(totalResults);

    // Page change: fetch that page and REPLACE the view's data. Selection is page-scoped, so it resets.
    const handlePageChange = async (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        setPageLoading(true);
        try {
            await runPageLoad(viewTypes, newPage - 1, itemsPerPage);
        } catch (err) {
            console.error("Error loading tasks page:", err);
        } finally {
            setPageLoading(false);
        }
    };

    // Page size change: back to page 1 at the new size
    const handleItemsPerPageChange = async (n) => {
        setItemsPerPage(n);
        setPageLoading(true);
        try {
            await runPageLoad(viewTypes, 0, n);
        } catch (err) {
            console.error("Error loading tasks page:", err);
        } finally {
            setPageLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (userFilterData) {
            setCurrentUser(userFilterData.username || "");
            setUserRole(userFilterData.isAdmin ? "admin" : "user");
        }

        fetchTasks("both", { resetPage: true });
        const interval = setInterval(() => fetchTasks("both"), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userFilterData, companyData?.companyName]);

    // Filtering
    const getFilteredTasks = () => {
        let tasksToFilter = [];

        if (type === "pending") {
            tasksToFilter = pendingData.filter((task) => !!task.assignedMember1Id || !!task.assignedMember1);
        } else if (type === "completed") {
            tasksToFilter = historyData;
        } else {
            tasksToFilter = [...pendingData, ...historyData];
        }

        if (isCompanyUser && companyData?.companyName) {
            const companyNameLower = companyData.companyName.toLowerCase().trim();
            tasksToFilter = tasksToFilter.filter((task) => {
                const taskPartyName = task.partyName ? task.partyName.toLowerCase().trim() : "";
                return taskPartyName === companyNameLower;
            });
        }

        // Employees: pending queue is owned by Member 1 only.
        // After forward, Member 1 swaps → task leaves old owner's pending and enters new owner's pending.
        // Completed: show if user was ever Member 1 or Member 2.
        if (!isCompanyUser && userFilterData) {
            if (isAdminUser || userFilterData.showAllData) {
                // Show all tasks
            } else if (userFilterData.username) {
                const username = userFilterData.username.toLowerCase();
                const uid = userFilterData.userId ?? userFilterData.id ?? null;
                tasksToFilter = tasksToFilter.filter((task) => {
                    if (type === "pending") {
                        if (uid != null && task.assignedMember1Id != null) {
                            return String(task.assignedMember1Id) === String(uid);
                        }
                        const m1 = task.assignedMember1
                            ? task.assignedMember1.toString().toLowerCase()
                            : "";
                        return m1 === username;
                    }
                    // completed / all — either role is fine for history
                    if (uid != null) {
                        if (task.assignedMember1Id != null && String(task.assignedMember1Id) === String(uid)) return true;
                        if (task.assignedMember2Id != null && String(task.assignedMember2Id) === String(uid)) return true;
                    }
                    const m1 = task.assignedMember1 ? task.assignedMember1.toString().toLowerCase() : "";
                    const m2 = task.assignedMember2 ? task.assignedMember2.toString().toLowerCase() : "";
                    return m1 === username || m2 === username;
                });
            }
        }

        const q = (searchTerm || "").toString().trim().toLowerCase();

        const finalTasks = tasksToFilter.filter((task) => {
            let matchesSearch = true;
            if (q) {
                const tokens = q.split(/\s+/).filter(Boolean);
                const blob = [
                    task.taskNo,
                    task.systemName,
                    task.descriptionOfWork,
                    task.partyName,
                    task.assignedMember1,
                    task.assignedMember2,
                    task.postedBy,
                    task.assignedBy,
                    task.notes,
                    task.teamMemberName,
                    task.originalAssignee,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                matchesSearch = tokens.every((t) => blob.includes(t));
            }

            const matchesPriority = !filterPriority || task.priority === filterPriority;
            const normalizedStatus = (task.status || task.uiStatus || "").toString().toLowerCase();
            let matchesStatus = true;
            if (filterStatus) {
                const statusFilter = filterStatus.toLowerCase();
                if (statusFilter === "pending") {
                    matchesStatus =
                        normalizedStatus === "pending" ||
                        normalizedStatus === "in progress" ||
                        normalizedStatus === "assigned";
                } else if (statusFilter === "completed") {
                    matchesStatus = normalizedStatus === "completed";
                } else {
                    matchesStatus = normalizedStatus === statusFilter;
                }
            }
            const matchesParty = filterParty === "all" || task.partyName === filterParty;

            return matchesSearch && matchesPriority && matchesStatus && matchesParty;
        });

        return finalTasks;
    };

    const filteredTasks = getFilteredTasks();

    const handleTaskUpdated = async () => {
        setUpdatingTask(null);
        await fetchTasks("both");
        if (typeof onRefreshStats === "function") onRefreshStats();
    };

    // Forward only when assignment fields are filled (Member 1 + Member 2 required)
    const canForwardRow = (task) => {
        if (!canForwardTask) return false; // admin | superadmin only
        if (type !== "pending") return false;
        if (isCompanyUser) return false;
        if (!task) return false;
        // Sub-task members follow the main task — forward the main task instead
        if (task.isSubtask) return false;
        // Fields must be filled — no Forward on empty / partial rows
        if (!task.assignedMember1Id) return false;
        if (!task.assignedMember2Id) return false;
        return true;
    };

    const handleForwardRow = async (task) => {
        if (!canForwardRow(task)) return;
        const nextId = task.assignedMember2Id;
        if (!nextId) {
            alert("Member 2 is not set on this task.");
            return;
        }
        const byUserId = userFilterData?.userId ?? userFilterData?.id ?? null;
        setForwardingId(task.id);
        try {
            await forwardTaskApi(task.id, {
                nextMemberId: nextId,
                byUserId,
                requireOwner: false, // leadership can force-forward
                currentUserId: byUserId,
            });
            await fetchTasks("both");
            if (typeof onRefreshStats === "function") onRefreshStats();
        } catch (e) {
            alert(e.message || "Forward failed");
        } finally {
            setForwardingId(null);
        }
    };

    // Render states
    if (loading || (isCompanyUser && masterSheetLoading)) {
        return <LoadingState masterSheetLoading={masterSheetLoading} />;
    }

    if (error) {
        return <ErrorState error={error} />;
    }

    return (
        <div className="h-full flex flex-col min-h-0 space-y-6">
            {/* Filters — one non-wrapping row; scrolls horizontally instead of dropping to a second line if it doesn't fit */}
            <div className="flex flex-row flex-nowrap items-center gap-3 overflow-x-auto overflow-y-visible pb-1">
                <div className="relative flex-1 min-w-[180px] max-w-md">
                    <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="relative flex-shrink-0" ref={columnFilterBtnRef}>
                    <Button
                        onClick={() => {
                            if (!showColumnFilter && columnFilterBtnRef.current) {
                                const rect = columnFilterBtnRef.current.getBoundingClientRect();
                                setColumnFilterPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 256) });
                            }
                            setShowColumnFilter(!showColumnFilter);
                        }}
                        className="flex items-center justify-center space-x-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 whitespace-nowrap"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filter Columns</span>
                    </Button>

                    {showColumnFilter && columnFilterPos && createPortal(
                        <div
                            className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
                            style={{ top: columnFilterPos.top, left: columnFilterPos.left }}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">Show/Hide Columns</h3>
                                    <button
                                        onClick={() => setShowColumnFilter(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    <div className="pb-3 mb-3 border-b border-gray-200">
                                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={TABLE_COLUMNS.every(col => visibleColumns[col.key])}
                                                onChange={(e) => handleSelectAllColumns(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-900">Select All</span>
                                        </label>
                                    </div>

                                    {TABLE_COLUMNS.map((column) => (
                                        <label
                                            key={column.key}
                                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[column.key]}
                                                onChange={() => handleColumnToggle(column.key)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{column.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>
                <Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="flex-shrink-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </Select>
                {!isCompanyUser && (
                    <Select
                        value={filterParty}
                        onChange={(e) => setFilterParty(e.target.value)}
                        className="flex-shrink-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Parties</option>
                        {uniqueParties.map((party) => (
                            <option key={party} value={party}>
                                {party}
                            </option>
                        ))}
                    </Select>
                )}
                {!isCompanyUser && type !== "pending" && (
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="flex-shrink-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </Select>
                )}

            </div>

            {/* Tasks Table (shared DataTable: desktop table / mobile cards + pagination footer) */}
            <div
                className={`flex flex-col flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-lg transition-opacity ${pageLoading ? "opacity-60 pointer-events-none" : ""}`}
                aria-busy={pageLoading}
            >
                <TaskTable
                    filteredTasks={filteredTasks}
                    filteredColumns={filteredColumns}
                    onUpdateRow={setUpdatingTask}
                    isTaskSelectable={isTaskSelectable}
                    isCompanyUser={isCompanyUser}
                    isAdminUser={isAdminUser}
                    type={type}
                    canForwardRow={canForwardRow}
                    onForwardRow={handleForwardRow}
                    forwardingId={forwardingId}
                    canForward={canForwardTask}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalResults={totalResults}
                />
            </div>

            {updatingTask && (
                <TaskUpdateModal
                    task={updatingTask}
                    userId={userFilterData?.userId ?? userFilterData?.id ?? null}
                    userName={userFilterData?.name || userFilterData?.username || getCurrentUser()}
                    onClose={() => setUpdatingTask(null)}
                    onSaved={handleTaskUpdated}
                />
            )}
        </div>
    );
}
