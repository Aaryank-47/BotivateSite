"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import supabase from "../../../supabaseClient";
import { ListTodo, ArrowLeft, Clock, CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import DataTable from "../shared/DataTable";
import { fetchStageByTask } from "../../../services/schemaApi";

const HEADERS = [
  "Task No",
  "Task Name",
  "Description",
  "Assigned To",
  "Date Raised",
  "Deadline",
  "Stage",
  "Status",
];

function StatusBadge({ task, size = "sm" }) {
  const s = (task.status || "Pending").toLowerCase();
  const cls = size === "sm" ? "text-[10px]" : "text-[11px]";
  if (s === "completed") return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold bg-emerald-100 text-emerald-700`}>Completed</span>;
  if (s === "cancelled") return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold bg-slate-100 text-slate-600`}>Cancelled</span>;

  const isOverdue = task.expected_date_to_close && new Date(task.expected_date_to_close) < new Date();
  if (isOverdue) return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold bg-rose-100 text-rose-700`}>Overdue</span>;

  return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold bg-amber-100 text-amber-700`}>{task.status || "Pending"}</span>;
}

// Open task = being worked on; completed task = wherever its delivery sits in the pipeline.
const stageOf = (task, stages) => {
  const s = (task.status || "Pending").toLowerCase();
  if (s === "cancelled") return "Cancelled";
  if (s !== "completed") return "In Development";
  return stages[String(task.id)] || "Completed";
};

function StageBadge({ task, stages, size = "sm" }) {
  const stage = stageOf(task, stages);
  const cls = size === "sm" ? "text-[10px]" : "text-[11px]";
  const tone = stage.includes("sent back")
    ? "bg-rose-100 text-rose-700"
    : stage === "Delivered" || stage === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : stage === "Cancelled"
        ? "bg-slate-100 text-slate-600"
        : "bg-indigo-100 text-indigo-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold ${tone}`}>{stage}</span>;
}

export default function SystemTasksPage({ selectedSystem, setActiveTab }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState({});
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0, completed: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const loadTasks = useCallback(async () => {
    if (!selectedSystem) return;
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from("user_tasks")
        .select("*, assigned_member:users!user_tasks_assigned_member_1_fkey (name, username)")
        .eq("company_id", selectedSystem.company_id)
        .eq("system_id", selectedSystem.id)
        .order("given_date", { ascending: false });

      if (!error && data) {
        setTasks(data);
        setStages(await fetchStageByTask(selectedSystem.id));

        // Calculate Stats
        const now = new Date();
        let pending = 0;
        let overdue = 0;
        let completed = 0;

        data.forEach(task => {
          const status = (task.status || "Pending").toLowerCase();
          if (status === "completed") {
            completed++;
          } else if (status !== "cancelled") {
            pending++;
            if (task.expected_date_to_close && new Date(task.expected_date_to_close) < now) {
              overdue++;
            }
          }
        });

        setStats({
          total: data.length,
          pending,
          overdue,
          completed
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSystem]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSystem]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage));
  const paginated = useMemo(
    () => tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [tasks, currentPage, itemsPerPage]
  );

  if (!selectedSystem) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 gap-4">
        No system selected.
        <button onClick={() => setActiveTab("company-systems")} className="text-indigo-600 font-medium hover:underline">
          Go back to Company Systems
        </button>
      </div>
    );
  }

  const renderRow = (task) => (
    <tr key={task.id} className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-indigo-600 whitespace-nowrap align-middle">#{task.task_no}</td>
      <td className="px-4 py-3 text-center font-medium text-slate-800 whitespace-nowrap align-middle">{task.type_of_work}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 max-w-xs align-middle" title={task.description_of_work}>{task.description_of_work}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-700 align-middle">{task.assigned_member?.name || "Unknown"}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-500 align-middle">{new Date(task.given_date).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-500 align-middle">
        {task.expected_date_to_close ? new Date(task.expected_date_to_close).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
        <StageBadge task={task} stages={stages} size="md" />
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
        <StatusBadge task={task} size="md" />
      </td>
    </tr>
  );

  const renderCard = (task) => (
    <div key={task.id} className="p-4 flex flex-col gap-3 rounded-2xl shadow-sm border border-gray-100 relative bg-white">
      <div className="flex justify-between items-start">
        <span className="font-bold text-slate-800">{task.type_of_work}</span>
        <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{task.task_no}</span>
      </div>
      <p className="text-sm text-slate-500">{task.description_of_work}</p>

      <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="col-span-2 flex justify-between items-center border-b border-slate-200 pb-2 mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
          <StatusBadge task={task} size="sm" />
        </div>
        <div className="col-span-2 flex justify-between items-center border-b border-slate-200 pb-2 mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Stage</span>
          <StageBadge task={task} stages={stages} size="sm" />
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned To</span>
          <span className="text-sm font-medium text-slate-700">{task.assigned_member?.name || "Unknown"}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Deadline</span>
          <span className="text-sm font-medium text-slate-700">{task.expected_date_to_close ? new Date(task.expected_date_to_close).toLocaleDateString() : "—"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex justify-end"
      >
        <button
          onClick={() => setActiveTab("company-systems")}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Systems
        </button>
      </motion.div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Raised", value: stats.total, color: "from-indigo-500 to-violet-600", icon: Ticket },
          { label: "Pending", value: stats.pending, color: "from-amber-400 to-orange-500", icon: Clock },
          { label: "Overdue", value: stats.overdue, color: "from-rose-500 to-red-600", icon: AlertCircle },
          { label: "Completed", value: stats.completed, color: "from-emerald-500 to-teal-500", icon: CheckCircle2 }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 flex items-center gap-4 transition-all bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading tasks...</div>
        ) : (
          <DataTable
            headers={HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[900px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={tasks.length}
          />
        )}
      </div>
    </div>
  );
}
