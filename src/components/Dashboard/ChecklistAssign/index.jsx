"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  ListChecks,
  UserPlus,
  Phone,
  ChevronRight,
} from "lucide-react";
import ChecklistForm from "../ChecklistForm";
import DelegationForm from "../DelegationForm";
import WeeklyCallsForm from "../WeeklyCallsForm";

const WORK_TYPES = [
  {
    id: "checklist",
    label: "Checklist",
    description: "Recurring operational or customer checklist tasks",
    icon: ListChecks,
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    id: "delegation",
    label: "Delegation",
    description: "Assign an internal one-off task to a team member",
    icon: UserPlus,
    gradient: "from-indigo-500 to-blue-600",
    ring: "ring-indigo-200",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  {
    id: "weekly-calls",
    label: "Weekly Calls",
    description: "Schedule recurring customer / partner calls",
    icon: Phone,
    gradient: "from-violet-500 to-purple-600",
    ring: "ring-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
];

export default function ChecklistAssign({
  userRole,
  user,
  userFilterData,
  companyData,
}) {
  const [workType, setWorkType] = useState("");

  return (
    <div className="min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-200/50">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Assign Task
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Choose the type of work, then fill the matching form
            </p>
          </div>
        </div>
      </motion.div>

      {/* Type selector */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          Type of work
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {WORK_TYPES.map((t) => {
            const Icon = t.icon;
            const active = workType === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setWorkType(t.id)}
                className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? `border-transparent bg-gradient-to-br ${t.gradient} text-white shadow-lg`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                    active
                      ? "bg-white/20 text-white"
                      : `${t.bg} ${t.text}`
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-base font-semibold ${
                    active ? "text-white" : "text-slate-800"
                  }`}
                >
                  {t.label}
                </span>
                <span
                  className={`mt-1 text-xs leading-relaxed ${
                    active ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {t.description}
                </span>
                {active && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                    <ChevronRight className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Dynamic form */}
      <AnimatePresence mode="wait">
        {workType === "checklist" && (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ChecklistForm
              userRole={userRole}
              user={user}
              userFilterData={userFilterData}
              companyData={companyData}
            />
          </motion.div>
        )}
        {workType === "delegation" && (
          <motion.div
            key="delegation"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <DelegationForm
              userRole={userRole}
              user={user}
              userFilterData={userFilterData}
              companyData={companyData}
            />
          </motion.div>
        )}
        {workType === "weekly-calls" && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <WeeklyCallsForm
              userRole={userRole}
              user={user}
              userFilterData={userFilterData}
              companyData={companyData}
            />
          </motion.div>
        )}
        {!workType && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center"
          >
            <ClipboardList className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              Select a type of work above to open the form
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
