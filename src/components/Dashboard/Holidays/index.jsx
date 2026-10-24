"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  Save,
  Sun,
  PartyPopper,
  AlertCircle,
  CheckCircle2,
  Repeat,
  Search,
  Info,
} from "lucide-react";
import {
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  extendOpenTasksForHoliday,
} from "../../../services/schemaApi";
import { formatDateKey, isSunday, toDateOnly } from "../../../utils/workingDays";
import DataTable from "../shared/DataTable";
import Select from "../shared/Select";

const emptyForm = {
  holiday_date: "",
  name: "",
  description: "",
  is_recurring: false,
};

function formatDisplayDate(isoDate) {
  if (!isoDate) return "—";
  const d = toDateOnly(isoDate);
  if (!d) return String(isoDate).slice(0, 10);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function upcomingSundays(count = 8, fromDate = new Date()) {
  const out = [];
  let d = toDateOnly(fromDate) || toDateOnly(new Date());
  // Include today when it is Sunday (month boundary / same-day refresh)
  if (isSunday(d)) out.push(new Date(d));
  while (out.length < count) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (isSunday(d)) out.push(new Date(d));
  }
  return out;
}

export default function HolidaysPage({ userRole, userFilterData }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const isAdmin =
    userRole === "admin" ||
    userRole === "superadmin" ||
    (userFilterData?.role || "").toLowerCase() === "admin" ||
    (userFilterData?.role || "").toLowerCase() === "superadmin";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchHolidays();
      setHolidays(rows);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const years = useMemo(() => {
    const set = new Set();
    holidays.forEach((h) => {
      if (h.holiday_date) set.add(String(h.holiday_date).slice(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [holidays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return holidays.filter((h) => {
      if (yearFilter !== "all" && String(h.holiday_date).slice(0, 4) !== yearFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (h.name || "").toLowerCase().includes(q) ||
        (h.description || "").toLowerCase().includes(q) ||
        String(h.holiday_date).includes(q)
      );
    });
  }, [holidays, search, yearFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const upcoming = useMemo(() => {
    const today = formatDateKey(toDateOnly(new Date()));
    return holidays
      .filter((h) => {
        if (h.is_recurring) return true;
        return String(h.holiday_date).slice(0, 10) >= today;
      })
      .slice(0, 6);
  }, [holidays]);

  // Recompute when calendar day/month rolls over (not only on first mount)
  const [todayKey, setTodayKey] = useState(() => formatDateKey(new Date()));
  useEffect(() => {
    const syncToday = () => {
      const key = formatDateKey(new Date());
      setTodayKey((prev) => (prev !== key ? key : prev));
    };
    const id = setInterval(syncToday, 60_000);
    const onFocus = () => syncToday();
    const onVis = () => {
      if (document.visibilityState === "visible") syncToday();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const sundaysPreview = useMemo(() => upcomingSundays(6, new Date()), [todayKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      holiday_date: String(row.holiday_date).slice(0, 10),
      name: row.name || "",
      description: row.description || "",
      is_recurring: !!row.is_recurring,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setFormError(null);

    if (!form.holiday_date) {
      setFormError("Please pick a date.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Holiday name is required.");
      return;
    }

    // Warn if Sunday — still allow store as named holiday
    const d = toDateOnly(form.holiday_date);
    if (d && isSunday(d) && !form.is_recurring) {
      // Sundays already off; still allow named entry
    }

    setSaving(true);
    try {
      const payload = {
        holiday_date: form.holiday_date,
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_recurring: !!form.is_recurring,
        created_by: userFilterData?.userId
          ? Number(userFilterData.userId)
          : null,
      };

      let saved;
      if (editing) {
        saved = await updateHoliday(editing.id, payload);
        showToast("Holiday updated");
      } else {
        saved = await createHoliday(payload);
        showToast("Holiday added");
      }

      // Extend open tasks so metrics stay fair
      try {
        const all = editing
          ? holidays.map((h) => (h.id === editing.id ? { ...h, ...saved } : h))
          : [...holidays, saved];
        const n = await extendOpenTasksForHoliday(saved, all);
        if (n > 0) {
          showToast(
            `Holiday saved. Extended expected date on ${n} open task(s).`,
            "success"
          );
        }
      } catch (extErr) {
        console.warn("Task date extension skipped:", extErr);
      }

      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      console.error(err);
      const msg = err.message || String(err);
      if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
        setFormError("A holiday already exists on this date.");
      } else {
        setFormError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteHoliday(deleteConfirm.id);
      showToast(`Removed “${deleteConfirm.name}”`);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      showToast(err.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const HEADERS = useMemo(() => {
    const base = ["Date", "Name", "Notes", "Type"];
    return isAdmin ? [...base, "Actions"] : base;
  }, [isAdmin]);

  const renderRow = (h) => (
    <tr key={h.id} className="hover:bg-slate-50/80 transition">
      <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
        <div className="font-medium text-gray-900">
          {formatDisplayDate(h.holiday_date)}
        </div>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="font-medium text-gray-800">{h.name}</div>
      </td>
      <td className="px-4 py-3 text-center text-gray-500 max-w-xs align-middle">
        {h.description || "—"}
      </td>
      <td className="px-4 py-3 text-center align-middle">
        {h.is_recurring ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
            <Repeat className="w-3 h-3" />
            Yearly
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200">
            One-time
          </span>
        )}
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-center whitespace-nowrap align-middle">
          <button
            type="button"
            onClick={() => openEdit(h)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(h)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition ml-1"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );

  const renderCard = (h) => (
    <div
      key={h.id}
      className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {h.name}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{formatDisplayDate(h.holiday_date)}</p>
        </div>
        <div className="flex items-center space-x-2">
          {h.is_recurring ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200">
              <Repeat className="w-3 h-3" />
              Yearly
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200">
              One-time
            </span>
          )}
        </div>
      </div>

      {h.description && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</span>
            <span className="font-semibold text-gray-900">{h.description}</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => openEdit(h)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(h)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col min-h-0 space-y-5 pb-8">
      {/* Stats — white cards like User Access */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 max-w-md">
        {[
          { label: "Total holidays", value: holidays.length },
          {
            label: "Recurring yearly",
            value: holidays.filter((h) => h.is_recurring).length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Main list */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[480px] lg:h-auto lg:flex-1 lg:min-h-0">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shrink-0">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 flex-shrink-0">
                <PartyPopper className="w-4 h-4 text-indigo-500" />
                Holiday list
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-40 sm:w-48"
                  />
                </div>
                <Select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Holiday
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading holidays…
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-xs text-gray-500 mt-2">
                  If the table is missing, run{" "}
                  <code className="bg-gray-100 px-1 rounded">migration_holidays.sql</code>{" "}
                  on Supabase.
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-4 text-sm text-indigo-600 font-medium hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <DataTable
                  headers={HEADERS}
                  data={paginated}
                  renderRow={renderRow}
                  renderCard={renderCard}
                  minWidth="min-w-full"
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                  totalResults={filtered.length}
                />
              </div>
            )}
          </div>
        </div>

        {/* Side panels — Upcoming first, Sundays below */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Upcoming holidays
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming entries.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex flex-col items-center justify-center text-[10px] font-bold leading-tight flex-shrink-0 shadow-sm shadow-blue-500/20">
                      <span>{String(h.holiday_date).slice(8, 10)}</span>
                      <span className="uppercase opacity-90">
                        {toDateOnly(h.holiday_date)?.toLocaleDateString("en", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">
                        {h.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDisplayDate(h.holiday_date)}
                        {h.is_recurring ? " · yearly" : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-amber-500" />
              Sundays
            </h3>
            <ul className="space-y-2">
              {sundaysPreview.map((d) => (
                <li
                  key={formatDateKey(d)}
                  className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-slate-50 border border-gray-100"
                >
                  <span className="font-medium text-gray-800">
                    {d.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Sunday</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Create / Edit modal — User Access style */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
              onClick={closeModal}
            />
            <div
              className="relative w-full max-w-md max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 flex flex-col"
              style={{ animation: "holModalIn 0.22s ease-out" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {editing ? "Edit holiday" : "Add holiday"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {editing
                        ? "Update date, name, or recurring setting"
                        : "Add a company or national holiday"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="px-6 py-5 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.holiday_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, holiday_date: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali, Independence Day"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional note"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_recurring: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                      Repeats every year
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Same month & day is treated as a holiday every year.
                    </p>
                  </div>
                </label>

              </form>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 shadow-md shadow-blue-500/20 transition"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editing ? "Save changes" : "Save holiday"}
                    </>
                  )}
                </button>
              </div>
            </div>
            <style>{`
              @keyframes holModalIn {
                from { opacity: 0; transform: translateY(12px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
          </div>,
          document.body
        )}

      {/* Delete confirm */}
      {deleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
              onClick={() => !deleting && setDeleteConfirm(null)}
            />
            <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Delete holiday?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Remove{" "}
                <span className="font-medium text-gray-800">{deleteConfirm.name}</span> on{" "}
                {formatDisplayDate(deleteConfirm.holiday_date)}? Existing task due
                dates are not shortened.
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast */}
      {toast &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[110]">
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
                toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {toast.message}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
