"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, History, RefreshCw } from "lucide-react";
import { formatDate } from "../../../utils/dateFormatters";
import {
  fetchTaskTesting,
  fetchAssignableMembers,
  assignTester,
  TESTER_TYPES,
} from "../../../services/schemaApi";
import { LoadingIndicator, ErrorMessage } from "../shared/StatusIndicators";
import Modal, { Field, ReadOnlyField, inputClass } from "../shared/Modal";
import TestingTable, { TabButton, deliveryColumns as dc, dash } from "../shared/TestingTable";
import Select from "../shared/Select";

function AssignTesterModal({ row, testers, assignedBy, onClose, onSaved }) {
  const [expectedDate, setExpectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  // the second half of a split delivery already knows its type; a fresh delivery can take both
  const types = row.tester_type ? [row.tester_type] : TESTER_TYPES;
  const [checked, setChecked] = useState(() =>
    Object.fromEntries(types.map((t) => [t, types.length === 1]))
  );
  const [testerIds, setTesterIds] = useState(() => {
    if (row.tester_type && row.parent_issue?.previous_tester_id) {
      return { [row.tester_type]: String(row.parent_issue.previous_tester_id) };
    }
    return {};
  });
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!expectedDate) return setError("Assign Date is required.");
    const chosen = types.filter((t) => checked[t]);
    if (!chosen.length) return setError("Select at least one type of testing is required to be done.");
    const missing = chosen.find((t) => !testerIds[t]);
    if (missing) return setError(`Select the ${missing} tester.`);
    setSaving(true);
    try {
      await assignTester(row, {
        testers: Object.fromEntries(chosen.map((t) => [t, testerIds[t]])),
        expectedDate,
        remarks: remarks.trim(),
        assignedBy,
      });
      await onSaved();
    } catch (e) {
      setError(e.message || "Failed to assign tester");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Assign Tester"
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
      {row.parent_issue && (
        <div className="p-3 text-xs bg-amber-50 border border-amber-200 rounded-xl text-amber-900 sm:col-span-2 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-950">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded">
              Re-test Required
            </span>
            <span>
              This rework task was raised from a {row.parent_issue.source_tester_type || row.tester_type} testing issue
            </span>
          </div>
          {row.parent_issue.previous_tester?.name && (
            <p className="text-amber-800">
              Previous Tester: <span className="font-semibold text-amber-950">{row.parent_issue.previous_tester.name}</span>
            </p>
          )}
          {row.parent_issue.remarks && (
            <p className="text-amber-800">
              Issue description: <span className="italic font-medium text-amber-950">"{row.parent_issue.remarks}"</span>
            </p>
          )}
        </div>
      )}
      <ReadOnlyField label="Dispatch Number" value={dc.dispatch.render(row)} />
      <ReadOnlyField label="Task-Id" value={dc.taskId.render(row)} />
      <ReadOnlyField label="System Name" value={row.system?.name} />
      <Field label="Assign Date" required>
        <input
          type="date"
          className={inputClass}
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
        />
      </Field>
      <Field full label="Tester Type" required>
        <div className="space-y-3">
          {types.map((t) => (
            <div key={t} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:w-40 shrink-0">
                <input
                  type="checkbox"
                  checked={!!checked[t]}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setChecked((c) => ({ ...c, [t]: isChecked }));
                    if (!isChecked) {
                      setTesterIds((ids) => {
                        const next = { ...ids };
                        delete next[t];
                        return next;
                      });
                    }
                  }}
                />
                {t} Tester
              </label>
              <Select
                className={inputClass}
                value={testerIds[t] || ""}
                disabled={!checked[t]}
                onChange={(e) => {
                  const val = e.target.value;
                  setTesterIds((ids) => ({ ...ids, [t]: val }));
                  if (val) setChecked((c) => ({ ...c, [t]: true }));
                }}
              >
                <option value="">Select {t.toLowerCase()} tester</option>
                {testers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          ))}
          {types.length > 1 && (
            <p className="text-xs text-gray-500">Select Frontend, Backend, or both testing types as needed.</p>
          )}
        </div>
      </Field>
      <Field full label="Remarks">
        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}

export default function AssignTesterPage({ userFilterData }) {
  const [rows, setRows] = useState([]);
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [assigning, setAssigning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, m] = await Promise.all([fetchTaskTesting(), fetchAssignableMembers()]);
      setRows(r);
      setTesters(m);
    } catch (e) {
      setError(e.message || "Failed to load testing queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => rows.filter((r) => !r.tester_id), [rows]);
  const history = useMemo(() => rows.filter((r) => r.tester_id), [rows]);

  const delivery = [dc.dispatch, dc.taskId, dc.testerType, dc.madeBy, dc.company, dc.system, dc.product, dc.delivered, dc.link, dc.github, dc.id, dc.pass];

  const pendingColumns = [
    {
      label: "Action",
      render: (r) => (
        <button
          type="button"
          onClick={() => setAssigning(r)}
          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Assign Tester
        </button>
      ),
    },
    ...delivery,
  ];

  const historyColumns = [
    { label: "Assign Date", render: (r) => dash(formatDate(r.expected_testing_date)) },
    { label: "Tester", render: (r) => dash(r.tester?.name) },
    { label: "Remarks", render: (r) => dash(r.assign_remarks) },
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

      {loading && <LoadingIndicator message="Loading testing queue…" />}
      {error && <ErrorMessage error={error} />}
      {!loading && !error && (
        <TestingTable
          rows={tab === "pending" ? pending : history}
          columns={tab === "pending" ? pendingColumns : historyColumns}
        />
      )}

      {assigning && (
        <AssignTesterModal
          row={assigning}
          testers={testers}
          assignedBy={userFilterData?.userId ?? userFilterData?.id ?? null}
          onClose={() => setAssigning(null)}
          onSaved={async () => {
            setAssigning(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
