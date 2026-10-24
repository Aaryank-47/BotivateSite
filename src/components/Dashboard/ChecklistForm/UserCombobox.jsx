"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, Check, X, Search, UserPlus } from "lucide-react";

// Harmonious avatar color palettes based on name hash
const AVATAR_PALETTES = [
  { bg: "bg-emerald-100 text-emerald-800 ring-emerald-200/70" },
  { bg: "bg-teal-100 text-teal-800 ring-teal-200/70" },
  { bg: "bg-cyan-100 text-cyan-800 ring-cyan-200/70" },
  { bg: "bg-indigo-100 text-indigo-800 ring-indigo-200/70" },
  { bg: "bg-violet-100 text-violet-800 ring-violet-200/70" },
  { bg: "bg-sky-100 text-sky-800 ring-sky-200/70" },
  { bg: "bg-rose-100 text-rose-800 ring-rose-200/70" },
  { bg: "bg-amber-100 text-amber-800 ring-amber-200/70" },
];

function getAvatarPalette(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Highlights matches within the text
 */
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
      <span className="font-bold text-emerald-600 underline decoration-emerald-300 decoration-2 underline-offset-2">
        {match}
      </span>
      {after}
    </span>
  );
}

export default function UserCombobox({
  value = "",
  onChange,
  users = [],
  loading = false,
  placeholder = "Select or type name",
  error = false,
  className = "",
  id = "checklist-user-combobox",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered list based on current input text
  const filteredUsers = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(q) || username.includes(q) || role.includes(q);
    });
  }, [users, value]);

  // Is the current input an exact match for one of the users?
  const exactMatch = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return null;
    return users.find(
      (u) =>
        (u.name || "").toLowerCase() === q ||
        (u.username || "").toLowerCase() === q
    );
  }, [users, value]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((prev) => {
        const total = filteredUsers.length + (value.trim() && !exactMatch ? 1 : 0);
        if (total === 0) return -1;
        const next = prev + 1 >= total ? 0 : prev + 1;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => {
        const total = filteredUsers.length + (value.trim() && !exactMatch ? 1 : 0);
        if (total === 0) return -1;
        const next = prev - 1 < 0 ? total - 1 : prev - 1;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredUsers.length) {
        selectUser(filteredUsers[activeIndex]);
      } else if (value.trim()) {
        // select as custom name
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const scrollIndexIntoView = (index) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-combobox-item]");
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  };

  const selectUser = (u) => {
    const chosenName = u.name || u.username || "";
    onChange(chosenName);
    setOpen(false);
    inputRef.current?.focus();
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div
        className={`group relative flex items-center rounded-xl border bg-white transition shadow-sm ${
          error
            ? "border-red-300 ring-2 ring-red-100"
            : open
            ? "border-emerald-400 ring-2 ring-emerald-500/25 shadow-emerald-500/5"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        {/* Left icon */}
        <div className="pointer-events-none pl-3.5 pr-1 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
          <User className="h-4 w-4" />
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Loading team members…" : placeholder}
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-transparent py-2.5 pl-1.5 pr-16 text-sm text-slate-800 placeholder-slate-400 outline-none"
        />

        {/* Right Action Icons */}
        <div className="absolute right-2 flex items-center gap-0.5">
          {value ? (
            <button
              type="button"
              onClick={clearSelection}
              title="Clear input"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                open ? "rotate-180 text-emerald-600" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-md"
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Search className="h-3 w-3 text-slate-400" />
                Team Members
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-medium">
                {filteredUsers.length} available
              </span>
            </div>

            {/* List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
            >
              {loading ? (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-200" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-28 rounded bg-slate-200" />
                        <div className="h-2 w-16 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    No team member found
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    You can still use this as a custom doer name.
                  </p>
                </div>
              ) : (
                filteredUsers.map((u, i) => {
                  const userName = u.name || u.username || "";
                  const isSelected =
                    userName.toLowerCase() === (value || "").trim().toLowerCase();
                  const isKeyboardActive = activeIndex === i;
                  const palette = getAvatarPalette(userName);
                  const initials = getInitials(userName);

                  return (
                    <button
                      key={u.id || i}
                      data-combobox-item
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectUser(u)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-emerald-50/90 text-emerald-950 font-medium"
                          : isKeyboardActive
                          ? "bg-slate-100/80 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 transition ${palette.bg}`}
                        >
                          {initials}
                          {u.is_active !== false && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                          )}
                        </div>

                        {/* Text info */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-800">
                            <HighlightMatch text={userName} query={value} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            {u.role && (
                              <span className="capitalize font-normal">
                                {u.role}
                              </span>
                            )}
                            {u.role && u.username && u.username !== u.name && (
                              <span>•</span>
                            )}
                            {u.username && u.username !== u.name && (
                              <span className="truncate">@{u.username}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selected checkmark or subtle arrow */}
                      {isSelected && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}

              {/* Custom typed name option */}
              {value.trim() && !exactMatch && (
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    data-combobox-item
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpen(false);
                      inputRef.current?.blur();
                    }}
                    onMouseEnter={() => setActiveIndex(filteredUsers.length)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                      activeIndex === filteredUsers.length
                        ? "bg-emerald-50 text-emerald-900"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <UserPlus className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="text-slate-400">Use custom name: </span>
                      <span className="font-semibold text-emerald-700">
                        &ldquo;{value.trim()}&rdquo;
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
