"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  ListChecks,
  CheckCircle2,
  Clock,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import supabase from "../../../supabaseClient";
import { fetchSystems, fetchEmplTasks } from "../../../services/schemaApi";
import { formatDate } from "../../../utils/dateFormatters";
import { LoadingIndicator } from "../shared/StatusIndicators";

const STATUS_STYLE = {
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-100 text-slate-600",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
        STATUS_STYLE[status] || "bg-amber-100 text-amber-700"
      }`}
    >
      {status || "Pending"}
    </span>
  );
}

function Stat({ icon: StatIcon, label, value, tint }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${tint}`}>
        <StatIcon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold leading-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon: CardIcon, children, right }) {
  return (
    <section className="overflow-hidden bg-white border border-slate-200 rounded-2xl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CardIcon className="w-4 h-4 text-indigo-500" />
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

function Detail({ icon: DetailIcon, label, children }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <DetailIcon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="w-32 text-sm text-slate-500 shrink-0">{label}</span>
      <div className="min-w-0 text-sm font-semibold break-words text-slate-900">{children}</div>
    </div>
  );
}

/** Company login: profile with account details and systems. */
export default function CompanyProfile({ companyData }) {
  const [profile, setProfile] = useState(null);
  const [systems, setSystems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const id = companyData?.companyId;
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("id, username, password, name, company_name, is_active, created_at")
          .eq("id", id)
          .maybeSingle();
        setProfile(data || null);
        const [sys, tk] = await Promise.all([fetchSystems(id), fetchEmplTasks({ companyId: id })]);
        setSystems(sys);
        setTasks(tk);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyData?.companyId]);

  const counts = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "Cancelled");
    const done = active.filter((t) => t.status === "Completed").length;
    return { total: active.length, done, open: active.length - done };
  }, [tasks]);

  // a system is Completed only when it has tasks and all of them are completed
  const systemStatus = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (t.system_id == null || t.status === "Cancelled") continue;
      const k = String(t.system_id);
      map[k] ||= { total: 0, done: 0 };
      map[k].total += 1;
      if (t.status === "Completed") map[k].done += 1;
    }
    return (sysId) => {
      const s = map[String(sysId)];
      return s && s.total > 0 && s.done === s.total ? "Completed" : "Pending";
    };
  }, [tasks]);

  if (loading) return <LoadingIndicator message="Loading company profile…" />;
  if (!profile) return <p className="p-6 text-sm text-slate-500">Company profile not found.</p>;

  const companyName = profile.company_name || profile.name;
  const active = profile.is_active !== false;

  return (
    <div className="w-full space-y-4">
      {/* Hero */}
      <div className="flex flex-wrap items-center gap-4 p-5 text-white rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500">
        <div className="flex items-center justify-center w-14 h-14 text-2xl font-bold rounded-2xl bg-white/20">
          {companyName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight break-words">{companyName}</h1>
          <p className="mt-0.5 text-sm text-indigo-100">Company account · Login ID {profile.username}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
            active ? "bg-emerald-400/90 text-emerald-950" : "bg-white/30 text-white"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Server} label="Systems" value={systems.length} tint="bg-indigo-50 text-indigo-600" />
        <Stat icon={ListChecks} label="Total tasks" value={counts.total} tint="bg-sky-50 text-sky-600" />
        <Stat icon={Clock} label="Open tasks" value={counts.open} tint="bg-amber-50 text-amber-600" />
        <Stat icon={CheckCircle2} label="Completed" value={counts.done} tint="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Account */}
        <Card title="Account details" icon={User}>
          <div className="divide-y divide-slate-100">
            <Detail icon={Building2} label="Company name">{companyName}</Detail>
            <Detail icon={User} label="Login ID">{profile.username}</Detail>
            <Detail icon={KeyRound} label="Password">
              <span className="inline-flex items-center gap-2">
                <span className="font-mono">{showPass ? profile.password : "••••••••"}</span>
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </Detail>
            <Detail icon={CalendarDays} label="Customer since">{formatDate(profile.created_at) || "—"}</Detail>
          </div>
        </Card>

        {/* Systems */}
        <Card title="My systems" icon={Server} right={<span className="text-xs text-slate-400">{systems.length} total</span>}>
          {systems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-slate-400">No systems added yet.</p>
          ) : (
            <ul className="overflow-y-auto divide-y max-h-56 divide-slate-100">
              {systems.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900">{s.name}</p>
                    <p className="text-xs truncate text-slate-400">{s.department_name || "—"}</p>
                  </div>
                  <StatusPill status={systemStatus(s.id)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
