import { useState, useRef, useEffect, useLayoutEffect, Children, isValidElement, Fragment } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

/** Flatten <option> children (incl. fragments / mapped arrays) into {value,label,disabled}. */
function collectOptions(children, out = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) return collectOptions(child.props.children, out);
    if (child.type !== "option") return;
    const label = Children.toArray(child.props.children).join("");
    out.push({
      value: String(child.props.value ?? label),
      label,
      disabled: !!child.props.disabled,
    });
  });
  return out;
}

/**
 * Drop-in replacement for a native <select> with a styled popup list.
 * Same API: value, onChange(e) with e.target.value, disabled, className, <option> children.
 * `searchable` turns the box itself into a text input: typing in it filters the list.
 */
export default function Select({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  name,
  title,
  id,
  accent = "blue",
  searchable = false,
  searchPlaceholder = "Search...",
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const options = collectOptions(children);
  const current = String(value ?? "");
  const selected = options.find((o) => o.value === current) || options[0];
  const isPlaceholder = selected && selected.value === "";

  // while searching, hide the placeholder option and keep labels that contain the text
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.value !== "" && o.label.toLowerCase().includes(q)) : options;

  const openMenu = (initialQuery = "") => {
    setQuery(initialQuery);
    setActive(initialQuery ? 0 : options.findIndex((o) => o.value === current));
    setOpen(true);
  };

  const place = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuH = Math.min(260, options.length * 38 + 8);
    const below = window.innerHeight - r.bottom;
    const up = below < menuH + 12 && r.top > below;
    setRect({
      left: r.left,
      right: window.innerWidth - r.right,
      alignRight: r.left > window.innerWidth / 2,
      width: r.width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      maxH: Math.max(120, Math.min(260, (up ? r.top : below) - 16)),
    });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (opt) => {
    if (opt.disabled) return;
    setOpen(false);
    (searchable ? searchRef : btnRef).current?.focus();
    if (opt.value !== current) {
      onChange?.({ target: { value: opt.value, name }, currentTarget: { value: opt.value, name } });
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    // in the search input, space types a space instead of opening / picking
    const inSearch = e.target === searchRef.current;
    const openKeys = inSearch ? ["ArrowDown", "ArrowUp", "Enter"] : ["ArrowDown", "ArrowUp", "Enter", " "];
    if (!open && openKeys.includes(e.key)) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!shown.length) return;
      const dir = e.key === "ArrowDown" ? 1 : -1;
      let i = active;
      do i = (i + dir + shown.length) % shown.length;
      while (shown[i].disabled && i !== active);
      setActive(i);
    } else if (e.key === "Enter" || (e.key === " " && !inSearch)) {
      e.preventDefault();
      if (shown[active]) pick(shown[active]);
    } else if (e.key === "Tab") setOpen(false);
  };

  const openRing = open
    ? accent === "emerald"
      ? "ring-2 ring-emerald-500/30 border-emerald-400"
      : "ring-2 ring-blue-500/30 border-blue-400"
    : "";
  const chevron = (
    <ChevronDown
      className={`absolute w-4 h-4 text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 transition-transform ${
        open ? "rotate-180" : ""
      }`}
    />
  );

  return (
    <>
      {searchable ? (
        // the box itself is the search input: closed it shows the selection, open it filters the list
        <div
          ref={btnRef}
          title={title}
          style={{ paddingRight: "2.25rem" }}
          className={`relative bg-white ${className} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"} ${openRing}`}
          onMouseDown={(e) => {
            if (disabled || e.target === searchRef.current) return;
            e.preventDefault();
            searchRef.current?.focus();
          }}
          onClick={() => !disabled && !open && openMenu()}
        >
          <input
            ref={searchRef}
            id={id}
            name={name}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            value={open ? query : isPlaceholder ? "" : (selected?.label ?? "")}
            placeholder={open && !isPlaceholder ? selected?.label : open ? searchPlaceholder : (selected?.label ?? "")}
            onChange={(e) => {
              if (!open) openMenu(e.target.value);
              else {
                setQuery(e.target.value);
                setActive(0);
              }
            }}
            onKeyDown={onKeyDown}
            className="w-full p-0 text-inherit bg-transparent border-0 outline-none truncate placeholder:text-gray-400 focus:ring-0 disabled:cursor-not-allowed"
          />
          {chevron}
        </div>
      ) : (
      <button
        ref={btnRef}
        id={id}
        type="button"
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        style={{ paddingRight: "2.25rem" }}
        className={`relative text-left bg-white ${className} ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${openRing}`}
      >
        <span className={`block truncate ${isPlaceholder ? "text-gray-400" : ""}`}>{selected?.label ?? ""}</span>
        {chevron}
      </button>
      )}

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: rect.alignRight ? undefined : rect.left,
              right: rect.alignRight ? rect.right : undefined,
              width: "max-content",
              minWidth: Math.max(rect.width, searchable ? 220 : 0),
              maxWidth: "min(480px, calc(100vw - 16px))",
              top: rect.top,
              bottom: rect.bottom,
              maxHeight: rect.maxH,
            }}
            className="z-[200] flex flex-col overflow-hidden bg-white border border-gray-200 shadow-xl rounded-xl ring-1 ring-black/5"
          >
            <ul role="listbox" className="py-1 overflow-y-auto">
              {searchable && !shown.length && (
                <li className="px-3 py-2 mx-1 text-sm text-gray-400">No match</li>
              )}
              {shown.map((o, i) => {
                const isSel = o.value === current;
                return (
                  <li
                    key={`${o.value}-${i}`}
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 mx-1 text-sm rounded-lg ${
                      o.disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : i === active
                          ? accent === "emerald"
                            ? "bg-emerald-50 text-emerald-800 cursor-pointer"
                            : "bg-blue-50 text-blue-700 cursor-pointer"
                          : isSel
                            ? "bg-gray-50 text-gray-900 cursor-pointer"
                            : "text-gray-700 cursor-pointer"
                    } ${isSel ? "font-semibold" : ""} ${o.value === "" ? "text-gray-400" : ""}`}
                  >
                    <span className="whitespace-normal break-words">{o.label}</span>
                    {isSel && (
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          accent === "emerald" ? "text-emerald-600" : "text-blue-600"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
