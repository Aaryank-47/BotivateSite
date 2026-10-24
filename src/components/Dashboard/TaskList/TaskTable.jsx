import React from "react";
import { FileText, Send } from "lucide-react";
import { formatDateToDDMMYY } from "../../../utils/dateFormatters";
import {
  getPriorityColor,
  getStatusBadgeClass,
  getStatusText,
} from "./SubComponents";
import ExpandableText from "../shared/ExpandableText";
import DataTable from "../shared/DataTable";
import { TaskCard } from "./MobileCards";

const thClass =
  "px-3 py-2.5 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase bg-gray-50 whitespace-nowrap border-b border-gray-200 overflow-hidden";

const tdClass =
  "px-3 py-2.5 text-sm text-gray-800 text-center align-middle border-b border-gray-100 overflow-hidden";

/** Fixed widths so every row lines up cleanly */
const COL = {
  select: { width: 90 },
  forward: { width: 100 },
  assignedBy: { width: 120 },
  member1: { width: 140 },
  member2: { width: 140 },
  timeRequired: { width: 110 },
  remarks: { width: 180 },
  taskNo: { width: 110 },
  givenDate: { width: 95 },
  postedBy: { width: 120 },
  takenFrom: { width: 120 },
  typeOfWork: { width: 150 },
  partyName: { width: 150 },
  systemName: { width: 160 },
  descriptionOfWork: { width: 260 },
  notes: { width: 160 },
  linkOfSystem: { width: 70 },
  attachmentFile: { width: 90 },
  priorityInCustomer: { width: 90 },
  expectedDateToClose: { width: 110 },
  status: { width: 110 },
};

function cellStyle(key) {
  const w = COL[key]?.width;
  if (!w) return undefined;
  return {
    width: w,
    minWidth: w,
    maxWidth: key === "descriptionOfWork" || key === "notes" ? w + 80 : w,
  };
}

function renderCell(column, task) {
  const key = column.key;
  const value = task[key];

  if (key === "linkOfSystem") {
    if (!value) return <span className="text-gray-400">—</span>;
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        title={value}
        className="font-medium text-blue-600 hover:underline"
      >
        Link
      </a>
    );
  }

  if (key === "attachmentFile") {
    if (!value) return <span className="text-gray-400">—</span>;
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
      >
        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
        View
      </a>
    );
  }

  if (["expectedDateToClose", "givenDate", "actualDate"].includes(key)) {
    return formatDateToDDMMYY(value) || (
      <span className="text-gray-400">—</span>
    );
  }

  if (key === "descriptionOfWork" || key === "notes") {
    if (!value) return <span className="text-gray-400">—</span>;
    return (
      <div className="max-w-full overflow-hidden text-sm text-gray-900">
        <ExpandableText text={value} />
      </div>
    );
  }

  if (key === "priorityInCustomer") {
    if (!value) return <span className="text-gray-400">—</span>;
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(
          value
        )}`}
      >
        {value}
      </span>
    );
  }

  if (key === "taskNo") {
    return (
      <span className="font-semibold text-blue-600 whitespace-nowrap">
        {value || "—"}
      </span>
    );
  }

  return value ? (
    <span className="block" title={String(value)}>
      {value}
    </span>
  ) : (
    <span className="text-gray-400">—</span>
  );
}

function EmptyDash() {
  return <span className="text-gray-400">—</span>;
}

export default function TaskTable({
  filteredTasks,
  filteredColumns,
  onUpdateRow,
  isTaskSelectable,
  isCompanyUser,
  isAdminUser,
  type,
  // eslint-disable-next-line no-unused-vars
  lastTaskRef, // legacy (infinite scroll) – no longer used, kept for signature compatibility
  canForwardRow,
  onForwardRow,
  forwardingId,
  canForward = false,
  // Pagination (forwarded to the shared DataTable)
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 50,
  onPageChange = () => {},
  onItemsPerPageChange = () => {},
  totalResults = 0,
}) {
  const showAssignmentCols = !isCompanyUser;
  const showSelect = !isCompanyUser && type === "pending";
  // Forward column only for admin/superadmin (canForward), not HOD/employees
  const showForward = !isCompanyUser && type === "pending" && canForward;

  const headers = [
    ...(showSelect ? [{ label: "Action", width: COL.select.width }] : []),
    ...(showForward ? [{ label: "Forward", width: COL.forward.width }] : []),
    ...(showAssignmentCols
      ? [
          { label: "Assigned By", width: COL.assignedBy.width },
          { label: "Assigned Member 1", width: COL.member1.width },
          { label: "Assigned Member 2", width: COL.member2.width },
          { label: "Time Required", width: COL.timeRequired.width },
          { label: "Remarks", width: COL.remarks.width },
        ]
      : []),
    ...filteredColumns.map((column) => ({
      label: column.label,
      width: COL[column.key]?.width,
    })),
    ...(!isCompanyUser ? [{ label: "Status", width: COL.status.width }] : []),
  ];

  const renderRow = (task) => (
    <tr key={task.id} className="hover:bg-gray-50/80">
      {showSelect && (
        <td
          className={`${tdClass} text-center align-middle`}
          style={cellStyle("select")}
        >
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => onUpdateRow?.(task)}
              disabled={!isTaskSelectable(task)}
              title={
                isTaskSelectable(task)
                  ? "Update task"
                  : "Only the assigned owner can update this task"
              }
              className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Update
            </button>
          </div>
        </td>
      )}

      {showForward && (
        <td
          className={`${tdClass} text-center align-middle`}
          style={cellStyle("forward")}
        >
          <div className="flex items-center justify-center">
            {typeof canForwardRow === "function" &&
            canForwardRow(task) ? (
              <button
                type="button"
                onClick={() => onForwardRow?.(task)}
                disabled={forwardingId === task.id}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-100 transition disabled:opacity-50 whitespace-nowrap"
                title={`Forward to ${
                  task.assignedMember2 || "Member 2"
                }`}
              >
                <Send className="w-3 h-3 flex-shrink-0" />
                {forwardingId === task.id ? "…" : "Forward"}
              </button>
            ) : (
              <EmptyDash />
            )}
          </div>
        </td>
      )}

      {showAssignmentCols && (
        <>
          <td className={tdClass} style={cellStyle("assignedBy")}>
            <span className="block">
              {task.assignedBy || <EmptyDash />}
            </span>
          </td>
          <td className={tdClass} style={cellStyle("member1")}>
            <span className="block">
              {task.assignedMember1 || <EmptyDash />}
            </span>
          </td>
          <td className={tdClass} style={cellStyle("member2")}>
            <span className="block">
              {task.assignedMember2 || <EmptyDash />}
            </span>
          </td>
          <td className={tdClass} style={cellStyle("timeRequired")}>
            <span className="whitespace-nowrap">
              {task.timeRequired ? (
                formatDateToDDMMYY(task.timeRequired)
              ) : (
                <EmptyDash />
              )}
            </span>
          </td>
          <td className={tdClass} style={cellStyle("remarks")}>
            {task.remarks ? (
              <ExpandableText text={task.remarks} />
            ) : (
              <EmptyDash />
            )}
          </td>
        </>
      )}

      {filteredColumns.map((column) => (
        <td
          key={column.key}
          className={tdClass}
          style={cellStyle(column.key)}
        >
          {renderCell(column, task)}
        </td>
      ))}

      {!isCompanyUser && (
        <td className={tdClass} style={cellStyle("status")}>
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusBadgeClass(
              task
            )}`}
          >
            {getStatusText(task)}
          </span>
        </td>
      )}
    </tr>
  );

  const renderCard = (task) => (
    <TaskCard
      key={task.id}
      task={task}
      filteredColumns={filteredColumns}
      onUpdateRow={onUpdateRow}
      isTaskSelectable={isTaskSelectable}
      isCompanyUser={isCompanyUser}
      type={type}
      canForwardRow={canForwardRow}
      onForwardRow={onForwardRow}
      forwardingId={forwardingId}
    />
  );

  return (
    <DataTable
      headers={headers}
      data={filteredTasks}
      renderRow={renderRow}
      renderCard={renderCard}
      minWidth="min-w-[1600px]"
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onItemsPerPageChange={onItemsPerPageChange}
      totalResults={totalResults}
    />
  );
}
