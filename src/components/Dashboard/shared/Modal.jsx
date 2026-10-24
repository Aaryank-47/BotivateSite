import { X } from "lucide-react";

/** Minimal centered modal used by the task / testing pop-up forms. */
export default function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 content-start overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600";

export function Field({ label, children, full = false, required = false }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block mb-1 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function ReadOnlyField({ label, value }) {
  return (
    <Field label={label}>
      <input className={inputClass} value={value || ""} disabled readOnly />
    </Field>
  );
}
