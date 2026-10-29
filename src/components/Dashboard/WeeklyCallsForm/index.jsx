"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  User,
  Building2,
  FileText,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createWeeklyCall,
  fetchCompanies,
  fetchWeeklyCalls,
  fetchDelegationUsers,
} from "../../../services/schemaApi";
import Select from "../shared/Select";
import ComboboxField from "./ComboboxField";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_PRESETS = [
  { label: "10:00 AM", val: "10:00" },
  { label: "11:30 AM", val: "11:30" },
  { label: "02:00 PM", val: "14:00" },
  { label: "04:00 PM", val: "16:00" },
  { label: "06:00 PM", val: "18:00" },
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
  const [callingTime, setCallingTime] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Dropdown options state
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [weeklyCalls, setWeeklyCalls] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);

  // Load companies, existing weekly calls, and team members for dropdowns
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingDropdowns(true);
        const [companiesRes, weeklyRes, usersRes] = await Promise.allSettled([
          fetchCompanies(),
          fetchWeeklyCalls(),
          fetchDelegationUsers(),
        ]);

        if (cancelled) return;

        if (companiesRes.status === "fulfilled" && Array.isArray(companiesRes.value)) {
          setCompanies(companiesRes.value);
        }
        if (weeklyRes.status === "fulfilled" && Array.isArray(weeklyRes.value)) {
          setWeeklyCalls(weeklyRes.value);
        }
        if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
          setTeamUsers(usersRes.value);
        }
      } catch (err) {
        console.error("Error fetching dropdown options for weekly calls:", err);
      } finally {
        if (!cancelled) setLoadingDropdowns(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build sorted list of unique parties
  const partyOptions = useMemo(() => {
    const map = new Map();
    // 1. Registered companies
    companies.forEach((c) => {
      const name = (c.name || c.company_name || "").trim();
      if (name) {
        map.set(name.toLowerCase(), {
          label: name,
          value: name,
          badge: "Company",
        });
      }
    });
    // 2. Distinct party names from previous weekly calls
    weeklyCalls.forEach((w) => {
      const name = (w.party_name || "").trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          label: name,
          value: name,
          badge: "Party",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
  }, [companies, weeklyCalls]);

  // Contacts mapped by party name (lowercase)
  const contactsByParty = useMemo(() => {
    const map = {};
    weeklyCalls.forEach((w) => {
      const pKey = (w.party_name || "").trim().toLowerCase();
      if (!pKey || !w.responsible_person) return;
      if (!map[pKey]) map[pKey] = [];
      const personName = w.responsible_person.trim();
      const existing = map[pKey].find(
        (c) => c.name.toLowerCase() === personName.toLowerCase()
      );
      if (!existing) {
        map[pKey].push({
          name: personName,
          phone: w.responsible_phone || "",
        });
      }
    });
    return map;
  }, [weeklyCalls]);

  // Build list of responsible person options (prioritizing selected party's contacts)
  const responsiblePersonOptions = useMemo(() => {
    const currentPartyKey = (partyName || "").trim().toLowerCase();
    const partyContacts = (currentPartyKey && contactsByParty[currentPartyKey]) || [];

    const result = [];
    const seen = new Set();

    // 1. Contacts specifically for the selected party (top priority)
    partyContacts.forEach((c) => {
      seen.add(c.name.toLowerCase());
      result.push({
        label: c.name,
        value: c.name,
        phone: c.phone || "",
        badge: "Party Contact",
      });
    });

    // 2. Contacts from all other parties
    weeklyCalls.forEach((w) => {
      const name = (w.responsible_person || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        result.push({
          label: name,
          value: name,
          phone: w.responsible_phone || "",
          badge: w.party_name ? `${w.party_name}` : "Client Contact",
        });
      }
    });

    // 3. Team members / delegation users
    teamUsers.forEach((u) => {
      const name = (u.name || u.username || "").trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        result.push({
          label: name,
          value: name,
          phone: "",
          badge: "Team Member",
        });
      }
    });

    return result;
  }, [partyName, contactsByParty, weeklyCalls, teamUsers]);

  // Auto-fill phone and country code from contact
  const applyContactPhone = (rawPhone) => {
    if (!rawPhone) return;
    const clean = String(rawPhone).trim();
    const matched = COUNTRY_CODES.find((c) => clean.startsWith(c.code));
    if (matched) {
      setCountryCode(matched.code);
      setPhone(clean.slice(matched.code.length).replace(/\D/g, ""));
    } else {
      setPhone(clean.replace(/\D/g, ""));
    }
    setErrors((p) => ({ ...p, phone: undefined }));
  };

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
    if (!phone.trim()) next.phone = "Client number is required";
    else if (phone.length < 7) next.phone = "Enter a valid client number";
    if (!callingPersonName.trim())
      next.callingPersonName = "Calling person name is required";
    if (!taskDescription.trim())
      next.taskDescription = "Task description is required";
    if (!callingDays.length) next.callingDays = "Select at least one day";
    if (!callingTime) next.callingTime = "Time is required";
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
        calling_time: callingTime,
        assigned_by: currentUserId,
      });
      setSuccessMsg("Weekly call scheduled successfully.");
      setPartyName("");
      setResponsiblePerson("");
      setPhone("");
      setCallingPersonName("");
      setTaskDescription("");
      setCallingDays([]);
      setCallingTime("");
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
            {/* 1. Party Name (Dropdown / Combobox) */}
            <ComboboxField
              id="weekly-party-name"
              label="Party name"
              icon={Building2}
              required
              value={partyName}
              options={partyOptions}
              loading={loadingDropdowns}
              onChange={(val, opt) => {
                setPartyName(val);
                setErrors((p) => ({ ...p, partyName: undefined }));
                // Auto-fill contact if single contact is known for this party and responsiblePerson is empty
                const pKey = (val || "").trim().toLowerCase();
                const matchedContacts = contactsByParty[pKey] || [];
                if (matchedContacts.length === 1 && !responsiblePerson) {
                  setResponsiblePerson(matchedContacts[0].name);
                  if (matchedContacts[0].phone) {
                    applyContactPhone(matchedContacts[0].phone);
                  }
                }
              }}
              placeholder="Select or type party name"
              error={errors.partyName}
              emptyMessage="No party found. Type to add a new party."
            />

            {/* 2. Responsible Person (Dropdown / Combobox) */}
            <ComboboxField
              id="weekly-responsible-person"
              label="Responsible person"
              icon={User}
              required
              value={responsiblePerson}
              options={responsiblePersonOptions}
              loading={loadingDropdowns}
              onChange={(val, opt) => {
                setResponsiblePerson(val);
                setErrors((p) => ({ ...p, responsiblePerson: undefined }));
                if (opt?.phone) {
                  applyContactPhone(opt.phone);
                }
              }}
              placeholder="Select or type responsible person"
              error={errors.responsiblePerson}
              emptyMessage="No contacts found. Type to add a new contact."
            />

            {/* 3. Client Number (Replaced "Responsible person phone") */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Client Number <span className="text-red-500">*</span>
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
                  placeholder="Client number only"
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

            {/* 4. Calling Person Name */}
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

            {/* 5. Task Description */}
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

            {/* 6. Calling Days */}
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

            {/* 7. Niche Time Selection (Time field directly below Calling days) */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Time <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="time"
                    value={callingTime}
                    onChange={(e) => {
                      setCallingTime(e.target.value);
                      setErrors((p) => ({ ...p, callingTime: undefined }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-violet-500/40 ${
                      errors.callingTime
                        ? "border-red-300 ring-1 ring-red-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  />
                </div>
                {/* Quick preset chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-400 mr-1 hidden sm:inline">
                    Quick pick:
                  </span>
                  {TIME_PRESETS.map((preset) => {
                    const active = callingTime === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          setCallingTime(preset.val);
                          setErrors((p) => ({ ...p, callingTime: undefined }));
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {errors.callingTime && (
                <p className="mt-1 text-xs text-red-500">{errors.callingTime}</p>
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
