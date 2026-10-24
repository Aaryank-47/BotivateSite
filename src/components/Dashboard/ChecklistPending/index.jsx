"use client";

import { publishCount } from "../../../utils/sidebarCounts";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  ListChecks,
  UserPlus,
  Phone,
  AlertTriangle,
  Paperclip,
  Upload,
} from "lucide-react";
import {
  fetchChecklistTasks,
  updateChecklistTask,
  fetchWeeklyCalls,
  updateWeeklyCall,
} from "../../../services/schemaApi";
import { useDelegationTasks } from "../DelegationTasks";
import DataTable from "../shared/DataTable";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (s === "issue") return "bg-rose-50 text-rose-700 ring-rose-200/70";
  if (s === "in progress")
    return "bg-sky-50 text-sky-700 ring-sky-200/70";
  return "bg-indigo-50 text-indigo-700 ring-indigo-200/70";
}

async function fileToDataUrl(file) {
  if (!file) return null;
  try {
    const reader = new FileReader();
    return await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(file.name || "attachment");
      reader.readAsDataURL(file);
    });
  } catch {
    return file.name || "attachment";
  }
}

/* ── Checklist Update Modal ─────────────────────────────────────────────── */
function ChecklistUpdateModal({ task, onClose, onDone }) {
  const isCompleted =
    String(task?.status || "").toLowerCase() === "completed";
  const [status, setStatus] = useState(isCompleted ? "Completed" : "Pending");
  const [remarks, setRemarks] = useState(task?.remarks || "");
  const [proofFile, setProofFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const proof_url = await fileToDataUrl(proofFile);
      await updateChecklistTask(task.id, {
        status,
        remarks,
        ...(proof_url ? { proof_url } : {}),
      });
      onDone?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isCompleted ? "Edit Completed Checklist" : "Update Checklist"}
            </h3>
            {isCompleted && (
              <p className="mt-0.5 text-xs text-slate-500">
                Update remarks or attach files — status can still be changed
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">
              {task.task_name || "Task"}
            </span>
            {task.name ? ` · ${task.name}` : ""}
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Pending", "Completed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    status === s
                      ? s === "Completed"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                isCompleted
                  ? "Add or update notes…"
                  : "Optional notes…"
              }
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Paperclip className="h-3.5 w-3.5 text-slate-400" />
              Attachment (audio / file) — optional
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-emerald-300 hover:bg-emerald-50/40">
              <Upload className="mb-2 h-6 w-6 text-slate-400" />
              <span className="text-xs text-slate-500">
                {proofFile
                  ? proofFile.name
                  : isCompleted
                    ? "Attach late audio / file (optional)"
                    : "Click to attach audio or file (optional)"}
              </span>
              <input
                type="file"
                accept="audio/*,image/*,.mp3,.wav,.m4a,.ogg,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Saving…" : isCompleted ? "Save changes" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ── Weekly Call Update Modal ───────────────────────────────────────────── */
function WeeklyUpdateModal({ task, onClose, onDone, onEscalate }) {
  const isCompleted =
    String(task?.status || "").toLowerCase() === "completed";
  const [hasIssue, setHasIssue] = useState(
    isCompleted ? false : task?.has_issue === true ? true : null
  );
  const [customerSaid, setCustomerSaid] = useState(
    task?.customer_said || ""
  );
  const [remarks, setRemarks] = useState(task?.remarks || "");
  const [proofFile, setProofFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const handleSave = async () => {
    // Completed edit mode: allow saving notes/audio without forcing issue choice
    if (!isCompleted && hasIssue === null) {
      setError("Please select whether there is an issue");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const proof_url = await fileToDataUrl(proofFile);

      if (hasIssue === true) {
        await updateWeeklyCall(task.id, {
          has_issue: true,
          remarks: remarks || customerSaid,
          customer_said: customerSaid || remarks,
          proof_url: proof_url || null,
          status: "Issue",
        });
        onDone?.();
        onClose();
        onEscalate?.(task);
        return;
      }

      await updateWeeklyCall(task.id, {
        has_issue: false,
        customer_said: customerSaid,
        remarks: remarks || customerSaid,
        proof_url: proof_url || null,
        status: isCompleted || hasIssue === false ? "Completed" : "Pending",
      });
      onDone?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isCompleted ? "Edit Completed Weekly Call" : "Update Weekly Call"}
            </h3>
            {isCompleted && (
              <p className="mt-0.5 text-xs text-slate-500">
                Update notes or attach proof — you can reopen if needed
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">
              {task.party_name || "Party"}
            </span>
            {task.calling_person_name
              ? ` · ${task.calling_person_name}`
              : ""}
          </p>

          {/* Pending: force issue choice. Completed: secondary "reopen / escalate" */}
          {!isCompleted ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Have any issue? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: false, label: "No" },
                  { v: true, label: "Yes" },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => {
                      setHasIssue(opt.v);
                      setError("");
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      hasIssue === opt.v
                        ? opt.v
                          ? "border-rose-400 bg-rose-50 text-rose-700"
                          : "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {hasIssue === true && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  After saving you will be taken to Assign Task to create a follow-up.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reopen / escalate?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: false, label: "Keep completed" },
                  { v: true, label: "Yes — escalate" },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => {
                      setHasIssue(opt.v);
                      setError("");
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      hasIssue === opt.v
                        ? opt.v
                          ? "border-rose-400 bg-rose-50 text-rose-700"
                          : "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {hasIssue === true && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Will mark as Issue and open Assign Task for follow-up.
                </p>
              )}
            </div>
          )}

          {(hasIssue === true || (isCompleted && hasIssue !== true)) && (
            <>
              {hasIssue === true ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Describe the issue…"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    What did customer say?
                  </label>
                  <textarea
                    rows={3}
                    value={customerSaid}
                    onChange={(e) => setCustomerSaid(e.target.value)}
                    placeholder="Summary of the conversation…"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  Proof of call (audio)
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-violet-300 hover:bg-violet-50/40">
                  <Upload className="mb-2 h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-500">
                    {proofFile
                      ? proofFile.name
                      : isCompleted
                        ? "Attach late audio (optional)"
                        : "Click to attach voice call audio"}
                  </span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    className="hidden"
                    onChange={(e) =>
                      setProofFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional — you can save without attaching audio
                </p>
              </div>
            </>
          )}

          {/* Pending + No: customer said + audio (same as before) */}
          {!isCompleted && hasIssue === false && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  What did customer say?
                </label>
                <textarea
                  rows={3}
                  value={customerSaid}
                  onChange={(e) => setCustomerSaid(e.target.value)}
                  placeholder="Summary of the conversation…"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  Proof of call (audio)
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-violet-300 hover:bg-violet-50/40">
                  <Upload className="mb-2 h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-500">
                    {proofFile
                      ? proofFile.name
                      : "Click to attach voice call audio"}
                  </span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    className="hidden"
                    onChange={(e) =>
                      setProofFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional — you can save without attaching audio
                </p>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving
              ? "Saving…"
              : hasIssue
                ? "Save & Open Assign Task"
                : isCompleted
                  ? "Save changes"
                  : "Save"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ── Status sub-tabs (Pending / Completed) ──────────────────────────────── */
function StatusSubTabs({ tab, setTab, pendingCount, completedCount }) {
  return (
    <div className="flex flex-shrink-0 gap-2">
      <button
        type="button"
        onClick={() => setTab("pending")}
        className={`flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
          tab === "pending"
            ? "bg-indigo-600 text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        Pending ({pendingCount})
      </button>
      <button
        type="button"
        onClick={() => setTab("completed")}
        className={`flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
          tab === "completed"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        Completed ({completedCount})
      </button>
    </div>
  );
}

/* ── Checklist table panel ──────────────────────────────────────────────── */
const CHECKLIST_HEADERS = [
  "Action",
  "Task",
  "Doer",
  "Category",
  "Type",
  "Days",
  "Status",
  "Created",
];

function useChecklistPanel({ userRole, user, userFilterData }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("pending");
  const [updateItem, setUpdateItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchChecklistTasks();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () =>
      rows.filter(
        (r) => String(r.status || "").toLowerCase() !== "completed"
      ),
    [rows]
  );
  useEffect(() => {
    publishCount("checklist-pending:checklist", pending.length);
  }, [pending.length]);

  const completed = useMemo(
    () =>
      rows.filter(
        (r) => String(r.status || "").toLowerCase() === "completed"
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    const base = statusTab === "completed" ? completed : pending;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        String(r.task_name || "").toLowerCase().includes(q) ||
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.task_type || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
    );
  }, [statusTab, pending, completed, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const renderRow = (r) => (
    <tr
      key={r.id}
      className="hover:bg-slate-50/60 transition"
    >
      <td className="px-4 py-3 text-center align-middle">
        <button
          type="button"
          onClick={() => setUpdateItem(r)}
          className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          Update
        </button>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="font-medium text-slate-800">
          {r.task_name || "—"}
        </div>
        {r.description && (
          <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">
            {r.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center text-slate-700 align-middle">{r.name || "—"}</td>
      <td className="px-4 py-3 text-center capitalize text-slate-600 align-middle">
        {r.task_category || "—"}
      </td>
      <td className="px-4 py-3 text-center text-slate-600 align-middle">
        {r.task_type || "—"}
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex flex-wrap justify-center gap-1">
          {(r.days || []).map((d) => (
            <span
              key={d}
              className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              {String(d).slice(0, 3)}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle(
            r.status
          )}`}
        >
          {r.status || "Pending"}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-slate-500 align-middle">
        {formatDate(r.created_at)}
      </td>
    </tr>
  );

  const renderCard = (r) => (
    <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {r.task_name || "—"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{r.task_type || "—"} · {r.task_category || "—"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusStyle(r.status)}`}>
            {r.status || "Pending"}
          </span>
          <button
            type="button"
            onClick={() => setUpdateItem(r)}
            className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Update
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
          <span className="font-semibold text-gray-900">{r.description || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Doer</span>
          <span className="font-semibold text-gray-900">{r.name || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Created</span>
          <span className="font-semibold text-gray-900">{formatDate(r.created_at)}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Days</span>
          <div className="flex flex-wrap gap-1">
            {(r.days || []).map((d) => (
              <span key={d} className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                {String(d).slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const header = (
    <>
      <StatusSubTabs
        tab={statusTab}
        setTab={setStatusTab}
        pendingCount={pending.length}
        completedCount={completed.length}
      />
      <div className="relative min-w-[120px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search checklist…"
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <button
        type="button"
        onClick={load}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </>
  );

  const body = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading…</div>
        ) : (
          <DataTable
            headers={CHECKLIST_HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[720px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={filtered.length}
          />
        )}
      </div>

      {updateItem && (
        <ChecklistUpdateModal
          task={updateItem}
          onClose={() => setUpdateItem(null)}
          onDone={load}
        />
      )}
    </div>
  );

  return { header, body };
}

/* ── Weekly calls table panel ───────────────────────────────────────────── */
const WEEKLY_HEADERS = [
  "Action",
  "Party",
  "Responsible",
  "Phone",
  "Caller",
  "Days",
  "Status",
  "Created",
];

function useWeeklyPanel({
  userRole,
  user,
  userFilterData,
  companyData,
  onEscalate,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("pending");
  const [updateItem, setUpdateItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklyCalls();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () =>
      rows.filter(
        (r) => String(r.status || "").toLowerCase() !== "completed"
      ),
    [rows]
  );
  useEffect(() => {
    publishCount("checklist-pending:weekly", pending.length);
  }, [pending.length]);

  const completed = useMemo(
    () =>
      rows.filter(
        (r) => String(r.status || "").toLowerCase() === "completed"
      ),
    [rows]
  );

  const filtered = useMemo(() => {
    const base = statusTab === "completed" ? completed : pending;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) =>
        String(r.party_name || "").toLowerCase().includes(q) ||
        String(r.calling_person_name || "").toLowerCase().includes(q) ||
        String(r.responsible_person || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
    );
  }, [statusTab, pending, completed, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const renderRow = (r) => (
    <tr
      key={r.id}
      className="hover:bg-slate-50/60 transition"
    >
      <td className="px-4 py-3 text-center align-middle">
        <button
          type="button"
          onClick={() => setUpdateItem(r)}
          className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
        >
          Update
        </button>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="font-medium text-slate-800">
          {r.party_name || "—"}
        </div>
        {r.task_description && (
          <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">
            {r.task_description}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center text-slate-700 align-middle">
        {r.responsible_person || "—"}
      </td>
      <td className="px-4 py-3 text-center text-slate-600 align-middle">
        {r.responsible_phone || "—"}
      </td>
      <td className="px-4 py-3 text-center text-slate-700 align-middle">
        {r.calling_person_name || "—"}
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex flex-wrap justify-center gap-1">
          {(r.calling_days || []).map((d) => (
            <span
              key={d}
              className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700"
            >
              {String(d).slice(0, 3)}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle(
            r.status
          )}`}
        >
          {r.status || "Pending"}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-slate-500 align-middle">
        {formatDate(r.created_at)}
      </td>
    </tr>
  );

  const renderCard = (r) => (
    <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {r.party_name || "—"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{r.calling_person_name || "—"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusStyle(r.status)}`}>
            {r.status || "Pending"}
          </span>
          <button
            type="button"
            onClick={() => setUpdateItem(r)}
            className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
          >
            Update
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
          <span className="font-semibold text-gray-900">{r.task_description || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Responsible</span>
          <span className="font-semibold text-gray-900">{r.responsible_person || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</span>
          <span className="font-semibold text-gray-900">{r.responsible_phone || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Created</span>
          <span className="font-semibold text-gray-900">{formatDate(r.created_at)}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Days</span>
          <div className="flex flex-wrap gap-1">
            {(r.calling_days || []).map((d) => (
              <span key={d} className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                {String(d).slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const header = (
    <>
      <StatusSubTabs
        tab={statusTab}
        setTab={setStatusTab}
        pendingCount={pending.length}
        completedCount={completed.length}
      />
      <div className="relative min-w-[120px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search weekly calls…"
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </div>
      <button
        type="button"
        onClick={load}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </>
  );

  const body = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading…</div>
        ) : (
          <DataTable
            headers={WEEKLY_HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[800px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={filtered.length}
          />
        )}
      </div>

      {updateItem && (
        <WeeklyUpdateModal
          task={updateItem}
          onClose={() => setUpdateItem(null)}
          onDone={load}
          onEscalate={onEscalate}
        />
      )}
    </div>
  );

  return { header, body };
}

/* ── Main Pending shell ─────────────────────────────────────────────────── */
const TABS = [
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "delegation", label: "Delegation", icon: UserPlus },
  { id: "weekly-calls", label: "Weekly Calls", icon: Phone },
];

export default function ChecklistPending({
  userRole,
  user,
  userFilterData,
  companyData,
  setActiveTab,
}) {
  const [tab, setTab] = useState("checklist");

  // Escalate to Assign Task (Tasks sidebar), NOT Weekly Calls form
  const handleEscalate = () => {
    setActiveTab?.("assign-task");
  };

  // Both panels' data hooks run unconditionally (Rules of Hooks) — this also
  // means both checklist and weekly-calls data preload in the background
  // regardless of which sub-tab is active, so switching tabs is instant.
  const checklist = useChecklistPanel({ userRole, user, userFilterData });
  const weekly = useWeeklyPanel({
    userRole,
    user,
    userFilterData,
    companyData,
    onEscalate: handleEscalate,
  });
  const delegation = useDelegationTasks({ userRole, user, userFilterData });

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Tabs + the active sub-tab's status pills / search / refresh — all in one row */}
      <div className="mb-4 flex flex-nowrap items-center gap-3 overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex flex-shrink-0 gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
        {tab === "checklist" && checklist.header}
        {tab === "delegation" && delegation.header}
        {tab === "weekly-calls" && weekly.header}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-h-0 flex flex-col"
        >
          {tab === "checklist" && checklist.body}
          {tab === "delegation" && delegation.body}
          {tab === "weekly-calls" && weekly.body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
