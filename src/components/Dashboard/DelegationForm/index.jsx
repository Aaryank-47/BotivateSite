"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  User,
  FileText,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Search,
  Mic,
  MicOff,
} from "lucide-react";
import {
  fetchDelegationUsers,
  createDelegatedTask,
} from "../../../services/schemaApi";

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

export default function DelegationForm({
  userRole = "admin",
  user,
  userFilterData,
  companyData,
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [personId, setPersonId] = useState("");
  const [taskDetails, setTaskDetails] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const currentUserId = resolveCurrentUserId(user, userFilterData, companyData);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsers(true);
        const rows = await fetchDelegationUsers();
        if (!cancelled) setUsers(rows);
      } catch (e) {
        console.error("Failed to load users:", e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = personSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.role || "").toLowerCase().includes(q)
    );
  }, [users, personSearch]);

  const selectedPerson = users.find((u) => String(u.id) === String(personId));

  const validate = () => {
    const next = {};
    if (!personId) next.personId = "Select a person";
    if (!taskDetails.trim()) next.taskDetails = "Task details are required";
    if (!targetDate) next.targetDate = "Target date is required";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const td = new Date(targetDate);
      if (td < today) next.targetDate = "Target date cannot be in the past";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!validate()) return;
    if (!currentUserId) {
      setErrors({ form: "Could not identify logged-in user. Please re-login." });
      return;
    }

    setSubmitting(true);
    try {
      await createDelegatedTask({
        task_details: taskDetails,
        assigned_to: personId,
        assigned_by: currentUserId,
        target_date: targetDate,
      });
      setSuccessMsg("Task delegated successfully.");
      setPersonId("");
      setTaskDetails("");
      setTargetDate("");
      setPersonSearch("");
      setErrors({});
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrors({
        form: err?.message || "Failed to create delegated task.",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const toggleVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrors((prev) => ({
        ...prev,
        form: "Voice typing is not supported in this browser. Try Chrome.",
      }));
      return;
    }

    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        }
      }
      if (finalChunk) {
        setTaskDetails((prev) => {
          const sep = prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : "";
          return prev + sep + finalChunk.trim();
        });
        setErrors((prev) => ({ ...prev, taskDetails: undefined, form: undefined }));
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <div className="min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Delegation Form
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Assign an internal task to a team member
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">
              New delegation
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Person dropdown */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Person name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    errors.personId
                      ? "border-red-300 ring-1 ring-red-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={
                      selectedPerson ? "text-slate-800" : "text-slate-400"
                    }
                  >
                    {selectedPerson
                      ? `${selectedPerson.name || selectedPerson.username}${
                          selectedPerson.role
                            ? ` · ${selectedPerson.role}`
                            : ""
                        }`
                      : loadingUsers
                        ? "Loading people…"
                        : "Select person"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <div className="border-b border-slate-100 p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={personSearch}
                          onChange={(e) => setPersonSearch(e.target.value)}
                          placeholder="Search by name…"
                          className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {filteredUsers.length === 0 ? (
                        <li className="px-3 py-4 text-center text-sm text-slate-400">
                          No users found
                        </li>
                      ) : (
                        filteredUsers.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setPersonId(String(u.id));
                                setDropdownOpen(false);
                                setPersonSearch("");
                                setErrors((prev) => ({
                                  ...prev,
                                  personId: undefined,
                                }));
                              }}
                              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-indigo-50 ${
                                String(personId) === String(u.id)
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-700"
                              }`}
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-600">
                                {(u.name || u.username || "?").charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {u.name || u.username}
                                </span>
                                <span className="block text-[11px] capitalize text-slate-400">
                                  {u.role || "user"}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {errors.personId && (
                <p className="mt-1 text-xs text-red-500">{errors.personId}</p>
              )}
            </div>

            {/* Task details */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Task details <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={taskDetails}
                  onChange={(e) => {
                    setTaskDetails(e.target.value);
                    setErrors((prev) => ({ ...prev, taskDetails: undefined }));
                  }}
                  rows={4}
                  placeholder="Describe the task clearly… or use the mic to speak"
                  className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/40 ${
                    errors.taskDetails
                      ? "border-red-300 ring-1 ring-red-100"
                      : "border-slate-200 focus:border-indigo-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  title={listening ? "Stop listening" : "Voice to text"}
                  className={`absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    listening
                      ? "bg-red-500 text-white shadow-md shadow-red-200 animate-pulse"
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  }`}
                >
                  {listening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </div>
              {listening && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  Listening… speak now
                </p>
              )}
              {errors.taskDetails && (
                <p className="mt-1 text-xs text-red-500">{errors.taskDetails}</p>
              )}
            </div>

            {/* Target date */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Target date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setErrors((prev) => ({ ...prev, targetDate: undefined }));
                }}
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-500/40 ${
                  errors.targetDate
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-slate-200 focus:border-indigo-300"
                }`}
              />
              {errors.targetDate && (
                <p className="mt-1 text-xs text-red-500">{errors.targetDate}</p>
              )}
            </div>

            {errors.form && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.form}
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setPersonId("");
                setTaskDetails("");
                setTargetDate("");
                setErrors({});
                setSuccessMsg("");
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Assigning…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Assign Task
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
