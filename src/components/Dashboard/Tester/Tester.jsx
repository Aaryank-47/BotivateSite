"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, History, RefreshCw } from "lucide-react";
import { formatDate } from "../../../utils/dateFormatters";
import { fetchTaskTesting, submitTesterResult } from "../../../services/schemaApi";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";
import Modal, { Field, ReadOnlyField, inputClass } from "../shared/Modal";
import TestingTable, { TabButton, deliveryColumns as dc, dash, reworkColumn, actionByColumns } from "../shared/TestingTable";
import Select from "../shared/Select";

function TestResultModal({ row, userId, userName, onClose, onSaved }) {
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState(row.tester_remarks || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!status) return setError("Select a status.");
    if (status === "Issue" && !remarks.trim()) return setError("Describe the issue in Remarks.");
    setSaving(true);
    try {
      await submitTesterResult(row, { status, remarks: remarks.trim(), byUserId: userId, byName: userName });
      await onSaved();
    } catch (e) {
      setError(e.message || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Test Result"
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
      <ReadOnlyField label="Task-Id" value={dc.taskId.render(row)} />
      <ReadOnlyField label="Tester Type" value={row.tester_type} />
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
          <option value="Issue">Issue</option>
        </Select>
      </Field>
      <Field full label={status === "Issue" ? "Remarks (issue description)" : "Remarks"} required={status === "Issue"}>
        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
      {status === "Issue" && (
        <p className="text-xs text-gray-500 sm:col-span-2">
          The issue is added automatically to Pending Tasks for {row.made_by_user?.name || "the person who made this"}.
        </p>
      )}
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}

export default function Tester({ userRole, userFilterData }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [testing, setTesting] = useState(null);

  const userId = userFilterData?.userId ?? userFilterData?.id ?? null;
  const seesAll =
    userRole === "admin" || userRole === "superadmin" || !!userFilterData?.isAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchTaskTesting());
    } catch (e) {
      setError(e.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only rows already assigned to a tester; non-admins see just their own
  const mine = useMemo(
    () =>
      rows.filter(
        (r) => r.tester_id && (seesAll || String(r.tester_id) === String(userId))
      ),
    [rows, seesAll, userId]
  );
  const pending = useMemo(() => mine.filter((r) => r.test_status === "Pending"), [mine]);
  const history = useMemo(() => mine.filter((r) => r.test_status !== "Pending"), [mine]);

  const delivery = [dc.dispatch, dc.taskId, dc.testerType, dc.madeBy, dc.company, dc.system, dc.product, dc.delivered, dc.link, dc.github, dc.id, dc.pass];

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
            r.test_status === "Done" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {r.test_status}
        </span>
      ),
    },
    ...actionByColumns({ status: "test_status", by: "tested_by", at: "tested_at", fail: "Issue" }),
    { label: "Remarks", render: (r) => dash(r.tester_remarks) },
    reworkColumn("Testing Issue"),
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

      {loading && <LoadingIndicator message="Loading tests…" />}
      {error && <ErrorMessage error={error} />}
      {!loading && !error && (
        <TestingTable
          rows={tab === "pending" ? pending : history}
          columns={tab === "pending" ? pendingColumns : historyColumns}
        />
      )}

      {testing && (
        <TestResultModal
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
