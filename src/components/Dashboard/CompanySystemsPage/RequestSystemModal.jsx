import { useState } from "react";
import Modal, { Field, inputClass } from "../shared/Modal";
import { createSystemRequest, uploadAttachment } from "../../../services/schemaApi";

/**
 * Company login: "Request for new system".
 * Files a request that the superadmin approves in Order System → System Approvals.
 * Once approved, the system joins this company's systems list.
 */
export default function RequestSystemModal({ companyData, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    expectedDate: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setError("");
    if (!form.name.trim()) return setError("System name is required.");
    if (!form.description.trim()) return setError("Please describe what the system should do.");
    if (!companyData?.companyId) return setError("Company account not found. Please log in again.");

    setSaving(true);
    try {
      const attachmentUrl = file ? await uploadAttachment(file) : null;
      await createSystemRequest({
        companyId: companyData.companyId,
        name: form.name,
        description: form.description,
        neededBy: form.expectedDate || null,
        attachmentUrl,
        attachmentName: file?.name || null,
        requestedBy: companyData.userId || companyData.companyId,
      });
      onSaved(`Request for “${form.name.trim()}” sent.`);
    } catch (e) {
      setError(e?.message || "Could not send the request.");
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Request for new system"
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
            {saving ? "Sending…" : "Send request"}
          </button>
        </>
      }
    >
      <Field label="System name" required>
        <input className={inputClass} value={form.name} onChange={set("name")} placeholder="e.g. Fleet Tracking System" />
      </Field>
      <Field label="Expected Requirement Date">
        <input type="date" className={inputClass} value={form.expectedDate} onChange={set("expectedDate")} />
      </Field>
      <Field full label="What should the system do?" required>
        <textarea
          className={inputClass}
          rows={3}
          value={form.description}
          onChange={set("description")}
          placeholder="Describe the requirement"
        />
      </Field>
      <Field full label="Attachment (optional)">
        <input
          type="file"
          className={`${inputClass} file:mr-3 file:px-3 file:py-1 file:text-xs file:font-medium file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700`}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Field>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </Modal>
  );
}
