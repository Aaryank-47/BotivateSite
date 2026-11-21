import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal, { Field, ReadOnlyField, inputClass } from "../shared/Modal";
import { completeTaskWithDelivery, completeTaskSimple, postponeTask, ORDER_SYSTEM_WORK_TYPES } from "../../../services/schemaApi";
import Select from "../shared/Select";
import supabase from "../../../supabaseClient";
import { requestCountsRefresh } from "../../../utils/sidebarCounts";

/**
 * "Update" pop-up for a pending task.
 * Complete -> task moves to Completed Tasks and to Assign Tester (needs system link / id / pass).
 * Pending  -> new expected delivery date + remarks, task stays in Pending.
 */
export default function TaskUpdateModal({ task, userId, userName, onClose, onSaved }) {
  const typeOfWork = task.typeOfWork || task.type_of_work || "";
  const isSystemType = ORDER_SYSTEM_WORK_TYPES.includes(typeOfWork);
  const isNewSystem = /new\s*system/i.test(typeOfWork);
  const isExistingSystem = /existing\s*system/i.test(typeOfWork);
  const [status, setStatus] = useState("");
  const [systemLink, setSystemLink] = useState(task.linkOfSystem || "");
  const [githubLink, setGithubLink] = useState(task.githubLink || "");
  const [loginId, setLoginId] = useState(isExistingSystem ? (task.systemLoginId || "") : "");
  const [password, setPassword] = useState(isExistingSystem ? (task.systemPassword || "") : "");
  const [expectedDate, setExpectedDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // For Existing System: prefill from the latest task_testing record for this system so
  // the user doesn't retype link / github / id / pass that were saved on a prior delivery.
  useEffect(() => {
    if (!isExistingSystem) return;
    const systemId = task.systemId || task.system_id;
    if (!systemId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("task_testing")
        .select("system_link, github_link, system_login_id, system_password")
        .eq("system_id", systemId)
        .order("id", { ascending: false })
        .limit(1);
      if (cancelled || !data || data.length === 0) return;
      const r = data[0];
      setSystemLink((v) => v || r.system_link || "");
      setGithubLink((v) => v || r.github_link || "");
      setLoginId((v) => v || r.system_login_id || "");
      setPassword((v) => v || r.system_password || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [isExistingSystem, task.systemId, task.system_id]);

  const handleSave = async () => {
    setError("");
    if (!status) return setError("Select a status.");
    if (status === "Complete") {
      if (isSystemType || isNewSystem) {
        if (!systemLink.trim()) return setError("System Link is required.");
        if (!loginId.trim()) return setError("Id is required.");
        if (!password.trim()) return setError("Pass is required.");
      } else if (isExistingSystem) {
        if (!loginId.trim()) return setError("Id is required.");
        if (!password.trim()) return setError("Pass is required.");
      }
    } else {
      if (!expectedDate) return setError("Expected Delivery Date is required.");
      if (!remarks.trim()) return setError("Remarks are required.");
    }

    setSaving(true);
    try {
      if (status === "Complete") {
        if (isSystemType) {
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
          requestCountsRefresh({ "pending-tasks": -1, "assign-tester": 1 });
        } else if (isNewSystem || isExistingSystem) {
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
          requestCountsRefresh({ "pending-tasks": -1 });
        } else {
          await completeTaskSimple({
            taskId: task.id,
            remarks: remarks.trim(),
            madeByUserId: userId,
          });
          requestCountsRefresh({ "pending-tasks": -1 });
        }
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
          {(isSystemType || isNewSystem) && (
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
                  placeholder="Enter system login id"
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
                  placeholder="Enter system password"
                />
              </Field>
            </>
          )}
          {isExistingSystem && (
            <>
              <Field full label="System Link">
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
              <Field label="Id" required>
                <input
                  className={inputClass}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="System login id"
                />
              </Field>
              <Field label="Pass" required>
                <input
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="System password"
                />
              </Field>
            </>
          )}
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
