"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  User,
  Building2,
  FileText,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createWeeklyCall } from "../../../services/schemaApi";
import Select from "../shared/Select";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const COUNTRY_CODES = [
  { code: "+91", label: "IN +91" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+971", label: "UAE +971" },
  { code: "+65", label: "SG +65" },
  { code: "+61", label: "AU +61" },
];

function resolveCurrentUserId(user, userFilterData, companyData) {
  const fromProps =
    userFilterData?.userId ||
    userFilterData?.id ||
    companyData?.userId ||
    user?.id ||
    user?.userId ||
    null;
  if (fromProps != null && fromProps !== "") return Number(fromProps);
  try {
    const raw =
      sessionStorage.getItem("userSession") || localStorage.getItem("userData");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id =
        parsed?.filterData?.userId ||
        parsed?.filterData?.id ||
        parsed?.companyData?.userId ||
        parsed?.userId ||
        parsed?.id ||
        null;
      if (id != null && id !== "") return Number(id);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function WeeklyCallsForm({
  userRole = "admin",
  user,
  userFilterData,
  companyData,
  initialPartyName = "",
}) {
  const currentUserId = resolveCurrentUserId(user, userFilterData, companyData);
  const [partyName, setPartyName] = useState(initialPartyName || "");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [callingPersonName, setCallingPersonName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [callingDays, setCallingDays] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const toggleDay = (d) => {
    setCallingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setErrors((p) => ({ ...p, callingDays: undefined }));
  };

  const onPhoneChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 15);
    setPhone(digits);
    setErrors((p) => ({ ...p, phone: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!partyName.trim()) next.partyName = "Party name is required";
    if (!responsiblePerson.trim())
      next.responsiblePerson = "Responsible person is required";
    if (!phone.trim()) next.phone = "Phone number is required";
    else if (phone.length < 7) next.phone = "Enter a valid phone number";
    if (!callingPersonName.trim())
      next.callingPersonName = "Calling person name is required";
    if (!taskDescription.trim())
      next.taskDescription = "Task description is required";
    if (!callingDays.length) next.callingDays = "Select at least one day";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createWeeklyCall({
        party_name: partyName.trim(),
        responsible_person: responsiblePerson.trim(),
        responsible_phone: `${countryCode}${phone}`,
        calling_person_name: callingPersonName.trim(),
        task_description: taskDescription.trim(),
        calling_days: callingDays,
        assigned_by: currentUserId,
      });
      setSuccessMsg("Weekly call scheduled successfully.");
      setPartyName("");
      setResponsiblePerson("");
      setPhone("");
      setCallingPersonName("");
      setTaskDescription("");
      setCallingDays([]);
      setErrors({});
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrors({ form: err?.message || "Failed to create weekly call." });
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Weekly Calls Form
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Schedule recurring customer / partner calls
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">
              New weekly call
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                Party name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => {
                  setPartyName(e.target.value);
                  setErrors((p) => ({ ...p, partyName: undefined }));
                }}
                placeholder="Company / customer name"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                  errors.partyName
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.partyName && (
                <p className="mt-1 text-xs text-red-500">{errors.partyName}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Responsible person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={responsiblePerson}
                onChange={(e) => {
                  setResponsiblePerson(e.target.value);
                  setErrors((p) => ({ ...p, responsiblePerson: undefined }));
                }}
                placeholder="Contact person at party"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                  errors.responsiblePerson
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.responsiblePerson && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.responsiblePerson}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Responsible person phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="Phone number only"
                  className={`min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                    errors.phone
                      ? "border-red-300 ring-1 ring-red-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Calling person name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={callingPersonName}
                onChange={(e) => {
                  setCallingPersonName(e.target.value);
                  setErrors((p) => ({ ...p, callingPersonName: undefined }));
                }}
                placeholder="Who will make the call"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                  errors.callingPersonName
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.callingPersonName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.callingPersonName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Task description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={taskDescription}
                onChange={(e) => {
                  setTaskDescription(e.target.value);
                  setErrors((p) => ({ ...p, taskDescription: undefined }));
                }}
                placeholder="What should be discussed on the call…"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                  errors.taskDescription
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              />
              {errors.taskDescription && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.taskDescription}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Calling days <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const on = callingDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              {errors.callingDays && (
                <p className="mt-1 text-xs text-red-500">{errors.callingDays}</p>
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

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200/60 transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-60 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Scheduling…" : "Schedule Weekly Call"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
