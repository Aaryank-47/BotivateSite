"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

/**
 * Clean styled dropdown that also allows typing / filtering.
 * options: [{ value: string, label: string }]
 */
export default function Combobox({
  name,
  value = "",
  displayValue = "",
  options = [],
  onChange,
  placeholder = "Select or type...",
  disabled = false,
  error = false,
  icon: Icon = null,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // Sync visible text from parent when closed / value changes externally
  const shown = touched && open ? query : displayValue || "";

  useEffect(() => {
    if (!open) {
      setQuery(displayValue || "");
      setTouched(false);
    }
  }, [displayValue, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = (open ? query : "").trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        (o.label || "").toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    );
  }, [options, query, open]);

  const emit = (nextValue, nextLabel) => {
    onChange({
      target: {
        name,
        value: nextLabel ?? nextValue,
        // extras for parent if needed
        optionValue: nextValue,
        optionLabel: nextLabel,
      },
    });
  };

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setTouched(true);
    setQuery(displayValue || "");
  };

  const handleInput = (e) => {
    const text = e.target.value;
    setTouched(true);
    setQuery(text);
    setOpen(true);
    // Live type: pass text so parent can resolve match
    emit(text, text);
  };

  const handleSelect = (opt) => {
    setQuery(opt.label);
    setTouched(false);
    setOpen(false);
    emit(opt.value, opt.label);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && filtered.length === 1) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {Icon && (
        <Icon className="absolute z-10 w-5 h-5 text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2" />
      )}
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={shown}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={handleFocus}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={`w-full py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          Icon ? "pl-10 pr-10" : "px-4 pr-10"
        } ${error ? "border-red-300" : "border-gray-300"} ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            setOpen(true);
            setTouched(true);
            setQuery(displayValue || "");
            inputRef.current?.focus();
          } else {
            setOpen(false);
          }
        }}
        className="absolute z-10 p-1 text-gray-400 -translate-y-1/2 right-2 top-1/2 hover:text-gray-600"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg max-h-56">
          <div className="sticky top-0 flex items-center gap-2 px-3 py-2 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
            <Search className="w-3.5 h-3.5" />
            <span>Type to filter · click to select</span>
          </div>
          <ul className="overflow-y-auto max-h-48 py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">
                {query.trim()
                  ? `No match — keep typed value “${query.trim()}”`
                  : "No options"}
              </li>
            ) : (
              filtered.map((opt) => {
                const active =
                  String(opt.value) === String(value) ||
                  (opt.label || "").toLowerCase() ===
                    (displayValue || "").toLowerCase();
                return (
                  <li key={String(opt.value)}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
