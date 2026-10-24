import { useMemo, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { FileText,
  Building2,
  Download as DownloadIcon,
  AlertCircle,
  User,
  Users,
  PieChart,
  X,
  Ticket,
  Bug,
  AlertTriangle,
  Wrench,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  Link2,
  Layers,
  Hash,
  StickyNote,
  MessageSquare,
} from "lucide-react"
import { getDeadlineStatus } from "./exportHelpers"
import DataTable from "../shared/DataTable"

const HEADERS = [
  "Company",
  "Total Tasks",
  "Persons",
  "Task Distribution (Person: Count)",
  "Deadline Status",
]

/** Normalize type_of_work labels for consistent counting */
function normalizeWorkType(raw) {
  const s = String(raw || "").trim().toLowerCase()
  if (!s) return "Other"
  if (s.includes("complain")) return "Complain Report"
  if (s.includes("error")) return "Error Received"
  if (s.includes("existing") || (s.includes("edit") && s.includes("update")))
    return "Existing System Edit & Update"
  if (s.includes("new") && s.includes("system")) return "New System"
  if (s.includes("meeting")) return "Meeting"
  return String(raw).trim() || "Other"
}

const WORK_TYPE_META = [
  {
    key: "Complain Report",
    label: "Complain Report",
    icon: Bug,
    iconBg: "bg-rose-500",
    iconShadow: "shadow-rose-200",
    bar: "bg-rose-500",
    countColor: "text-rose-600",
    ring: "ring-rose-100",
    soft: "from-rose-50 to-white",
  },
  {
    key: "Error Received",
    label: "Error Received",
    icon: AlertTriangle,
    iconBg: "bg-amber-500",
    iconShadow: "shadow-amber-200",
    bar: "bg-amber-500",
    countColor: "text-amber-600",
    ring: "ring-amber-100",
    soft: "from-amber-50 to-white",
  },
  {
    key: "Existing System Edit & Update",
    label: "Existing System Edit & Update",
    icon: Wrench,
    iconBg: "bg-sky-500",
    iconShadow: "shadow-sky-200",
    bar: "bg-sky-500",
    countColor: "text-sky-600",
    ring: "ring-sky-100",
    soft: "from-sky-50 to-white",
  },
  {
    key: "New System",
    label: "New System",
    icon: Sparkles,
    iconBg: "bg-violet-500",
    iconShadow: "shadow-violet-200",
    bar: "bg-violet-500",
    countColor: "text-violet-600",
    ring: "ring-violet-100",
    soft: "from-violet-50 to-white",
  },
  {
    key: "Meeting",
    label: "Meeting",
    icon: Calendar,
    iconBg: "bg-emerald-500",
    iconShadow: "shadow-emerald-200",
    bar: "bg-emerald-500",
    countColor: "text-emerald-600",
    ring: "ring-emerald-100",
    soft: "from-emerald-50 to-white",
  },
]

const DEADLINE_META = [
  {
    key: "today",
    label: "Today",
    icon: CheckCircle2,
    iconBg: "bg-emerald-500",
    soft: "from-emerald-50 to-white",
    countColor: "text-emerald-700",
    ring: "ring-emerald-100",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    icon: Clock,
    iconBg: "bg-indigo-500",
    soft: "from-indigo-50 to-white",
    countColor: "text-indigo-700",
    ring: "ring-indigo-100",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertCircle,
    iconBg: "bg-red-500",
    soft: "from-red-50 to-white",
    countColor: "text-red-700",
    ring: "ring-red-100",
  },
]

function buildCompanyDetail(company, reportsData, persons) {
  const tasks = reportsData.filter((t) => t.party_name === company)
  const byType = {}
  WORK_TYPE_META.forEach((m) => {
    byType[m.key] = 0
  })
  let other = 0
  tasks.forEach((t) => {
    const key = normalizeWorkType(t.type_of_work)
    if (byType[key] !== undefined) byType[key] += 1
    else other += 1
  })

  const today = tasks.filter((t) => getDeadlineStatus(t.planned3) === "today").length
  const upcoming = tasks.filter((t) => getDeadlineStatus(t.planned3) === "upcoming").length
  const overdue = tasks.filter((t) => getDeadlineStatus(t.planned3) === "overdue").length

  const systems = [...new Set(tasks.map((t) => t.system_name).filter(Boolean))]

  const personList = Object.entries(persons || {})
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  return {
    company,
    totalTickets: tasks.length,
    byType,
    other,
    today,
    upcoming,
    overdue,
    systems,
    persons: personList,
    tasks,
  }
}

function formatDate(value) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function priorityBadge(priority) {
  const p = String(priority || "Medium").toLowerCase()
  if (p === "high") return "bg-red-50 text-red-700 ring-red-200/60"
  if (p === "low") return "bg-slate-50 text-slate-600 ring-slate-200/60"
  return "bg-amber-50 text-amber-700 ring-amber-200/60"
}

function statusBadge(status) {
  const s = String(status || "Pending").toLowerCase()
  if (s.includes("complete") || s === "done")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
  if (s.includes("progress")) return "bg-sky-50 text-sky-700 ring-sky-200/60"
  return "bg-indigo-50 text-indigo-700 ring-indigo-200/60"
}

function CompanyDetailModal({ detail, onClose }) {
  const [view, setView] = useState({ mode: "overview", filter: null })
  const [expandedTaskId, setExpandedTaskId] = useState(null)

  useEffect(() => {
    setView({ mode: "overview", filter: null })
    setExpandedTaskId(null)
  }, [detail?.company])

  useEffect(() => {
    setExpandedTaskId(null)
  }, [view.mode, view.filter])

  const filteredTasks = useMemo(() => {
    if (!detail || view.mode !== "filtered" || !view.filter) return []
    const { kind, value } = view.filter
    return detail.tasks.filter((t) => {
      if (kind === "type") return normalizeWorkType(t.type_of_work) === value
      if (kind === "deadline") return getDeadlineStatus(t.planned3) === value
      if (kind === "person") {
        const person = t.employee_name_1 || t.team_member_name || "Unassigned"
        return person === value
      }
      if (kind === "all") return true
      return false
    })
  }, [view, detail])

  const filterTitle = useMemo(() => {
    if (!view.filter) return ""
    const { kind, value } = view.filter
    if (kind === "type") return value
    if (kind === "deadline") {
      const m = DEADLINE_META.find((d) => d.key === value)
      return m ? `${m.label} deadlines` : value
    }
    if (kind === "person") return `Tasks for ${value}`
    if (kind === "all") return "All tickets"
    return ""
  }, [view.filter])

  if (!detail) return null

  const maxType = Math.max(
    1,
    ...Object.values(detail.byType),
    detail.other || 0
  )

  const openFilter = (kind, value) => {
    setView({ mode: "filtered", filter: { kind, value } })
  }

  const backToOverview = () => setView({ mode: "overview", filter: null })

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-950/20 ring-1 ring-black/5">
        {/* ── Header ── */}
        <div className="relative shrink-0 overflow-hidden border-b border-indigo-100/80 bg-gradient-to-b from-indigo-50 to-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500" />

          <div className="relative px-5 pb-5 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200/80">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-500">
                    Company overview
                  </p>
                  <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {detail.company}
                  </h2>
                  {detail.systems.length > 0 && (
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      {detail.systems.slice(0, 2).join(" · ")}
                      {detail.systems.length > 2
                        ? ` +${detail.systems.length - 2}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total tickets pill */}
            <button
              type="button"
              onClick={() => openFilter("all", null)}
              className="group mt-5 inline-flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Total tickets raised
                </p>
                <p className="text-2xl font-bold leading-none tabular-nums text-indigo-700">
                  {detail.totalTickets}
                </p>
              </div>
              <ArrowRight className="ml-1 h-4 w-4 text-indigo-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {view.mode === "overview" ? (
            <div className="space-y-7">
              {/* Work types */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    By type of work
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {WORK_TYPE_META.map((meta) => {
                    const count = detail.byType[meta.key] || 0
                    const Icon = meta.icon
                    const pct = Math.round((count / maxType) * 100)
                    const active = count > 0
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => active && openFilter("type", meta.key)}
                        disabled={!active}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${meta.soft} p-4 text-left ring-1 ${meta.ring} transition-all duration-200 ${
                          active
                            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 active:translate-y-0 active:shadow-sm"
                            : "cursor-default opacity-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${meta.iconBg} ${meta.iconShadow}`}
                            >
                              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                            </div>
                            <p className="text-[13px] font-semibold leading-snug text-slate-700">
                              {meta.label}
                            </p>
                          </div>
                          <span
                            className={`text-2xl font-bold tabular-nums tracking-tight ${meta.countColor}`}
                          >
                            {count}
                          </span>
                        </div>
                        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100/80">
                          <div
                            className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {active && (
                          <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 opacity-0 transition group-hover:opacity-100">
                            View tasks
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Deadlines */}
              <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Deadline status
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {DEADLINE_META.map((meta) => {
                    const count =
                      meta.key === "today"
                        ? detail.today
                        : meta.key === "upcoming"
                          ? detail.upcoming
                          : detail.overdue
                    const Icon = meta.icon
                    const active = count > 0
                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => active && openFilter("deadline", meta.key)}
                        disabled={!active}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b ${meta.soft} px-2 py-4 text-center ring-1 ${meta.ring} transition-all duration-200 ${
                          active
                            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 active:translate-y-0"
                            : "cursor-default opacity-50"
                        }`}
                      >
                        <div
                          className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md ${meta.iconBg}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <p
                          className={`text-2xl font-bold tabular-nums tracking-tight ${meta.countColor}`}
                        >
                          {count}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                          {meta.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* People */}
              {detail.persons.length > 0 && (
                <section>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    People working
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.persons.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => openFilter("person", p.name)}
                        className="group inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-md hover:ring-indigo-200 active:translate-y-0"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-bold text-white shadow-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        {p.name}
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-700">
                          {p.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* ── Filtered list ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={backToOverview}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-100 transition hover:bg-indigo-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {filterTitle}
                  </p>
                  <p className="text-xs text-slate-400">
                    {filteredTasks.length} ticket
                    {filteredTasks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <AlertCircle className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    No tickets match this filter
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {filteredTasks.map((task, idx) => {
                    const person =
                      task.employee_name_1 ||
                      task.team_member_name ||
                      "Unassigned"
                    const dl = getDeadlineStatus(task.planned3)
                    const dlMeta = DEADLINE_META.find((d) => d.key === dl)
                    const taskKey = task.id || task.task_no || idx
                    const isExpanded = expandedTaskId === taskKey
                    return (
                      <li
                        key={taskKey}
                        className={`rounded-2xl bg-white shadow-sm ring-1 transition ${
                          isExpanded
                            ? "ring-indigo-200 shadow-md"
                            : "ring-slate-100 hover:shadow-md hover:ring-indigo-100"
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedTaskId(isExpanded ? null : taskKey)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setExpandedTaskId(isExpanded ? null : taskKey)
                            }
                          }}
                          className="w-full cursor-pointer p-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold leading-snug text-slate-800">
                                {task.description_of_work ||
                                  task.task_name ||
                                  task.remarks ||
                                  "Untitled task"}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                                    {person.charAt(0).toUpperCase()}
                                  </span>
                                  {person}
                                </span>
                                {task.system_name && (
                                  <span className="max-w-[130px] truncate text-slate-400">
                                    {task.system_name}
                                  </span>
                                )}
                                <span className="text-slate-400">
                                  {formatDate(task.planned3)}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <span
                                className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusBadge(
                                  task.status
                                )}`}
                              >
                                {task.status || "Pending"}
                              </span>
                              <span
                                className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${priorityBadge(
                                  task.priority || task.priority_in_customer
                                )}`}
                              >
                                {task.priority ||
                                  task.priority_in_customer ||
                                  "Medium"}
                              </span>
                              <ChevronDown
                                className={`mt-0.5 h-4 w-4 text-slate-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-50 pt-3">
                            <span className="inline-flex items-center rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
                              {normalizeWorkType(task.type_of_work)}
                            </span>
                            {dlMeta && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg bg-gradient-to-b ${dlMeta.soft} px-2 py-1 text-[11px] font-medium ring-1 ${dlMeta.ring} ${dlMeta.countColor}`}
                              >
                                <dlMeta.icon className="h-3 w-3" />
                                {dlMeta.label}
                              </span>
                            )}
                            {task.link_of_system && (
                              <a
                                href={task.link_of_system}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50"
                              >
                                <Link2 className="h-3 w-3" />
                                Open system
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-indigo-50 bg-gradient-to-b from-indigo-50/40 to-white px-4 pb-4 pt-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {task.task_no && (
                                <div className="flex items-start gap-2">
                                  <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Task No
                                    </p>
                                    <p className="text-sm font-medium text-slate-800">
                                      {task.task_no}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    Given Date
                                  </p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {formatDate(task.given_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    Expected Close
                                  </p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {formatDate(
                                      task.planned3 ||
                                        task.expected_date_to_close
                                    )}
                                  </p>
                                </div>
                              </div>
                              {task.system_name && (
                                <div className="flex items-start gap-2">
                                  <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      System
                                    </p>
                                    <p className="text-sm font-medium text-slate-800">
                                      {task.system_name}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {(task.description_of_work ||
                              task.task_name) && (
                              <div className="mt-3 flex items-start gap-2">
                                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    Description
                                  </p>
                                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                                    {task.description_of_work ||
                                      task.task_name}
                                  </p>
                                </div>
                              </div>
                            )}

                            {task.notes && (
                              <div className="mt-3 flex items-start gap-2">
                                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    Notes
                                  </p>
                                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                                    {task.notes}
                                  </p>
                                </div>
                              </div>
                            )}

                            {task.remarks && (
                              <div className="mt-3 flex items-start gap-2">
                                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                    Remarks
                                  </p>
                                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                                    {task.remarks}
                                  </p>
                                </div>
                              </div>
                            )}

                            {task.link_of_system && (
                              <div className="mt-3">
                                <a
                                  href={task.link_of_system}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                  Open system
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:ring-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default function ReportTable({ stats, reportsData, exportToCSV, exportToPDF }) {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const selectedDetail = useMemo(() => {
    if (!selectedCompany) return null
    const persons = stats.companyPersonDistribution[selectedCompany] || {}
    return buildCompanyDetail(selectedCompany, reportsData, persons)
  }, [selectedCompany, reportsData, stats.companyPersonDistribution])

  useEffect(() => {
    if (!selectedCompany) return
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedCompany(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedCompany])

  // Sorted (company, persons) entries backing the table - same ordering as before migration
  const sortedCompanies = useMemo(
    () =>
      Object.entries(stats.companyPersonDistribution).sort(
        ([, a], [, b]) =>
          Object.values(b).reduce((sum, val) => sum + val, 0) -
          Object.values(a).reduce((sum, val) => sum + val, 0)
      ),
    [stats.companyPersonDistribution]
  )

  // Pagination is component-local: reportsData/stats arrive already-filtered from Report/index.jsx.
  // Reset to page 1 whenever the incoming (filtered) data changes.
  useEffect(() => {
    setCurrentPage(1)
  }, [reportsData])

  const totalPages = Math.max(1, Math.ceil(sortedCompanies.length / itemsPerPage))
  const paginatedCompanies = useMemo(
    () => sortedCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sortedCompanies, currentPage, itemsPerPage]
  )

  const renderRow = ([company, persons]) => {
    const totalTasks = stats.byCompany[company] || 0
    const todayTasks = reportsData.filter(
      (task) =>
        task.party_name === company &&
        getDeadlineStatus(task.planned3) === "today"
    ).length
    const upcomingTasks = reportsData.filter(
      (task) =>
        task.party_name === company &&
        getDeadlineStatus(task.planned3) === "upcoming"
    ).length
    const overdueTasks = reportsData.filter(
      (task) =>
        task.party_name === company &&
        getDeadlineStatus(task.planned3) === "overdue"
    ).length

    return (
      <tr
        key={company}
        onClick={() => setSelectedCompany(company)}
        className="group cursor-pointer transition-colors hover:bg-indigo-50/60"
        title="Click to view company details"
      >
        <td className="px-6 py-4 text-center align-middle">
          <div>
            <p className="font-semibold text-gray-900 transition-colors group-hover:text-indigo-700">
              {company}
            </p>
            <p className="text-sm text-gray-500">
              {reportsData.filter(
                (t) => t.party_name === company
              )[0]?.system_name || "No System"}
            </p>
          </div>
        </td>
        <td className="px-6 py-4 text-center align-middle">
          <span className="text-lg font-bold text-indigo-600">
            {totalTasks}
          </span>
        </td>
        <td className="px-6 py-4 text-center align-middle">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(persons).map((person) => (
              <span
                key={person}
                className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-800"
              >
                <User className="mr-1 h-3 w-3" />
                {person}
              </span>
            ))}
          </div>
        </td>
        <td className="px-6 py-4 text-center align-middle">
          <div className="space-y-1.5">
            {Object.entries(persons)
              .sort(([, a], [, b]) => b - a)
              .map(([person, count]) => (
                <div
                  key={person}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-gray-700">{person}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </td>
        <td className="px-6 py-4 text-center align-middle">
          <div className="flex flex-wrap items-center gap-2">
            {todayTasks > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Today: {todayTasks}
              </span>
            )}
            {upcomingTasks > 0 && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
                Upcoming: {upcomingTasks}
              </span>
            )}
            {overdueTasks > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                Overdue: {overdueTasks}
              </span>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderCard = ([company, persons]) => {
    const totalTasks = stats.byCompany[company] || 0
    return (
      <div
        key={company}
        onClick={() => setSelectedCompany(company)}
        className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md cursor-pointer"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>
        <div className="flex justify-between items-start mt-1">
          <div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
              {company}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Total Tasks: {totalTasks}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Persons</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.keys(persons).map((person) => (
                <span key={person} className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-800">
                  <User className="mr-1 h-3 w-3" />
                  {person}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Companies by Tasks
            </h3>
            <PieChart className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byCompany)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([company, count]) => (
                <div
                  key={company}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="truncate text-gray-700">{company}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold text-indigo-600">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((count / (stats.totalPending || 1)) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Persons by Tasks
            </h3>
            <Users className="h-5 w-5 text-violet-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byPerson)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([person, count]) => (
                <div key={person} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-violet-500" />
                    <span className="truncate text-gray-700">{person}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold text-violet-600">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((count / (stats.totalPending || 1)) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div className="mb-2 flex items-center gap-2 sm:mb-0">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Task Distribution by Company
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportToCSV("company-summary")}
                className="flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportToPDF && exportToPDF()}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <FileText className="h-3.5 w-3.5" />
                Export PDF
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Click a company row to view detailed ticket breakdown
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <DataTable
            headers={HEADERS}
            data={paginatedCompanies}
            renderRow={renderRow}
            renderCard={renderCard}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={sortedCompanies.length}
          />
        </div>
      </div>

      <CompanyDetailModal
        detail={selectedDetail}
        onClose={() => setSelectedCompany(null)}
      />
    </>
  )
}
