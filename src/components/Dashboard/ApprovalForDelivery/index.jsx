"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, History, RefreshCw } from "lucide-react";
import { formatDate } from "../../../utils/dateFormatters";
import { fetchApprovalRows, submitApprovalResult, activePartsOf } from "../../../services/schemaApi";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";
import Modal, { Field, ReadOnlyField, inputClass } from "../shared/Modal";
import TestingTable, { TabButton, deliveryColumns as dc, dash, reworkColumn, actionByColumns } from "../shared/TestingTable";
import Select from "../shared/Select";

function ApprovalModal({ row, userId, userName, onClose, onSaved }) {
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState(row.approval_remarks || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!status) return setError("Select a status.");
    if (status === "Not Done" && !remarks.trim()) return setError("Describe what is pending in Remarks.");
    setSaving(true);
    try {
      await submitApprovalResult(row, { status, remarks: remarks.trim(), byUserId: userId, byName: userName });
      await onSaved();
    } catch (e) {
      setError(e.message || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Approval For Delivery"
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
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <ReadOnlyField label="Dispatch Number" value={dc.dispatch.render(row)} />
      <ReadOnlyField label="Task-Id" value={activePartsOf(row.parts).map((p) => p.testing_no || p.task?.task_no).join(", ")} />
      <ReadOnlyField label="Made By" value={row.made_by_user?.name} />
      <ReadOnlyField label="Company Name" value={row.company?.company_name || row.company?.name} />
      <ReadOnlyField label="System Name" value={row.system?.name} />
      <ReadOnlyField label="Type Of Product" value={row.type_of_product} />
      <ReadOnlyField label="Date of Delivery" value={formatDate(row.date_of_delivery)} />
      <ReadOnlyField label="System Link" value={row.system_link} />
      <ReadOnlyField label="Id" value={row.system_login_id} />
      <ReadOnlyField label="Pass" value={row.system_password} />
      <Field label="Status" required>
        <Select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Select</option>
          <option value="Done">Done</option>
          <option value="Not Done">Not Done</option>
        </Select>
      </Field>
      <Field full label={status === "Not Done" ? "Remarks (what needs fixing)" : "Remarks"} required={status === "Not Done"}>
        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
      {status === "Not Done" && (
        <p className="text-xs text-gray-500 sm:col-span-2">
          The rework is added automatically to Pending Tasks for {row.made_by_user?.name || "the person who made this"}.
        </p>
      )}
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}

export default function ApprovalForDelivery({ userFilterData }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [testing, setTesting] = useState(null);

  const userId = userFilterData?.userId ?? userFilterData?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchApprovalRows());
    } catch (e) {
      setError(e.message || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Deliveries enter this stage once both the Frontend and Backend tests are Done
  const pending = useMemo(() => rows.filter((r) => (r.approval_status || "Pending") === "Pending"), [rows]);
  const history = useMemo(() => rows.filter((r) => (r.approval_status || "Pending") !== "Pending"), [rows]);

  const taskIds = {
    label: "Task-Id",
    render: (r) => (
      <div className="flex flex-col gap-0.5 whitespace-nowrap">
        {activePartsOf(r.parts).map((p) => (
          <span key={p.id}>{dash(p.testing_no || p.task?.task_no)}</span>
        ))}
      </div>
    ),
  };

  const delivery = [dc.dispatch, taskIds, dc.madeBy, dc.company, dc.system, dc.product, dc.delivered, dc.link, dc.github, dc.id, dc.pass];

  const pendingColumns = [
    {
      label: "Action",
      render: (r) => (
        <button
          type="button"
          onClick={() => setTesting(r)}
          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Action
        </button>
      ),
    },
    ...delivery,
  ];

  const historyColumns = [
    {
      label: "Result",
      render: (r) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            r.approval_status === "Done" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {r.approval_status}
        </span>
      ),
    },
    ...actionByColumns({ status: "approval_status", by: "approval_checked_by", at: "approval_checked_at", fail: "Not Done" }),
    { label: "Remarks", render: (r) => dash(r.approval_remarks) },
    reworkColumn("Approval Not Done"),
    ...delivery,
  ];

  return (
    <div className="flex flex-col h-full min-h-0 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TabButton
            active={tab === "pending"}
            color="orange"
            icon={Clock}
            label="Pending"
            count={pending.length}
            onClick={() => setTab("pending")}
          />
          <TabButton
            active={tab === "history"}
            color="purple"
            icon={History}
            label="History"
            count={history.length}
            onClick={() => setTab("history")}
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading && <LoadingIndicator message="Loading approvals…" />}
      {error && <ErrorMessage error={error} />}
      {!loading && !error && (
        <TestingTable
          rows={tab === "pending" ? pending : history}
          columns={tab === "pending" ? pendingColumns : historyColumns}
        />
      )}

      {testing && (
        <ApprovalModal
          row={testing}
          userId={userId}
          userName={userFilterData?.name || userFilterData?.username}
          onClose={() => setTesting(null)}
          onSaved={async () => {
            setTesting(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
