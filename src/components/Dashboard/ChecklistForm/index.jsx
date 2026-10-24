"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  User,
  FileText,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Layers,
  Tag,
} from "lucide-react";
import {
  fetchDelegationUsers,
  createChecklistTask,
} from "../../../services/schemaApi";
import Select from "../shared/Select";
import UserCombobox from "./UserCombobox";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function resolveCurrentUser(user, userFilterData, companyData) {
  let id =
    userFilterData?.userId ||
    userFilterData?.id ||
    companyData?.userId ||
    user?.id ||
    user?.userId ||
    null;
  let name =
    userFilterData?.name ||
    user?.username ||
    user?.name ||
    companyData?.companyName ||
    "";
  try {
    const raw =
      sessionStorage.getItem("userSession") || localStorage.getItem("userData");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!id) {
        id =
          parsed?.filterData?.userId ||
          parsed?.filterData?.id ||
          parsed?.companyData?.userId ||
          parsed?.userId ||
          parsed?.id ||
          null;
      }
      if (!name) {
        name =
          parsed?.filterData?.name ||
          parsed?.username ||
          parsed?.name ||
          parsed?.companyData?.companyName ||
          "";
      }
    }
  } catch {
    /* ignore */
  }
  return { id: id != null && id !== "" ? Number(id) : null, name };
}

export default function ChecklistForm({
  userRole = "admin",
  user,
  userFilterData,
  companyData,
}) {
  const current = resolveCurrentUser(user, userFilterData, companyData);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [name, setName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskCategory, setTaskCategory] = useState("single");
  const [taskType, setTaskType] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsers(true);
        const rows = await fetchDelegationUsers();
        if (!cancelled) setUsers(rows);
      } catch (e) {
        console.error(e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDay = (d) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setErrors((prev) => ({ ...prev, days: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Select or enter the doer name";
    if (!taskName.trim()) next.taskName = "Task name is required";
    if (!taskCategory) next.taskCategory = "Select category";
    if (!taskType) next.taskType = "Select task type";
    if (!description.trim()) next.description = "Description is required";
    if (!days.length) next.days = "Select at least one day";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!validate()) return;
    if (!current.id) {
      setErrors({ form: "Could not identify logged-in user. Please re-login." });
      return;
    }
    setSubmitting(true);
    try {
      await createChecklistTask({
        assigned_by: current.id,
        assigned_by_name: current.name,
        name: name.trim(),
        task_name: taskName.trim(),
        task_category: taskCategory,
        task_type: taskType,
        description: description.trim(),
        days,
      });
      setSuccessMsg("Checklist task assigned successfully.");
      setName("");
      setTaskName("");
      setTaskCategory("single");
      setTaskType("");
      setDescription("");
      setDays([]);
      setErrors({});
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrors({ form: err?.message || "Failed to create checklist task." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[50vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Checklist Form
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Assign a recurring checklist task to a team member
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
              New checklist task
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Assigned by — prefilled disabled */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Assigned by
              </label>
              <input
                type="text"
                value={current.name || "Logged-in user"}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600"
              />
            </div>

            {/* Name — doer */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Name (doer) <span className="text-red-500">*</span>
              </label>
              <UserCombobox
                value={name}
                onChange={(val) => {
                  setName(val);
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
                users={users}
                loading={loadingUsers}
                error={Boolean(errors.name)}
                placeholder="Select or type name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Task name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Task name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => {
                  setTaskName(e.target.value);
                  setErrors((p) => ({ ...p, taskName: undefined }));
                }}
                placeholder="e.g. Daily client follow-up"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/40 ${
                  errors.taskName
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.taskName && (
                <p className="mt-1 text-xs text-red-500">{errors.taskName}</p>
              )}
            </div>

            {/* Task Category */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Task Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["single", "group"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setTaskCategory(cat);
                      setErrors((p) => ({ ...p, taskCategory: undefined }));
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                      taskCategory === cat
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.taskCategory && (
                <p className="mt-1 text-xs text-red-500">{errors.taskCategory}</p>
              )}
            </div>

            {/* Task Type */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                Task Type <span className="text-red-500">*</span>
              </label>
              <Select
                accent="emerald"
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  setErrors((p) => ({ ...p, taskType: undefined }));
                }}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/40 ${
                  errors.taskType
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <option value="">Select type</option>
                <option value="Customer">Customer</option>
                <option value="Botivate Operational">Botivate Operational</option>
              </Select>
              {errors.taskType && (
                <p className="mt-1 text-xs text-red-500">{errors.taskType}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((p) => ({ ...p, description: undefined }));
                }}
                placeholder="Describe the checklist steps…"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/40 ${
                  errors.description
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Days multi-select */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Day(s) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const on = days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              {errors.days && (
                <p className="mt-1 text-xs text-red-500">{errors.days}</p>
              )}
            </div>

            {errors.form && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.form}
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
          </div>

          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200/60 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Assigning…" : "Assign Checklist"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
