"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, Search, Plus } from "lucide-react";

function HighlightMatch({ text = "", query = "" }) {
  if (!query.trim()) return <span>{text}</span>;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <span>{text}</span>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <span>
      {before}
      <span className="font-bold text-violet-700 underline decoration-violet-300 decoration-2 underline-offset-2">
        {match}
      </span>
      {after}
    </span>
  );
}

export default function ComboboxField({
  id = "combobox-field",
  label = "",
  icon: Icon = null,
  required = false,
  value = "",
  onChange,
  options = [],
  placeholder = "Select or type...",
  error = "",
  loading = false,
  emptyMessage = "No matching options found",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal query when value changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filtered options based on user typing
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const l = (opt.label || opt.name || opt.value || "").toLowerCase();
      const p = (opt.phone || "").toLowerCase();
      const b = (opt.badge || "").toLowerCase();
      return l.includes(q) || p.includes(q) || b.includes(q);
    });
  }, [options, query]);

  // Check if current query is an exact match for an option
  const exactMatch = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return null;
    return options.find(
      (opt) =>
        (opt.label || opt.name || opt.value || "").toLowerCase() === q
    );
  }, [options, query]);

  const selectOption = (opt) => {
    const val = opt.label || opt.name || opt.value || "";
    setQuery(val);
    setOpen(false);
    setActiveIndex(-1);
    onChange?.(val, opt);
  };

  const handleSelectCustom = (customVal) => {
    const val = customVal.trim();
    setQuery(val);
    setOpen(false);
    setActiveIndex(-1);
    onChange?.(val, { label: val, value: val, isCustom: true });
  };

  const clearInput = () => {
    setQuery("");
    onChange?.("", null);
    inputRef.current?.focus();
  };

  const scrollIntoView = (index) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-combobox-item]");
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  };

  const handleKeyDown = (e) => {
    const showCustom = query.trim() && !exactMatch;
    const totalItems = filtered.length + (showCustom ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (totalItems === 0) return;
      setActiveIndex((prev) => {
        const next = prev + 1 >= totalItems ? 0 : prev + 1;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (totalItems === 0) return;
      setActiveIndex((prev) => {
        const next = prev - 1 < 0 ? totalItems - 1 : prev - 1;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        selectOption(filtered[activeIndex]);
      } else if (activeIndex === filtered.length && showCustom) {
        handleSelectCustom(query);
      } else if (query.trim()) {
        handleSelectCustom(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value || "");
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700"
        >
          {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Field with Dropdown Button */}
      <div
        className={`relative flex items-center rounded-xl border bg-white transition focus-within:ring-2 focus-within:ring-violet-500/40 ${
          error
            ? "border-red-300 ring-1 ring-red-100"
            : open
            ? "border-violet-400 ring-1 ring-violet-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange?.(next, null);
            if (!open) setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Loading..." : placeholder}
          autoComplete="off"
          spellCheck="false"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none pr-16"
        />

        <div className="absolute right-2 flex items-center gap-0.5">
          {query ? (
            <button
              type="button"
              onClick={clearInput}
              title="Clear"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setOpen((prev) => !prev);
              if (!open) inputRef.current?.focus();
            }}
            title="Toggle dropdown"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                open ? "rotate-180 text-violet-600" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Floating Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-md"
            ref={listRef}
          >
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                Loading options...
              </div>
            ) : filtered.length === 0 && !query.trim() ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((opt, idx) => {
                  const optLabel = opt.label || opt.name || opt.value;
                  const isSelected =
                    (value || "").trim().toLowerCase() ===
                    optLabel.trim().toLowerCase();
                  const isHighlighted = activeIndex === idx;

                  return (
                    <button
                      key={`${optLabel}-${idx}`}
                      type="button"
                      data-combobox-item
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectOption(opt)}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        isHighlighted
                          ? "bg-violet-50 text-violet-900"
                          : isSelected
                          ? "bg-violet-50/70 text-violet-900 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {Icon && (
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                              isSelected
                                ? "bg-violet-600 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-slate-800">
                            <HighlightMatch text={optLabel} query={query} />
                          </div>
                          {opt.phone && (
                            <div className="text-[11px] text-slate-400 truncate">
                              {opt.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {opt.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              opt.badge === "Party Contact"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-violet-600" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Option to use custom value if not exact match */}
                {query.trim() && !exactMatch && (
                  <button
                    type="button"
                    data-combobox-item
                    onMouseEnter={() => setActiveIndex(filtered.length)}
                    onClick={() => handleSelectCustom(query)}
                    className={`flex w-full items-center gap-2 rounded-lg border border-dashed border-violet-200 px-3 py-2 text-left text-xs font-semibold text-violet-700 transition hover:bg-violet-50 ${
                      activeIndex === filtered.length ? "bg-violet-50" : ""
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5 text-violet-500" />
                    <span>
                      Use <span className="font-bold">"{query.trim()}"</span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
