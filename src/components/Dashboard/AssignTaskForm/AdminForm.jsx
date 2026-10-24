import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Calendar,
  User,
  Building,
  Paperclip,
  FileText,
  Link,
} from "lucide-react";
import Button from "../../ui/Button";
import { PRIORITY_OPTIONS } from "../../../services/schemaApi";
import Combobox from "./Combobox";
import Select from "../shared/Select";

export default function AdminForm({
  userRole = "admin",
  formData,
  setFormData,
  handleInputChange,
  errors,
  companies,
  assignableMembers,
  takenFromUsers = [],
  workTypes,
  systems,
  isLoadingDropdowns,
  isLoadingSystems,
  handleFileChange,
  handleSubmit,
  isSubmitting,
  uploadProgress,
  additionalTasks,
  addAdditionalTask,
  removeAdditionalTask,
  updateAdditionalTask,
  handleShowAdditionalSection,
  currentUserName,
  onCancel,
}) {
  const inputCls =
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const renderAdditionalTask = (task) => (
    <div
      key={task.id}
      className="relative p-6 bg-gray-50 border border-gray-200 rounded-lg"
    >
      <button
        type="button"
        onClick={() => removeAdditionalTask(task.id)}
        className="absolute text-red-500 transition-colors top-4 right-4 hover:text-red-700"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="pr-8 space-y-4">
        <h4 className="text-base font-semibold text-gray-800">Task Details</h4>

        {/* Expected Date to Close — top */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Expected Date to Close
          </label>
          <div className="relative">
            <Calendar className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="date"
              value={task.expectedDate || ""}
              onChange={(e) =>
                updateAdditionalTask(task.id, "expectedDate", e.target.value)
              }
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Same layout as Primary: 1|2 then 3|4 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Type of Work <span className="text-red-500">*</span>
            </label>
            <Select
              value={task.typeOfWork}
              onChange={(e) =>
                updateAdditionalTask(task.id, "typeOfWork", e.target.value)
              }
              className={inputCls}
            >
              <option value="">Select Type of Work</option>
              {workTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              System Name
            </label>
            <Combobox
              name="systemName"
              value={task.systemId}
              displayValue={task.systemName || ""}
              options={systems.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              onChange={(e) =>
                updateAdditionalTask(task.id, "systemName", e.target.value)
              }
              disabled={!formData.companyId || isLoadingSystems}
              placeholder={
                !formData.companyId
                  ? "Select a Company first"
                  : isLoadingSystems
                  ? "Loading systems..."
                  : "Select or type system name"
              }
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Link of System
            </label>
            <div className="relative">
              <Link className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="url"
                value={task.link || ""}
                onChange={(e) =>
                  updateAdditionalTask(task.id, "link", e.target.value)
                }
                placeholder="https://example.com"
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Priority in Customer
            </label>
            <Select
              value={task.priority}
              onChange={(e) =>
                updateAdditionalTask(task.id, "priority", e.target.value)
              }
              className={inputCls}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Description Of Work
          </label>
          <textarea
            value={task.description}
            onChange={(e) =>
              updateAdditionalTask(task.id, "description", e.target.value)
            }
            rows={3}
            className={inputCls}
            placeholder="Describe the work..."
          />
        </div>

        {/* Attachment — last field inside additional task */}
        <div>
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
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="form-card overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
        {/* Header: title left, Posted By compact right */}
        <div className="form-header flex flex-col gap-3 px-4 py-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {(userRole === "user" || userRole === "employee")
                  ? "Create New Task"
                  : "Assign New Task"}
              </h2>
              <p className="text-sm text-gray-600">
                {(userRole === "user" || userRole === "employee")
                  ? "Fill in the details to create a new task"
                  : "Create and assign tasks to team members"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:max-w-[220px] w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
              Posted By
            </label>
            <div className="relative flex-1">
              <User className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-2.5 top-1/2" />
              <input
                type="text"
                value={currentUserName || ""}
                disabled
                className="w-full py-2 pl-8 pr-3 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 sm:p-5">
          {/* Row 1: Taken From | Company — Member 2 is assigned later in Task Table / Developer Stage */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Taken From <span className="text-red-500">*</span>
              </label>
              <Select
                name="takenFrom"
                value={formData.takenFrom}
                onChange={handleInputChange}
                disabled={isLoadingDropdowns}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.takenFrom ? "border-red-300" : "border-gray-300"
                } ${isLoadingDropdowns ? "bg-gray-100" : ""}`}
              >
                <option value="">
                  {isLoadingDropdowns ? "Loading..." : "Select person"}
                </option>
                {takenFromUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.username}
                  </option>
                ))}
              </Select>
              {errors.takenFrom && (
                <p className="mt-1 text-sm text-red-600">{errors.takenFrom}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Company <span className="text-red-500">*</span>
              </label>
              <Combobox
                name="companyName"
                value={formData.companyId}
                displayValue={formData.companyName || ""}
                options={companies.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                onChange={handleInputChange}
                disabled={isLoadingDropdowns}
                error={!!errors.companyId}
                icon={Building}
                placeholder={
                  isLoadingDropdowns ? "Loading..." : "Select or type company name"
                }
              />
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date | Expected Date to Close */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Expected Date to Close <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleInputChange}
                  className={`w-full py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.expectedDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.expectedDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expectedDate}</p>
              )}
            </div>
          </div>

          {/* Primary Task Details — fixed order */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Primary Task Details
            </h3>

            {/* Row: Type of Work | System Name */}
            <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Type of Work <span className="text-red-500">*</span>
                </label>
                <Select
                  name="typeOfWork"
                  value={formData.typeOfWork}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.typeOfWork ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Type of Work</option>
                  {workTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                {errors.typeOfWork && (
                  <p className="mt-1 text-sm text-red-600">{errors.typeOfWork}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  System Name
                </label>
                <Combobox
                  name="systemName"
                  value={formData.systemId}
                  displayValue={formData.systemName || ""}
                  options={systems.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  onChange={handleInputChange}
                  disabled={!formData.companyId || isLoadingSystems}
                  placeholder={
                    !formData.companyId
                      ? "Select a Company first"
                      : isLoadingSystems
                      ? "Loading systems..."
                      : "Select or type system name"
                  }
                />
              </div>
            </div>

            {/* Row: Link of System | Priority in Customer */}
            <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Link of System
                </label>
                <div className="relative">
                  <Link className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Priority in Customer
                </label>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Description Of Work <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the work to be done..."
                  className={`w-full py-2 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? "border-red-300" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            </div>

            {/* Attachment — last field inside same Primary Task Details section */}
            <div>
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
          </div>

          <AnimatePresence>
            {additionalTasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Additional Tasks
                </h3>
                {additionalTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    {renderAdditionalTask(task)}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleShowAdditionalSection || addAdditionalTask}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Task
            </Button>

            <div className="flex items-center gap-3">
              {uploadProgress && (
                <span className="text-sm text-blue-600">{uploadProgress}</span>
              )}
              {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-6"
              >
                Cancel
              </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Task"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}