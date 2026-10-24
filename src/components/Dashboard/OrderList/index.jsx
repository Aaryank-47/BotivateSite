"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, RefreshCw, ExternalLink, Plus, PackagePlus, X } from "lucide-react";
import OrderForm from "../OrderForm";
import { fetchOrders, fetchCompanies, createSystemsForParty } from "../../../services/schemaApi";
import DataTable from "../shared/DataTable";

const HEADERS = [
  "Serial",
  "Party name",
  "Type of work",
  "Start",
  "End",
  "Value",
  "Payment",
  "NDA",
  "NDA file",
  "Quotation #",
  "Quotation file",
  "Status",
  "Created",
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatMoney(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s === "completed")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200/70";
  if (s === "in progress") return "bg-sky-50 text-sky-700 ring-sky-200/70";
  if (s === "cancelled") return "bg-rose-50 text-rose-700 ring-rose-200/70";
  return "bg-indigo-50 text-indigo-700 ring-indigo-200/70";
}

function LinkCell({ url }) {
  if (!url) return <span className="text-slate-400">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
    >
      View <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function OrderList({ user, userRole, setActiveTab, setSelectedCompanyId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showForm, setShowForm] = useState(false);

  const handleRowClick = async (partyName) => {
    try {
      const companies = await fetchCompanies();
      const match = companies.find(c => (c.name || "").toLowerCase() === (partyName || "").toLowerCase() || (c.company_name || "").toLowerCase() === (partyName || "").toLowerCase());
      if (match) {
        if (setSelectedCompanyId) setSelectedCompanyId(match.id);
        if (setActiveTab) setActiveTab("company-systems");
      } else if (
        window.confirm(
          `"${partyName}" has no company account yet.\nCreate it now and open its systems list?`
        )
      ) {
        const res = await createSystemsForParty(partyName, [], null);
        if (res.created) {
          alert(`Company created.\nLogin: ${res.created.username} / ${res.created.password}`);
        }
        if (setSelectedCompanyId) setSelectedCompanyId(res.companyId);
        if (setActiveTab) setActiveTab("company-systems");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
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
        r.serial_number,
        r.party_name,
        r.type_of_work,
        r.payment_type,
        r.quotation_number,
        r.status,
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
      key={r.id}
      onClick={() => handleRowClick(r.party_name)}
      className="hover:bg-gray-50 transition cursor-pointer"
    >
      <td className="px-3 py-3 text-center font-mono text-[11px] font-semibold text-indigo-700 whitespace-nowrap align-middle">
        {r.serial_number || "—"}
      </td>
      <td className="px-3 py-3 text-center font-medium text-slate-800 whitespace-nowrap align-middle">
        {r.party_name || "—"}
      </td>
      <td className="px-3 py-3 text-center text-slate-600 whitespace-nowrap align-middle">
        {r.type_of_work || "—"}
      </td>
      <td className="px-3 py-3 text-center tabular-nums text-slate-500 whitespace-nowrap align-middle">
        {formatDate(r.start_date)}
      </td>
      <td className="px-3 py-3 text-center tabular-nums text-slate-500 whitespace-nowrap align-middle">
        {formatDate(r.end_date)}
      </td>
      <td className="px-3 py-3 text-center tabular-nums font-medium text-slate-800 whitespace-nowrap align-middle">
        {formatMoney(r.value_of_order)}
      </td>
      <td className="px-3 py-3 text-center text-slate-600 whitespace-nowrap align-middle">
        {r.payment_type || "—"}
      </td>
      <td className="px-3 py-3 text-center text-slate-600 whitespace-nowrap align-middle">
        {r.nda_required ? "Yes" : "No"}
      </td>
      <td className="px-3 py-3 text-center whitespace-nowrap align-middle">
        <LinkCell url={r.nda_attachment_url} />
      </td>
      <td className="px-3 py-3 text-center font-mono text-[12px] text-slate-700 whitespace-nowrap align-middle">
        {r.quotation_number || "—"}
      </td>
      <td className="px-3 py-3 text-center whitespace-nowrap align-middle">
        <LinkCell url={r.quotation_attachment_url} />
      </td>
      <td className="px-3 py-3 text-center whitespace-nowrap align-middle">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle(
            r.status
          )}`}
        >
          {r.status || "Submitted"}
        </span>
      </td>
      <td className="px-3 py-3 text-center tabular-nums text-slate-500 whitespace-nowrap align-middle">
        {formatDate(r.created_at)}
      </td>
    </tr>
  );

  const renderCard = (r) => (
    <div
      key={r.id}
      onClick={() => handleRowClick(r.party_name)}
      className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md cursor-pointer"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {r.serial_number || "No Serial"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{r.party_name || "—"}</p>
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyle(r.status)}`}>
          {r.status || "Submitted"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type of Work</span>
          <span className="font-semibold text-gray-900">{r.type_of_work || "—"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Value</span>
          <span className="font-semibold text-gray-900">{formatMoney(r.value_of_order)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</span>
          <span className="font-semibold text-gray-900">{formatDate(r.start_date)}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</span>
          <span className="font-semibold text-gray-900">{r.payment_type || "—"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-wrap items-center gap-4"
      >


        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </motion.div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <PackagePlus className="h-5 w-5 text-indigo-600" />
                Order Form
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <OrderForm
                user={user}
                modal
                onClose={() => setShowForm(false)}
                onCreated={() => {
                  setShowForm(false);
                  load();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-400">Loading…</div>
        ) : (
          <DataTable
            headers={HEADERS}
            data={paginated}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1100px]"
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
