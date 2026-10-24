import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, User, Paperclip } from "lucide-react";
import Button from "../../ui/Button";
import { PRIORITY_OPTIONS } from "../../../services/schemaApi";
import Combobox from "./Combobox";
import Select from "../shared/Select";

export default function CompanyForm({
  formData,
  handleInputChange,
  handleFileChange,
  errors,
  systems,
  workTypes,
  isLoadingSystems,
  handleSubmit,
  isSubmitting,
  uploadProgress,
  additionalTasks,
  addAdditionalTask,
  removeAdditionalTask,
  updateAdditionalTask,
  currentCompanyName,
  currentUserName,
  onCancel,
}) {
  const fieldCls = (hasError) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? "border-red-300" : "border-gray-300"
    }`;

  const renderCompanyTaskForm = (task, index, isMain = false) => {
    const get = (key) => (isMain ? formData[key] : task[key]);
    const set = (key, value) => {
      if (isMain) {
        handleInputChange({ target: { name: key, value } });
      } else {
        updateAdditionalTask(task.id, key, value);
      }
    };
    const onChange = (key) => (e) => {
      if (isMain) handleInputChange(e);
      else updateAdditionalTask(task.id, key, e.target.value);
    };

    return (
      <div
        key={isMain ? "main-company" : `company-task-${task.id}`}
        className="p-5 mb-3 rounded-lg bg-gray-50 border border-gray-100"
      >
        <div className={`flex items-center justify-between mb-3 ${isMain ? "task-heading-main" : ""}`}>
          <h3 className="text-lg font-semibold text-gray-900">
            Task {index + 1}
          </h3>
          {!isMain && (
            <button
              type="button"
              onClick={() => removeAdditionalTask(task.id)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Type of Work */}
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Type of Work {isMain && <span className="text-red-500">*</span>}
            </label>
            <Select
              name={isMain ? "typeOfWork" : undefined}
              value={get("typeOfWork") || ""}
              onChange={onChange("typeOfWork")}
              className={fieldCls(isMain && errors.typeOfWork)}
            >
              <option value="">Select Type of Work</option>
              {workTypes?.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            {isMain && errors.typeOfWork && (
              <p className="mt-1 text-sm text-red-600">{errors.typeOfWork}</p>
            )}
          </div>

          {/* Given Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name={isMain ? "date" : undefined}
              value={get("date") || ""}
              onChange={onChange("date")}
              className={fieldCls(false)}
            />
          </div>

          {/* Expected Date To Close */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Expected Date To Close
            </label>
            <input
              type="date"
              name={isMain ? "expectedDate" : undefined}
              value={get("expectedDate") || ""}
              onChange={onChange("expectedDate")}
              className={fieldCls(false)}
            />
          </div>

          {/* System Name — clean dropdown + type */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              System Name
            </label>
            <Combobox
              name={isMain ? "systemName" : "systemName"}
              value={get("systemId") || ""}
              displayValue={get("systemName") || ""}
              options={systems.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              onChange={onChange("systemName")}
              disabled={isLoadingSystems}
              placeholder={
                isLoadingSystems ? "Loading systems..." : "Select or type system name"
              }
            />
          </div>

          {/* Link Of System (swapped with Priority) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Link Of System
            </label>
            <input
              type="url"
              name={isMain ? "link" : undefined}
              value={get("link") || ""}
              onChange={onChange("link")}
              placeholder="https://..."
              className={fieldCls(false)}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description Of Work {isMain && <span className="text-red-500">*</span>}
            </label>
            <textarea
              name={isMain ? "description" : undefined}
              value={get("description") || ""}
              onChange={onChange("description")}
              rows={3}
              placeholder="Describe the issue or request"
              className={fieldCls(isMain && errors.description)}
            />
            {isMain && errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Priority (swapped with Link Of System) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Priority
            </label>
            <Select
              name={isMain ? "priority" : undefined}
              value={get("priority") || "Medium"}
              onChange={onChange("priority")}
              className={fieldCls(false)}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          {/* Attachment — last field inside same task card (main task only) */}
          {isMain && (
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Attachment File
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Max 10MB - Images, PDF, Word, Excel, Text files)
                </span>
              </label>
              <div className="relative">
                <Paperclip className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.attachment && (
                <p className="mt-2 text-sm text-green-600 break-all">
                  ✓ Selected: {formData.attachment.name} (
                  {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 shadow-lg rounded-xl"
      >
        {/* Header: title left, Posted By compact right — matches AdminForm */}
        <div className="flex flex-col gap-3 px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Generate New Ticket
            </h2>
            {currentCompanyName && (
              <p className="mt-0.5 text-sm text-gray-600">
                Company: {currentCompanyName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:max-w-[220px] w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
              Posted By
            </label>
            <div className="relative flex-1">
              <User className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-2.5 top-1/2" />
              <input
                type="text"
                value={currentUserName || currentCompanyName || ""}
                disabled
                className="w-full py-2 pl-8 pr-3 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {renderCompanyTaskForm(formData, 0, true)}

          <AnimatePresence>
            {additionalTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderCompanyTaskForm(task, index + 1, false)}
              </motion.div>
            ))}
          </AnimatePresence>

          {isSubmitting && uploadProgress && (
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 -ml-1 text-blue-500 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-blue-700">{uploadProgress}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              onClick={addAdditionalTask}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              ADD TASK
            </Button>
            <div className="flex items-center gap-3">
              {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-6 py-2 rounded-lg"
              >
                Cancel
              </Button>
              )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-8 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "SUBMITTING..."
                : `SUBMIT TICKET${
                    additionalTasks.length > 0
                      ? ` (${additionalTasks.length + 1} Tasks)`
                      : ""
                  }`}
            </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
