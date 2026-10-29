import React from "react";
import { FileText, Send, AlertTriangle } from "lucide-react";
import { formatDateToDDMMYY } from "../../../utils/dateFormatters";
import ExpandableText from "../shared/ExpandableText";
import { getStatusBadgeClass, getStatusText } from "./SubComponents";
import { TaskAccessCell } from "./TaskAccessCell";

export default function MobileCards({
    filteredTasks,
    filteredColumns,
    onUpdateRow,
    isTaskSelectable,
    isCompanyUser,
    isAdminUser,
    type,
    lastTaskRef,
    canForwardRow,
    onForwardRow,
    forwardingId,
}) {
    return (
        <div className="lg:hidden">
            <div className="p-4 space-y-4">
                {filteredTasks.map((task, index) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        cardRef={index === filteredTasks.length - 1 ? lastTaskRef : null}
                        filteredColumns={filteredColumns}
                        onUpdateRow={onUpdateRow}
                        isTaskSelectable={isTaskSelectable}
                        isCompanyUser={isCompanyUser}
                        type={type}
                        canForwardRow={canForwardRow}
                        onForwardRow={onForwardRow}
                        forwardingId={forwardingId}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Single task card (mobile view). Used by MobileCards above and as the
 * `renderCard` implementation for the shared DataTable in TaskTable.
 */
export function TaskCard({
    task,
    cardRef = null,
    filteredColumns,
    onUpdateRow,
    isTaskSelectable,
    isCompanyUser,
    type,
    canForwardRow,
    onForwardRow,
    forwardingId,
}) {
    return (
                    <div
                        ref={cardRef}
                        className={`p-4 border rounded-xl transition-all ${
                            task.isRejected
                                ? "border-rose-300 bg-rose-50/70 shadow-sm ring-1 ring-rose-200"
                                : "border-gray-200 bg-gray-50"
                        }`}
                    >
                        {/* Rejected from testing badge */}
                        {task.isRejected && (
                            <div className="mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                    Rejected from {task.rejectType || "Testing"}
                                </span>
                            </div>
                        )}

                        {/* Update action */}
                        {!isCompanyUser && type === "pending" && (
                            <div className="mb-3">
                                <button
                                    type="button"
                                    onClick={() => onUpdateRow?.(task)}
                                    disabled={!isTaskSelectable(task)}
                                    className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Update
                                </button>
                            </div>
                        )}

                        {/* Status Badge */}
                        {!isCompanyUser && (
                            <div className="mb-3">
                                <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(task)}`}
                                >
                                    {getStatusText(task)}
                                </span>
                            </div>
                        )}

                        {/* Assignment Info for non-company users */}
                        {!isCompanyUser && (
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned By
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.assignedBy || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Time Required
                                    </div>
                                    <div className="text-gray-900">
                                        {task.timeRequired || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned Member1
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.assignedMember1 || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        Assigned Member2
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {task.assignedMember2 || "-"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rejection reason for non-company users */}
                        {!isCompanyUser && task.isRejected && task.rejectedReason && (
                            <div className="mb-4 p-2.5 rounded-lg bg-rose-100/70 border border-rose-200">
                                <div className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Rejected Reason ({task.rejectType || "Testing"})
                                </div>
                                <div className="text-sm font-semibold text-rose-950 mt-1 break-words">
                                    {task.rejectedReason}
                                </div>
                            </div>
                        )}

                        {/* Remarks for non-company users */}
                        {!isCompanyUser && task.remarks && task.remarks !== task.rejectedReason && (
                            <div className="mb-4">
                                <div className="text-xs tracking-wider text-gray-500 uppercase">
                                    Remarks
                                </div>
                                <div className="text-sm text-gray-900 break-words">
                                    {task.remarks}
                                </div>
                            </div>
                        )}

                        {!isCompanyUser &&
                            type === "pending" &&
                            typeof canForwardRow === "function" &&
                            canForwardRow(task) && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => onForwardRow?.(task)}
                                    disabled={forwardingId === task.id}
                                    className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {forwardingId === task.id
                                        ? "Forwarding…"
                                        : `Forward to ${task.assignedMember2 || "Member 2"}`}
                                </button>
                            </div>
                        )}

                        {/* Task Details from visibleColumns */}
                        <div className="space-y-3">
                            {filteredColumns.map((column) => (
                                <div key={column.key}>
                                    <div className="text-xs tracking-wider text-gray-500 uppercase">
                                        {column.label}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-900">
                                        {column.key === "linkOfSystem" ? (
                                            type === "completed" ? (
                                                <TaskAccessCell task={task} />
                                            ) : task[column.key] ? (
                                                <a
                                                    href={task[column.key]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-1 text-blue-600 hover:underline"
                                                >
                                                    <span>View Link</span>
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                    </svg>
                                                </a>
                                            ) : "-"
                                        ) : column.key === "attachmentFile" &&
                                            task[column.key] ? (
                                            <a
                                                href={task[column.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 text-blue-600 transition-colors hover:text-blue-800"
                                            >
                                                <FileText className="w-4 h-4" />
                                                <span>View Attachment</span>
                                            </a>
                                        ) : column.key === "expectedDateToClose" ||
                                            column.key === "givenDate" ||
                                            column.key === "actualDate" ? (
                                            formatDateToDDMMYY(task[column.key]) || "-"
                                        ) : column.key === "descriptionOfWork" ||
                                            column.key === "notes" ? (
                                            <div className="mt-1">
                                                <ExpandableText text={task[column.key]} />
                                            </div>
                                        ) : (
                                            task[column.key] || "-"
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
    );
}
