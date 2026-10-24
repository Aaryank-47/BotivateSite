"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Search, RefreshCw } from "lucide-react";
import { fetchCompanyList } from "../../../services/schemaApi";
import DataTable from "../shared/DataTable";

const HEADERS = [
  "Serial No",
  "Company ID",
  "Company",
  "Department",
  "System Name",
  "Description of System",
  "Company Username",
  "Company Password",
];

export default function CompanyList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompanyList();
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.serial_no,
        r.company_id,
        r.company_name,
        r.department,
        r.system_name,
        r.description_of_system,
        r.company_username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const renderRow = (r) => (
    <tr
      key={`${r.company_id}-${r.system_name}-${r.serial_no}`}
      className="hover:bg-gray-50 transition"
    >
      <td className="px-4 py-3 text-center font-mono text-[12px] font-semibold text-slate-700 whitespace-nowrap align-middle">
        {r.serial_no}
      </td>
      <td className="px-4 py-3 text-center font-mono text-[12px] text-slate-600 whitespace-nowrap align-middle">
        {r.company_id ?? "—"}
      </td>
      <td className="px-4 py-3 text-center font-medium text-slate-800 whitespace-nowrap align-middle">
        {r.company_name || "—"}
      </td>
      <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap align-middle">
        {r.department || "—"}
      </td>
      <td className="px-4 py-3 text-center text-slate-800 whitespace-nowrap align-middle">
        {r.system_name || "—"}
      </td>
      <td className="max-w-[220px] px-4 py-3 text-center text-slate-500 align-middle">
        <span className="line-clamp-2">{r.description_of_system || "—"}</span>
      </td>
      <td className="px-4 py-3 text-center font-mono text-[12px] text-slate-700 whitespace-nowrap align-middle">
        {r.company_username || "—"}
      </td>
      <td className="px-4 py-3 text-center font-mono text-[12px] text-slate-700 whitespace-nowrap align-middle">
        {r.company_password || "—"}
      </td>
    </tr>
  );

  const renderCard = (r) => (
    <div
      key={`${r.company_id}-${r.system_name}-${r.serial_no}`}
      className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {r.company_name || "—"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{r.department || "—"}</p>
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Serial No</span>
          <span className="font-mono text-xs font-semibold text-slate-700">{r.serial_no}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">System Name</span>
          <span className="font-semibold text-gray-900">{r.system_name || "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
          <span className="text-gray-700">{r.description_of_system || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Username</span>
          <span className="font-mono font-semibold text-slate-700">{r.company_username || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</span>
          <span className="font-mono font-semibold text-slate-700">{r.company_password || "—"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-300/40">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Company List
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Systems and company login credentials
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies / systems…"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-500/30"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading…</div>
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
            totalResults={filtered.length}
          />
        )}
      </div>
    </div>
  );
}
