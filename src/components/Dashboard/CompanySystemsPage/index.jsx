"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { fetchSystems, fetchSystemRequests, fetchDeliveredCredentials, fetchLatestCredentials, fetchStageBySystem } from "../../../services/schemaApi";
import supabase from "../../../supabaseClient";
import { Server, Edit2, ExternalLink, Eye, EyeOff, ChevronRight, X, ArrowLeft } from "lucide-react";
import DataTable from "../shared/DataTable";
import AssignTaskForm from "../AssignTaskForm";
import Select from "../shared/Select";
import { Search, Plus } from "lucide-react";
import RequestSystemModal from "./RequestSystemModal";

const HEADERS = [
  "Action",
  "Company Name",
  "Serial Number",
  "Department",
  "System Name",
  "Description",
  "Total Tasks",
  "Completed Tasks",
  "Pending Tasks",
  "Actual Link",
  "Actual ID",
  "Actual Pass",
  "Dummy Link",
  "Dummy ID",
  "Dummy Pass",
  "Stage",
  "Status",
  "",
];

export default function CompanySystemsPage({ selectedCompanyId, userRole, setActiveTab, setSelectedSystem, user, userFilterData, companyData }) {
  const isCompany = userRole === "company";
  const [taskSystem, setTaskSystem] = useState(null);
  const [notice, setNotice] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requests, setRequests] = useState([]);
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [systems, setSystems] = useState([]);
  const [statusBySystem, setStatusBySystem] = useState({});
  const [delivered, setDelivered] = useState({});
  const [stages, setStages] = useState({});
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const togglePassword = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSystemClick = (sys) => {
    if (sys.isRequest) return;
    if (setSelectedSystem) setSelectedSystem(sys);
    if (setActiveTab) setActiveTab("system-tasks");
  };

  const loadSystems = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const data = await fetchSystems(selectedCompanyId);
      setSystems(data || []);
      const reqs = await fetchSystemRequests();
      setRequests(reqs.filter((r) => String(r.company_id) === String(selectedCompanyId)));
      setDelivered(
        isCompany
          ? await fetchDeliveredCredentials(selectedCompanyId)
          : await fetchLatestCredentials(selectedCompanyId)
      );

      setStages(await fetchStageBySystem(selectedCompanyId));

      const { data: taskRows } = await supabase
        .from("user_tasks")
        .select("id, system_id, status")
        .eq("company_id", selectedCompanyId);
      const all = (taskRows || []).filter((t) => t.system_id != null && t.status !== "Cancelled");
      const map = {};
      for (const t of all) {
        const k = String(t.system_id);
        map[k] ||= { total: 0, done: 0 };
        map[k].total += 1;
        if (t.status === "Completed") map[k].done += 1;
      }
      setStatusBySystem(map);
    } catch (e) {
      console.error(e);
      setSystems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, isCompany]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompanyId]);

  // not-yet-approved (or rejected) requests are shown in the same table; approved ones are real systems
  const rows = useMemo(
    () => [
      ...requests
        .filter((r) => r.status !== "Approved")
        .map((r) => ({
          id: `req-${r.id}`,
          isRequest: true,
          approval: r.status,
          name: r.system_name,
          department_name: r.department,
          description: r.description,
          company: r.company,
          decision_remarks: r.decision_remarks,
        })),
      ...systems.map((sys) => {
        // Once both the Dummy and Actual builds have cleared Approval For Delivery the system is
        // done: show their link / id / pass. Until then a company login sees no credentials.
        const d = delivered[String(sys.id)];
        if (d) {
          return {
            ...sys,
            approval: "Approved",
            website_link: d.actual ? d.actual.link : sys.website_link,
            system_username: d.actual ? d.actual.id : sys.system_username,
            system_password: d.actual ? d.actual.pass : sys.system_password,
            dummy_link: d.dummy ? d.dummy.link : sys.dummy_link,
            dummy_username: d.dummy ? d.dummy.id : sys.dummy_username,
            dummy_password: d.dummy ? d.dummy.pass : sys.dummy_password,
          };
        }
        if (isCompany) {
          return {
            ...sys,
            approval: "Approved",
            website_link: null,
            system_username: null,
            system_password: null,
            dummy_link: null,
            dummy_username: null,
            dummy_password: null,
          };
        }
        return { ...sys, approval: "Approved" };
      }),
    ],
    [requests, systems, delivered, isCompany]
  );

  const departments = useMemo(
    () => [...new Set(rows.map((s) => s.department_name).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((sys) => {
      if (approvalFilter !== "all" && sys.approval !== approvalFilter) return false;
      if (deptFilter !== "all" && sys.department_name !== deptFilter) return false;
      if (statusFilter !== "all") {
        const st = statusBySystem[String(sys.id)];
        const complete = !!st && st.total > 0 && st.done === st.total;
        if ((statusFilter === "completed") !== complete) return false;
      }
      if (!q) return true;
      return [sys.name, sys.department_name, sys.description, sys.company?.name, sys.company?.company_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, deptFilter, statusFilter, approvalFilter, statusBySystem]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, statusFilter, approvalFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const handleUpdate = (sys) => {
    if (sys.isRequest) return;
    // Determine the company name. If available in sys.company.name, use it.
    const companyName = sys.company?.name || sys.company?.company_name || "";

    const prefillData = {
      companyId: sys.company_id,
      companyName: companyName,
      systemId: sys.id,
      systemName: sys.name,
      typeOfWork: "",
      description: "",
      link: sys.website_link || "",
    };

    sessionStorage.setItem("assignTaskPrefill", JSON.stringify(prefillData));

    setTaskSystem(sys);
  };

  const isComplete = (sys) => {
    const st = statusBySystem[String(sys.id)];
    return !!st && st.total > 0 && st.done === st.total;
  };

  const StatusBadge = ({ sys, cls = "text-[11px]" }) => (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold ${
        isComplete(sys) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {isComplete(sys) ? "Completed" : "Pending"}
    </span>
  );

  const ApprovalBadge = ({ value, cls = "text-[11px]" }) => (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold ${
        value === "Approved"
          ? "bg-emerald-100 text-emerald-700"
          : value === "Rejected"
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {value}
    </span>
  );

  // Where the system's work currently sits: open tasks = being built / reworked, otherwise the latest delivery's stage.
  const stageOf = (sys) => {
    const st = statusBySystem[String(sys.id)];
    if (st && st.total > st.done) return "In Development";
    if (stages[String(sys.id)]) return stages[String(sys.id)];
    return st && st.total > 0 ? "Delivered" : "Not Started";
  };

  const StageBadge = ({ sys, cls = "text-[11px]" }) => {
    const stage = stageOf(sys);
    const tone =
      stage === "Delivered"
        ? "bg-emerald-100 text-emerald-700"
        : stage === "Not Started"
          ? "bg-slate-100 text-slate-600"
          : "bg-indigo-100 text-indigo-700";
    return <span className={`inline-flex rounded-full px-2 py-0.5 ${cls} font-semibold ${tone}`}>{stage}</span>;
  };

  const countsOf = (sys) => {
    const st = statusBySystem[String(sys.id)] || { total: 0, done: 0 };
    return { total: st.total, done: st.done, pending: st.total - st.done };
  };

  const blank = <td className="px-4 py-3" />;
  const renderRequestRow = (sys, idx) => (
    <tr key={sys.id} className="border-t border-slate-100 bg-amber-50/30">
      <td className="px-4 py-3 text-center align-middle whitespace-nowrap" title={sys.decision_remarks || ""}>
        <ApprovalBadge value={sys.approval === "Pending" ? "Pending approval" : sys.approval} />
      </td>
      {!isCompany && <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap text-center align-middle">{sys.company?.name || sys.company?.company_name || "—"}</td>}
      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 whitespace-nowrap text-center align-middle">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">{sys.department_name || "—"}</td>
      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap text-center align-middle">{sys.name}</td>
      <td className="px-4 py-3 text-xs text-slate-500 min-w-[200px] text-center align-middle">{sys.description || "—"}</td>
      {blank}{blank}{blank}{blank}{blank}{blank}
      {blank}{blank}{blank}{blank}{blank}{blank}
    </tr>
  );

  const renderRow = (sys, idx) => sys.isRequest ? renderRequestRow(sys, idx) : (
    <tr key={sys.id} onClick={() => handleSystemClick(sys)} className="border-t border-slate-100 hover:bg-slate-50/50 transition cursor-pointer">
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        <button
          onClick={(e) => { e.stopPropagation(); handleUpdate(sys); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Assign task
        </button>
      </td>
      {!isCompany && <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap text-center align-middle">{sys.company?.name || sys.company?.company_name || "—"}</td>}
      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 whitespace-nowrap text-center align-middle">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">{sys.department_name || "—"}</td>
      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap text-center align-middle">{sys.name || "—"}</td>
      <td className="px-4 py-3 text-xs text-slate-500 min-w-[200px] text-center align-middle">{sys.description || "—"}</td>
      <td className="px-4 py-3 text-sm font-bold text-slate-800 whitespace-nowrap text-center align-middle">{countsOf(sys).total}</td>
      <td className="px-4 py-3 text-sm font-bold text-emerald-600 whitespace-nowrap text-center align-middle">{countsOf(sys).done}</td>
      <td className="px-4 py-3 text-sm font-bold text-amber-600 whitespace-nowrap text-center align-middle">{countsOf(sys).pending}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        {sys.website_link ? (
          <a href={sys.website_link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
            Link <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap text-center align-middle">
        {sys.system_username && <span className="bg-slate-50 rounded px-1.5 py-0.5">{sys.system_username}</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        <div className="flex items-center gap-2">
          {sys.system_password && (
          <span className="font-mono text-xs bg-slate-50 rounded px-1.5 py-0.5 text-slate-700">
            {visiblePasswords[sys.id] ? sys.system_password : "••••••••"}
          </span>
          )}
          {sys.system_password && (
            <button onClick={(e) => { e.stopPropagation(); togglePassword(sys.id); }} className="text-slate-400 hover:text-slate-600 transition">
              {visiblePasswords[sys.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        {sys.dummy_link ? (
          <a href={sys.dummy_link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-amber-700 hover:underline">
            Link <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap text-center align-middle">
        {sys.dummy_username && <span className="bg-amber-50 rounded px-1.5 py-0.5">{sys.dummy_username}</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        <div className="flex items-center justify-center gap-2">
          {sys.dummy_password && (
          <span className="font-mono text-xs bg-amber-50 rounded px-1.5 py-0.5 text-slate-700">
            {visiblePasswords[`d-${sys.id}`] ? sys.dummy_password : "••••••••"}
          </span>
          )}
          {sys.dummy_password && (
            <button onClick={(e) => { e.stopPropagation(); togglePassword(`d-${sys.id}`); }} className="text-slate-400 hover:text-slate-600 transition">
              {visiblePasswords[`d-${sys.id}`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        <StageBadge sys={sys} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
        <StatusBadge sys={sys} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-center align-middle">
        <ChevronRight className="h-4 w-4" />
      </td>
    </tr>
  );

  const renderCard = (sys, idx) => (
    <div key={sys.id} className="flex flex-col gap-2">
      <div onClick={() => handleSystemClick(sys)} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md cursor-pointer">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-80"></div>

        <div className="flex justify-between items-start mt-1">
          <div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 text-lg tracking-tight">
              {sys.name || "Unnamed System"}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-0.5">Dep: {sys.department_name || "—"}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ApprovalBadge value={sys.approval} cls="text-[10px]" />
            {!sys.isRequest && <StageBadge sys={sys} cls="text-[10px]" />}
            {!sys.isRequest && <StatusBadge sys={sys} cls="text-[10px]" />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          {!isCompany && <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Name</span>
            <span className="font-semibold text-gray-900">{sys.company?.name || sys.company?.company_name || "—"}</span>
          </div>}
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Serial #</span>
            <span className="font-semibold text-gray-900 font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
          </div>

          {!sys.isRequest && (
            <div className="grid grid-cols-3 col-span-2 gap-2 text-center">
              {[
                ["Total", countsOf(sys).total, "text-slate-800"],
                ["Completed", countsOf(sys).done, "text-emerald-600"],
                ["Pending", countsOf(sys).pending, "text-amber-600"],
              ].map(([label, n, color]) => (
                <div key={label} className="p-2 bg-white border border-gray-200 rounded-lg">
                  <span className={`block text-lg font-bold ${color}`}>{n}</span>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
            <p className="text-xs text-gray-700 leading-relaxed">{sys.description || "—"}</p>
          </div>

          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Credentials</span>
            <div className="flex flex-col gap-1 mt-1 bg-white p-2 rounded border border-gray-200">
              {(sys.dummy_username || sys.dummy_password) && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Dummy ID / Pass:</span>
                <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-1 rounded">{sys.dummy_username || ""} / {sys.dummy_password || ""}</span>
              </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Actual ID:</span>
                <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-1 rounded">{sys.system_username || "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Actual Pass:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-rose-700 font-semibold bg-rose-50 px-1 rounded">
                    {visiblePasswords[sys.id] ? (sys.system_password || "—") : "••••••••"}
                  </span>
                  {sys.system_password && (
                    <button onClick={(e) => { e.stopPropagation(); togglePassword(sys.id); }} className="text-slate-400 hover:text-slate-600">
                      {visiblePasswords[sys.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {!sys.isRequest && <button
            onClick={(e) => { e.stopPropagation(); handleUpdate(sys); }}
            className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
            Assign task
          </button>}
          {sys.website_link && (
            <a
              href={sys.website_link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex justify-center items-center rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
          <div className="flex items-center justify-center p-2.5 rounded-xl bg-slate-50 text-slate-400">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!selectedCompanyId) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        No company selected. Please select an order from the Order List.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 gap-3">
      {/* Filters: search + department + status */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {!isCompany && (
          <button
            type="button"
            onClick={() => setActiveTab?.("order-list")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold border rounded-full text-slate-700 bg-white border-slate-200 whitespace-nowrap hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Order List
          </button>
        )}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute w-4 h-4 text-slate-400 -translate-y-1/2 left-3.5 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system, department or description…"
            className="w-full py-2 pl-10 pr-3 text-sm bg-white border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
          />
        </div>
        <Select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-full sm:w-48"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-full sm:w-44"
        >
          <option value="all">All approvals</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending approval</option>
          <option value="Rejected">Rejected</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-full sm:w-40"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </Select>
        {isCompany && (
          <button
            type="button"
            onClick={() => setShowRequest(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-sm whitespace-nowrap hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Request for new system
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading systems...</div>
        ) : !selectedCompanyId ? (
          <div className="px-4 py-12 text-center text-slate-500">Select a party from Order List to see its systems.</div>
        ) : (
          <DataTable
            headers={isCompany ? HEADERS.filter((h) => h !== "Company Name") : HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1500px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            totalResults={filtered.length}
          />
        )}
      </div>

      {showRequest && (
        <RequestSystemModal
          companyData={companyData}
          onClose={() => setShowRequest(false)}
          onSaved={(msg) => {
            setShowRequest(false);
            loadSystems();
            setNotice(msg);
            setTimeout(() => setNotice(""), 3500);
          }}
        />
      )}

      {notice && (
        <div className="fixed z-[60] px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-lg bottom-6 right-6 bg-emerald-600">
          {notice}
        </div>
      )}

      {taskSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-tight text-slate-900">
                  {userRole === "company" ? "Generate New Ticket" : "Assign Task"}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {taskSystem.name}
                  {(taskSystem.company?.company_name || taskSystem.company?.name) && (
                    <> · {taskSystem.company?.company_name || taskSystem.company?.name}</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTaskSystem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <AssignTaskForm
                compact
                onCancel={() => setTaskSystem(null)}
                onTaskCreated={(created) => {
                  setTaskSystem(null);
                  setNotice(`${created?.length || 1} task(s) saved successfully.`);
                  setTimeout(() => setNotice(""), 3000);
                  loadSystems();
                }}
                userRole={userRole}
                user={user}
                userFilterData={userFilterData}
                companyData={companyData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
