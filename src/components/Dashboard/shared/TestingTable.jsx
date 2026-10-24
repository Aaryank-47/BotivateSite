import { useState, useEffect } from "react";
import { formatDate, formatDateTime } from "../../../utils/dateFormatters";
import { dispatchNo } from "../../../services/schemaApi";
import DataTable from "./DataTable";

export const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

/** Columns shared by the Assign Tester and Tester tables (delivery details of a task_testing row). */
export const deliveryColumns = {
  dispatch: { label: "Dispatch Number", render: (r) => dispatchNo(r) },
  taskId: { label: "Task-Id", render: (r) => dash(r.testing_no || r.task?.task_no) },
  testerType: {
    label: "Tester Type",
    render: (r) => {
      if (!r.tester_type) return "—";
      const isReTest = !!r.parent_issue;
      const colorClass =
        r.tester_type === "Backend"
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : "bg-blue-50 text-blue-700 border-blue-200";
      return (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${colorClass}`}>
            {r.tester_type}
          </span>
          {isReTest && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded border border-amber-200">
              Re-test
            </span>
          )}
        </div>
      );
    },
  },
  madeBy: { label: "Made By", render: (r) => dash(r.made_by_user?.name) },
  company: {
    label: "Company Name",
    render: (r) => dash(r.company?.company_name || r.company?.name),
  },
  system: { label: "System Name", render: (r) => dash(r.system?.name) },
  product: { label: "Type Of Product", render: (r) => dash(r.type_of_product) },
  delivered: { label: "Date of Delivery", render: (r) => dash(formatDate(r.date_of_delivery)) },
  link: {
    label: "System Link",
    render: (r) =>
      r.system_link ? (
        <a
          href={r.system_link}
          target="_blank"
          rel="noreferrer"
          title={r.system_link}
          className="font-medium text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : (
        "—"
      ),
  },
  github: {
    label: "GitHub Link",
    render: (r) =>
      r.github_link ? (
        <a
          href={r.github_link}
          target="_blank"
          rel="noreferrer"
          title={r.github_link}
          className="font-medium text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : (
        "—"
      ),
  },
  id: { label: "Id", render: (r) => dash(r.system_login_id) },
  pass: { label: "Pass", render: (r) => dash(r.system_password) },
};

/** Sub-task(s) raised from a row at one stage (task_subtasks.relation_type), e.g. "TASK-00047-1 · In Progress". */
export const reworkColumn = (relationType) => ({
  label: "Rework Task",
  render: (r) => {
    const reworks = (r.reworks || []).filter((x) => x.relation_type === relationType);
    if (!reworks.length) return "—";
    return (
      <div className="flex flex-col gap-0.5 whitespace-nowrap">
        {reworks.map((x) => (
          <span key={x.id}>
            <span className="font-mono font-semibold text-indigo-600">{x.task_no}</span>
            <span className="text-xs text-gray-500"> · {x.status}</span>
          </span>
        ))}
      </div>
    );
  },
});

/**
 * Who marked a row Done / raised the issue at one stage, and when (the logged-in member who saved it).
 * `by` / `at` are the task_testing columns of that stage, e.g. tested_by / tested_at;
 * `fail` is that stage's failing status ("Issue" or "Not Done").
 */
export const actionByColumns = ({ status, by, at, fail }) => {
  const when = (r, s) => (r[status] === s ? dash(formatDateTime(r[at])) : "—");
  const who = (r, s) => (r[status] === s ? dash(r[by]) : "—");
  return [
    { label: "Done By", render: (r) => who(r, "Done") },
    { label: "Done At", render: (r) => when(r, "Done") },
    { label: "Issue Raised By", render: (r) => who(r, fail) },
    { label: "Issue Raised At", render: (r) => when(r, fail) },
  ];
};

/** Table with client-side pagination + mobile cards for task_testing rows. */
export default function TestingTable({ rows, columns, minWidth = "min-w-[1200px]" }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const tdClass = "px-4 py-3 text-sm text-gray-700 text-center align-middle";

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-xl">
      <DataTable
        headers={columns.map((c) => c.label)}
        data={pageRows}
        minWidth={minWidth}
        renderRow={(row) => (
          <tr key={row.id} className="hover:bg-gray-50">
            {columns.map((c) => (
              <td key={c.label} className={tdClass}>
                {c.render(row)}
              </td>
            ))}
          </tr>
        )}
        renderCard={(row) => (
          <div key={row.id} className="p-4 space-y-2 text-sm bg-white border border-gray-100 rounded-xl shadow-sm">
            {columns.map((c) =>
              c.fullWidth ? (
                <div key={c.label} className="pt-2 mt-1 border-t border-gray-100">
                  {c.render(row)}
                </div>
              ) : (
                <div key={c.label} className="flex justify-between gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase shrink-0">{c.label}</span>
                  <span className="min-w-0 text-right text-gray-900 break-words">{c.render(row)}</span>
                </div>
              )
            )}
          </div>
        )}
        currentPage={page}
        totalPages={totalPages}
        itemsPerPage={perPage}
        onPageChange={setPage}
        onItemsPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        totalResults={rows.length}
      />
    </div>
  );
}

export function TabButton({ active, color, icon: Icon, label, count, onClick }) {
  const colors = {
    orange: ["border-orange-500 text-orange-600", "bg-orange-100 text-orange-700"],
    purple: ["border-purple-500 text-purple-600", "bg-purple-100 text-purple-700"],
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 pb-2 text-sm font-medium border-b-2 ${
        active ? colors[0] : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`px-1.5 py-0.5 text-xs rounded-full ${colors[1]}`}>{count}</span>
    </button>
  );
}
