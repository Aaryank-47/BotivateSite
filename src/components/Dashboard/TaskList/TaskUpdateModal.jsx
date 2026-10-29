import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal, { Field, ReadOnlyField, inputClass } from "../shared/Modal";
import { completeTaskWithDelivery, postponeTask } from "../../../services/schemaApi";
import Select from "../shared/Select";
import { requestCountsRefresh } from "../../../utils/sidebarCounts";

/**
 * "Update" pop-up for a pending task.
 * Complete -> task moves to Completed Tasks and to Assign Tester (needs system link / id / pass).
 * Pending  -> new expected delivery date + remarks, task stays in Pending.
 */
export default function TaskUpdateModal({ task, userId, userName, onClose, onSaved }) {
  const [status, setStatus] = useState("");
  const [systemLink, setSystemLink] = useState(task.linkOfSystem || "");
  const [githubLink, setGithubLink] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!status) return setError("Select a status.");
    if (status === "Complete") {
      if (!systemLink.trim()) return setError("System Link is required.");
      if (!loginId.trim()) return setError("Id is required.");
      if (!password.trim()) return setError("Pass is required.");
    } else {
      if (!expectedDate) return setError("Expected Delivery Date is required.");
      if (!remarks.trim()) return setError("Remarks are required.");
    }

    setSaving(true);
    try {
      if (status === "Complete") {
        await completeTaskWithDelivery({
          task,
          systemLink: systemLink.trim(),
          githubLink: githubLink.trim(),
          loginId: loginId.trim(),
          password: password.trim(),
          remarks: remarks.trim(),
          madeByUserId: userId,
          madeByName: userName,
        });
        // only a completed task leaves Pending (and joins Assign Tester); a postponed one stays counted
        requestCountsRefresh({ "pending-tasks": -1, "assign-tester": 1 });
      } else {
        await postponeTask({
          taskId: task.id,
          expectedDate,
          remarks: remarks.trim(),
        });
      }
      await onSaved();
    } catch (e) {
      setError(e.message || "Update failed");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Task Update"
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      {task.isRejected && (
        <div className="sm:col-span-2 p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Task Rejected from {task.rejectType || "Testing"}
              </div>
              {task.rejectedReason && (
                <div className="text-sm font-medium text-rose-950 mt-1">
                  <span className="font-semibold text-rose-900">Reason:</span> {task.rejectedReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ReadOnlyField label="Task No" value={task.taskNo} />
      <ReadOnlyField label="Company Name" value={task.partyName} />
      <ReadOnlyField label="System Name" value={task.systemName} />
      <Field full label="Task Description">
        <textarea
          className={inputClass}
          rows={2}
          value={task.descriptionOfWork || ""}
          disabled
          readOnly
        />
      </Field>
      <ReadOnlyField label="Given Date" value={task.givenDate} />
      <ReadOnlyField label="Expected Date" value={task.expectedDateToClose} />

      <Field label="Status" required>
        <Select
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Select</option>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
        </Select>
      </Field>

      {status === "Complete" && (
        <>
          <Field full label="System Link" required>
            <input
              className={inputClass}
              value={systemLink}
              onChange={(e) => setSystemLink(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field full label="GitHub Link">
            <input
              className={inputClass}
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>
          {/* These are the delivered system's credentials, not the maker's own login:
              keep browsers / password managers from auto-filling saved logins here. */}
          <Field label="Id" required>
            <input
              className={inputClass}
              name="delivered-system-id"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </Field>
          <Field label="Pass" required>
            <input
              className={inputClass}
              name="delivered-system-pass"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field full label="Remarks">
            <textarea
              className={inputClass}
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Field>
        </>
      )}

      {status === "Pending" && (
        <>
          <Field label="Expected Delivery Date" required>
            <input
              type="date"
              className={inputClass}
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </Field>
          <Field full label="Remarks" required>
            <textarea
              className={inputClass}
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Field>
        </>
      )}

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}
