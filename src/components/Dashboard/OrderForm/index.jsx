"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  PackagePlus,
  CheckCircle2,
  Upload,
  X,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createOrder,
  uploadAttachment,
  createSystemsForParty,
  fetchCompanies,
  fetchAllUsersForAdmin,
} from "../../../services/schemaApi";
import Select from "../shared/Select";
import { readQuotation } from "../../../utils/quotationParser";

const MAX_INLINE_BYTES = 1.5 * 1024 * 1024;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/** Upload to storage; if that fails (bucket missing / policy), keep small files inline so the link still works. */
async function storeFile(file, failed) {
  try {
    return await uploadAttachment(file);
  } catch (err) {
    console.warn("Attachment upload failed:", err?.message || err);
    if (file.size <= MAX_INLINE_BYTES) {
      try {
        return await fileToDataUrl(file);
      } catch {
        /* fall through */
      }
    }
    failed.push(file.name);
    return null;
  }
}

const FIELD_LABELS = {
  party_name: "Party name",
  quotation_number: "Quotation number",
  start_date: "Start date",
  value_of_order: "Value of order",
  payment_type: "Payment type",
  type_of_work: "Type of work",
  systems: "Systems table",
};

const emptySystem = () => ({ department: "", name: "", description: "" });

const empty = {
  party_name: "",
  type_of_work: "Project",
  start_date: "",
  end_date: "",
  value_of_order: "",
  payment_type: "Partly",
  nda_required: "no",
  quotation_number: "",
  remarks: "",
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25";
const labelCls = "mb-1 block text-sm font-medium text-slate-700";

function FilePick({ label, file, onPick, onClear, accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg" }) {
  const ref = useRef(null);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {file ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
            {file.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
        >
          <Upload className="h-4 w-4" />
          Click to upload
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function OrderForm({ user, setActiveTab, modal = false, onClose, onCreated }) {
  const [form, setForm] = useState(empty);
  const [ndaFile, setNdaFile] = useState(null);
  const [quotationFile, setQuotationFile] = useState(null);
  const [systemRows, setSystemRows] = useState([emptySystem()]);
  const [autofill, setAutofill] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const next = {};
    if (!form.party_name.trim()) next.party_name = "Required";
    if (!form.type_of_work) next.type_of_work = "Required";
    if (!form.start_date) next.start_date = "Required";
    if (!form.end_date) next.end_date = "Required";
    if (form.value_of_order === "" || form.value_of_order == null)
      next.value_of_order = "Required";
    if (!form.payment_type) next.payment_type = "Required";
    if (form.nda_required === "yes" && !ndaFile)
      next.nda_file = "NDA attachment required when NDA is Yes";
    if (!form.quotation_number.trim()) next.quotation_number = "Required";
    const hasUser = login.username.trim();
    const hasPass = login.password.trim();
    if (hasUser && !hasPass) next.customer_password = "Password required";
    if (hasPass && !hasUser) next.customer_username = "Customer ID required";
    if (quotationFile && systemRows.some((r) => (r.department.trim() || r.description.trim()) && !r.name.trim()))
      next.systems = "Enter a System Name for every row that has details";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Quotation uploaded: read it and pre-fill the form (user reviews before submitting). */
  const handleQuotationPick = async (file) => {
    setQuotationFile(file);
    setAutofill({ state: "reading" });
    try {
      const { fields, systems, filled } = await readQuotation(file);
      setForm((f) => ({ ...f, ...fields }));
      if (systems.length) setSystemRows(systems);
      setFieldErrors({});
      setAutofill({ state: filled.length ? "done" : "empty", filled });
    } catch (err) {
      setAutofill({ state: "error", message: err?.message || "Could not read this quotation." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (!validate()) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (login.username.trim()) {
        const party = form.party_name.trim().toLowerCase();
        const companies = await fetchCompanies();
        const partyExists = companies.some(
          (c) => (c.name || "").toLowerCase() === party || (c.company_name || "").toLowerCase() === party
        );
        if (!partyExists) {
          const users = await fetchAllUsersForAdmin();
          if (users.some((u) => String(u.username).toLowerCase() === login.username.trim().toLowerCase())) {
            setFieldErrors({ customer_username: "This Customer ID is already taken" });
            setError("Please choose a different Customer ID.");
            setSaving(false);
            return;
          }
        }
      }
      let nda_attachment_url = null;
      let quotation_attachment_url = null;
      const failed = [];
      if (ndaFile) nda_attachment_url = await storeFile(ndaFile, failed);
      if (quotationFile) quotation_attachment_url = await storeFile(quotationFile, failed);
      if (failed.length) {
        alert(
          `Order saved, but these files could not be uploaded (too large to store without the storage bucket): ${failed.join(", ")}`
        );
      }

      await createOrder({
        party_name: form.party_name.trim(),
        type_of_work: form.type_of_work,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        value_of_order: form.value_of_order,
        payment_type: form.payment_type,
        nda_required: form.nda_required === "yes",
        nda_attachment_url,
        quotation_number: form.quotation_number.trim(),
        quotation_attachment_url,
        remarks: form.remarks || null,
        created_by: user?.id || user?.userId || null,
      });
      const systemsToSave = quotationFile ? systemRows.filter((r) => r.name.trim()) : [];
      const wantsLogin = !!login.username.trim();
      if (systemsToSave.length || wantsLogin) {
        try {
          const res = await createSystemsForParty(
            form.party_name,
            systemsToSave,
            wantsLogin ? { username: login.username.trim(), password: login.password.trim() } : null
          );
          if (res.created) {
            alert(
              `Customer "${form.party_name.trim()}" registered${res.saved ? ` with ${res.saved} system(s)` : ""}.\nLogin: ${res.created.username} / ${res.created.password}\nVisible in User Access.`
            );
          } else if (wantsLogin) {
            alert(`"${form.party_name.trim()}" already has a customer account, so the new login was not created.`);
          }
        } catch (e) {
          alert("Order saved, but the customer account / systems could not be added: " + (e?.message || e));
        }
      }
      setLogin({ username: "", password: "" });
      setDone(true);
      setSystemRows([emptySystem()]);
      setAutofill(null);
      setForm(empty);
      setNdaFile(null);
      setQuotationFile(null);
      setFieldErrors({});
      if (modal) onCreated?.();
      else setTimeout(() => setActiveTab?.("order-list"), 700);
    } catch (err) {
      setError(err?.message || "Failed to submit order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={modal ? "w-full" : "w-full pb-10"}>
      {!modal && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-6 w-full max-w-2xl"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-200/40">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Order Form
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Submit a new order — it appears in Order List after save
            </p>
          </div>
        </div>
      </motion.div>
      )}

      <form
        onSubmit={handleSubmit}
        className={
          modal
            ? "grid w-full grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2"
            : "mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        }
      >
        <div className={modal ? "sm:col-span-2" : ""}>
          <label className={labelCls}>
            Party name <span className="text-red-500">*</span>
          </label>
          <input
            className={`${inputCls} ${fieldErrors.party_name ? "border-red-300" : ""}`}
            value={form.party_name}
            onChange={set("party_name")}
            placeholder="e.g. RMA Traders"
          />
          {fieldErrors.party_name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.party_name}</p>
          )}
        </div>

        <div className={modal ? "contents" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
          <div>
            <label className={labelCls}>
              Type of work <span className="text-red-500">*</span>
            </label>
            <Select
              className={inputCls}
              value={form.type_of_work}
              onChange={set("type_of_work")}
            >
              <option value="Project">Project</option>
              <option value="Service">Service</option>
            </Select>
          </div>
          <div>
            <label className={labelCls}>
              Payment type <span className="text-red-500">*</span>
            </label>
            <Select
              className={inputCls}
              value={form.payment_type}
              onChange={set("payment_type")}
            >
              <option value="Partly">Partly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </Select>
          </div>
        </div>

        <div className={modal ? "contents" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
          <div>
            <label className={labelCls}>
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`${inputCls} ${fieldErrors.start_date ? "border-red-300" : ""}`}
              value={form.start_date}
              onChange={set("start_date")}
            />
            {fieldErrors.start_date && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.start_date}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>
              End date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`${inputCls} ${fieldErrors.end_date ? "border-red-300" : ""}`}
              value={form.end_date}
              onChange={set("end_date")}
            />
            {fieldErrors.end_date && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.end_date}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Value of order <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={`${inputCls} ${fieldErrors.value_of_order ? "border-red-300" : ""}`}
            value={form.value_of_order}
            onChange={set("value_of_order")}
            placeholder="e.g. 250000"
          />
          {fieldErrors.value_of_order && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.value_of_order}</p>
          )}
        </div>

        <div>
          <label className={labelCls}>
            NDA required <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {["yes", "no"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, nda_required: opt }));
                  if (opt === "no") {
                    setNdaFile(null);
                    setFieldErrors((fe) => {
                      const n = { ...fe };
                      delete n.nda_file;
                      return n;
                    });
                  }
                }}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition ${
                  form.nda_required === opt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {form.nda_required === "yes" && (
          <div className={modal ? "sm:col-span-2" : ""}>
            <FilePick
              label={
                <>
                  NDA attachment <span className="text-red-500">*</span>
                </>
              }
              file={ndaFile}
              onPick={setNdaFile}
              onClear={() => setNdaFile(null)}
            />
            {fieldErrors.nda_file && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.nda_file}</p>
            )}
          </div>
        )}

        <div>
          <label className={labelCls}>
            Quotation number <span className="text-red-500">*</span>
          </label>
          <input
            className={`${inputCls} ${fieldErrors.quotation_number ? "border-red-300" : ""}`}
            value={form.quotation_number}
            onChange={set("quotation_number")}
            placeholder="e.g. QT-2026-0142"
          />
          {fieldErrors.quotation_number && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.quotation_number}</p>
          )}
        </div>

        <FilePick
          label="Quotation attachment"
          file={quotationFile}
          onPick={handleQuotationPick}
          onClear={() => {
            setQuotationFile(null);
            setAutofill(null);
          }}
        />

        {autofill && (
          <div
            className={`rounded-xl border px-4 py-2 text-sm ${modal ? "sm:col-span-2" : ""} ${
              autofill.state === "error" || autofill.state === "empty"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-indigo-200 bg-indigo-50 text-indigo-800"
            }`}
          >
            {autofill.state === "reading" && "Reading quotation…"}
            {autofill.state === "done" &&
              `Pre-filled from the quotation: ${autofill.filled.map((k) => FIELD_LABELS[k] || k).join(", ")}. Please review before submitting.`}
            {autofill.state === "empty" && "Could not find any order details in this quotation. Please fill the form manually."}
            {autofill.state === "error" && autofill.message}
          </div>
        )}

        {quotationFile && (
          <div className={modal ? "sm:col-span-2" : ""}>
            <div className="mb-1 flex items-center justify-between">
              <label className={labelCls + " mb-0"}>Systems in this quotation</label>
              <button
                type="button"
                onClick={() => setSystemRows((rows) => [...rows, emptySystem()])}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-16 px-3 py-2 text-center">Serial No</th>
                    <th className="px-3 py-2 text-left">Department Name</th>
                    <th className="px-3 py-2 text-left">System Name</th>
                    <th className="px-3 py-2 text-left">Description of System</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {systemRows.map((row, i) => {
                    const setField = (key) => (e) =>
                      setSystemRows((rows) =>
                        rows.map((r, idx) => (idx === i ? { ...r, [key]: e.target.value } : r))
                      );
                    const cell =
                      "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
                    return (
                      <tr key={i}>
                        <td className="px-3 py-1.5 text-center font-mono text-xs font-semibold text-indigo-600">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={cell} value={row.department} onChange={setField("department")} placeholder="e.g. Sales" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={cell} value={row.name} onChange={setField("name")} placeholder="System name" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={cell} value={row.description} onChange={setField("description")} placeholder="What does it do?" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={systemRows.length === 1}
                            onClick={() => setSystemRows((rows) => rows.filter((_, idx) => idx !== i))}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fieldErrors.systems && <p className="mt-1 text-xs text-red-600">{fieldErrors.systems}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Saved under the party's company — they appear in Order List → click the party name.
            </p>
          </div>
        )}

        <div className={`rounded-xl border border-slate-200 bg-slate-50/60 p-3 ${modal ? "sm:col-span-2" : ""}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Customer ID {login.password.trim() && <span className="text-red-500">*</span>}</label>
              <input
                className={`${inputCls} ${fieldErrors.customer_username ? "border-red-300" : ""}`}
                value={login.username}
                onChange={(e) => setLogin((l) => ({ ...l, username: e.target.value }))}
                placeholder="e.g. shreeram"
                autoComplete="off"
              />
              {fieldErrors.customer_username && <p className="mt-1 text-xs text-red-600">{fieldErrors.customer_username}</p>}
            </div>
            <div>
              <label className={labelCls}>Password {login.username.trim() && <span className="text-red-500">*</span>}</label>
              <input
                className={`${inputCls} ${fieldErrors.customer_password ? "border-red-300" : ""}`}
                value={login.password}
                onChange={(e) => setLogin((l) => ({ ...l, password: e.target.value }))}
                placeholder="e.g. shreeram@123"
                autoComplete="off"
              />
              {fieldErrors.customer_password && <p className="mt-1 text-xs text-red-600">{fieldErrors.customer_password}</p>}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Page access is fixed for customers (Dashboard, Assign Task, Pending Tasks). After saving, the login shows in User Access.
          </p>
        </div>

        <div className={modal ? "sm:col-span-2" : ""}>
          <label className={labelCls}>Remarks</label>
          <textarea
            rows={2}
            className={`${inputCls} resize-y min-h-[72px]`}
            value={form.remarks}
            onChange={set("remarks")}
            placeholder="Optional notes…"
          />
        </div>

        {error && (
          <div className={`rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 ${modal ? "sm:col-span-2" : ""}`}>
            {error}
          </div>
        )}
        {done && (
          <div className={`flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ${modal ? "sm:col-span-2" : ""}`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Order submitted — opening Order List…
          </div>
        )}

        <div className={`flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3 ${modal ? "sm:col-span-2" : ""}`}>
          {modal && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
          >
            <PackagePlus className="h-4 w-4" />
            {saving ? "Submitting…" : "Submit order"}
          </button>
        </div>
      </form>
    </div>
  );
}
