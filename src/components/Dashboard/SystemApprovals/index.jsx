"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, History, RefreshCw, Search } from "lucide-react";
import { formatDate } from "../../../utils/dateFormatters";
import {
  fetchSystemRequests,
  approveSystemRequest,
  rejectSystemRequest,
} from "../../../services/schemaApi";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";
import Modal, { Field, inputClass } from "../shared/Modal";
import Select from "../shared/Select";
import TestingTable, { TabButton, dash } from "../shared/TestingTable";

const companyOf = (r) => r.company?.company_name || r.company?.name || "—";

function DecisionModal({ req, mode, onClose, onDone, approverId }) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const approving = mode === "approve";

  const confirm = async () => {
    if (!approving && !remarks.trim()) return setError("Please give a reason for rejecting.");
    setSaving(true);
    try {
      const fn = approving ? approveSystemRequest : rejectSystemRequest;
      await fn(req, { approverId, remarks: remarks.trim() });
      await onDone(approving ? `“${req.system_name}” approved and added to ${companyOf(req)}.` : "Request rejected.");
    } catch (e) {
      setError(e?.message || "Something went wrong.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title={approving ? "Approve new system" : "Reject request"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
              approving ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving ? "Saving…" : approving ? "Approve" : "Reject"}
          </button>
        </>
      }
    >
      <div className="sm:col-span-2 text-sm text-gray-700">
        <p>
          <span className="font-semibold">{req.system_name}</span> requested by{" "}
          <span className="font-semibold">{companyOf(req)}</span>
        </p>
        <p className="mt-1 text-gray-500">{req.description || "No description"}</p>
        {approving && (
          <p className="mt-2 text-xs text-emerald-700">
            On approval the system is added to the company's systems list and a build task is opened in Pending Tasks.
          </p>
        )}
      </div>
      <Field full label={approving ? "Remarks (optional)" : "Reason for rejecting"} required={!approving}>
        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}

/** Superadmin: approve / reject the new-system requests that companies file. */
export default function SystemApprovals({ userFilterData }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [decision, setDecision] = useState(null); // { req, mode }
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const approverId = userFilterData?.userId ?? userFilterData?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchSystemRequests());
    } catch (e) {
      setError(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => rows.filter((r) => r.status === "Pending"), [rows]);
  const history = useMemo(() => rows.filter((r) => r.status !== "Pending"), [rows]);

  const companies = useMemo(
    () => [...new Set(rows.map((r) => companyOf(r)).filter((c) => c !== "—"))].sort(),
    [rows]
  );

  // filters apply to whichever tab is open
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tab === "pending" ? pending : history).filter((r) => {
      if (companyFilter !== "all" && companyOf(r) !== companyFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (tab === "history" && resultFilter !== "all" && r.status !== resultFilter) return false;
      if (!q) return true;
      return [r.system_name, r.department, r.description, companyOf(r)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [tab, pending, history, search, companyFilter, priorityFilter, resultFilter]);

  const base = [
    { label: "Company", render: (r) => companyOf(r) },
    { label: "System Name", render: (r) => <span className="font-semibold">{r.system_name}</span> },
    { label: "Department", render: (r) => dash(r.department) },
    { label: "Description", render: (r) => <span className="block max-w-[320px] text-xs text-slate-500">{dash(r.description)}</span> },
    {
      label: "Attachment",
      render: (r) =>
        r.attachment_url ? (
          <a href={r.attachment_url} target="_blank" rel="noreferrer" download={r.attachment_name || undefined} className="font-medium text-blue-600 hover:underline">
            {r.attachment_name || "View"}
          </a>
        ) : (
          "—"
        ),
    },
    { label: "Priority", render: (r) => dash(r.priority) },
    { label: "Expected Requirement Date", render: (r) => dash(formatDate(r.needed_by)) },
    { label: "Requested On", render: (r) => dash(formatDate(r.created_at)) },
  ];

  const pendingColumns = [
    {
      label: "Action",
      fullWidth: true,
      render: (r) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setDecision({ req: r, mode: "approve" })}
            className="flex-1 px-3 py-2 text-xs font-semibold text-white rounded-md md:flex-none md:py-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setDecision({ req: r, mode: "reject" })}
            className="flex-1 px-3 py-2 text-xs font-semibold text-red-700 rounded-md md:flex-none md:py-1 bg-red-50 hover:bg-red-100"
          >
            Reject
          </button>
        </div>
      ),
    },
    ...base,
  ];

  const historyColumns = [
    {
      label: "Result",
      render: (r) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            r.status === "Approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    { label: "Decided On", render: (r) => dash(formatDate(r.decided_at)) },
    { label: "Remarks", render: (r) => dash(r.decision_remarks) },
    ...base,
  ];

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Mobile: tabs + refresh, then search, then filters in a 2-col grid. Desktop: everything in one row. */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="flex items-center gap-4 order-1 mr-2 md:order-1">
          <TabButton active={tab === "pending"} color="orange" icon={Clock} label="Pending" count={pending.length} onClick={() => setTab("pending")} />
          <TabButton active={tab === "history"} color="purple" icon={History} label="History" count={history.length} onClick={() => setTab("history")} />
        </div>

        {/* Filters */}
        <div className="relative order-3 w-full md:order-2 md:w-auto md:flex-1 md:min-w-[200px]">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3.5 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system, department or description…"
            className="w-full py-2 pl-10 pr-3 text-sm bg-white border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
          />
        </div>
        <div className="grid order-4 w-full grid-cols-2 gap-2 md:contents">
          <Select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="col-span-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-full md:order-3 md:col-span-1 md:w-52"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-4 py-2 text-sm bg-white border border-gray-200 rounded-full md:order-3 md:w-40 ${
              tab === "history" ? "" : "col-span-2 md:col-span-1"
            }`}
          >
            <option value="all">All priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
          {tab === "history" && (
            <Select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full md:order-3 md:w-40"
            >
              <option value="all">All results</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          aria-label="Refresh"
          className="inline-flex items-center gap-2 px-3 py-2 ml-auto text-sm font-medium text-white bg-blue-600 rounded-full order-2 md:order-4 md:px-4 hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading && <LoadingIndicator message="Loading requests…" />}
      {error && <ErrorMessage error={error} />}
      {!loading && !error && (
        <TestingTable
          rows={shown}
          columns={tab === "pending" ? pendingColumns : historyColumns}
        />
      )}

      {decision && (
        <DecisionModal
          req={decision.req}
          mode={decision.mode}
          approverId={approverId}
          onClose={() => setDecision(null)}
          onDone={async (msg) => {
            setDecision(null);
            setNotice(msg);
            setTimeout(() => setNotice(""), 3500);
            await load();
          }}
        />
      )}

      {notice && (
        <div className="fixed z-[60] px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg bottom-4 left-4 right-4 text-center sm:left-auto sm:right-6 sm:bottom-6 bg-emerald-600">
          {notice}
        </div>
      )}
    </div>
  );
}
