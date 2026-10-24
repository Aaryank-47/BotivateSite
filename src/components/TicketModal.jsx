"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText } from "lucide-react"

export default function TicketModal({ isOpen, onClose }) {
  const [isAdmin, setIsAdmin] = useState(true)
  const [formData, setFormData] = useState({
    date: "",
    personName: "",
    postedBy: "",
    takenFrom: "",
    partyName: "",
    systemName: "",
    typeOfWork: "",
    descriptionOfWork: "",
    linkOfSystem: "",
    attachmentFile: null,
    priorityInCustomer: "",
    notes: "",
    expectedDateToClose: "",
    // Admin specific fields
    taskNo: "",
    givenDate: "",
    planned1: "",
    actual1: "",
    delay1: "",
    teamMemberName: "",
    howManyTimesTake: "",
    remarks: "",
    planned2: "",
    actual2: "",
    delay2: "",
    employeeName1: "",
    employeeName2: "",
    howManyTimeTake2: "",
    remarks2: "",
    planned3: "",
    actual3: "",
    delay3: "",
    status: "",
  })

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Handle form submission
    onClose()
  }

  const resetForm = () => {
    setFormData({
      date: "",
      personName: "",
      postedBy: "",
      takenFrom: "",
      partyName: "",
      systemName: "",
      typeOfWork: "",
      descriptionOfWork: "",
      linkOfSystem: "",
      attachmentFile: null,
      priorityInCustomer: "",
      notes: "",
      expectedDateToClose: "",
      taskNo: "",
      givenDate: "",
      planned1: "",
      actual1: "",
      delay1: "",
      teamMemberName: "",
      howManyTimesTake: "",
      remarks: "",
      planned2: "",
      actual2: "",
      delay2: "",
      employeeName1: "",
      employeeName2: "",
      howManyTimeTake2: "",
      remarks2: "",
      planned3: "",
      actual3: "",
      delay3: "",
      status: "",
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {isAdmin ? "Party System Updation and Edition Form" : "Generate New Ticket"}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      onClick={() => setIsAdmin(true)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        isAdmin ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                      }`}
                    >
                      Admin Form
                    </button>
                    <button
                      onClick={() => setIsAdmin(false)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        !isAdmin ? "bg-white/20 text-white" : "text-white/70 hover:text-white"
                      }`}
                    >
                      User Form
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {isAdmin ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Posted By <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="postedBy"
                          value={formData.postedBy}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Posted By</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Person Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="personName"
                          value={formData.personName}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Taken From <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="takenFrom"
                          value={formData.takenFrom}
                          onChange={handleInputChange}
                          placeholder="Company/Station/Other"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Party Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="partyName"
                          value={formData.partyName}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Party Name</option>
                          <option value="party1">Party 1</option>
                          <option value="party2">Party 2</option>
                          <option value="party3">Party 3</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Task Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="mr-2" size={20} />
                      Task Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type of Work <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="typeOfWork"
                          value={formData.typeOfWork}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Type of Work</option>
                          <option value="existing-system">Existing System Edit & Update</option>
                          <option value="new-system">New System</option>
                          <option value="error-received">Error Received</option>
                          <option value="complain">Complain</option>
                          <option value="call-request">Call Request</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          System Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="systemName"
                          value={formData.systemName}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter System Name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description Of Work <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="descriptionOfWork"
                          value={formData.descriptionOfWork}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          placeholder="Enter Description"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link of System</label>
                        <input
                          type="url"
                          name="linkOfSystem"
                          value={formData.linkOfSystem}
                          onChange={handleInputChange}
                          placeholder="Enter System Link"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        />

                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Enter Notes"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority and File Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority for Customer <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="priorityInCustomer"
                        value={formData.priorityInCustomer}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Date to Close <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="expectedDateToClose"
                        value={formData.expectedDateToClose}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (Optional)</label>
                      <div className="relative">
                        <input
                          type="file"
                          name="attachmentFile"
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Upload className="absolute right-3 top-3 text-gray-400" size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Admin Only Fields */}
                  {isAdmin && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Tracking Fields</h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Task No.</label>
                          <input
                            type="text"
                            name="taskNo"
                            value={formData.taskNo}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Given Date</label>
                          <input
                            type="date"
                            name="givenDate"
                            value={formData.givenDate}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      {/* Stage 1 */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Stage 1</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <input
                            type="text"
                            name="planned1"
                            value={formData.planned1}
                            onChange={handleInputChange}
                            placeholder="Planned1"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="actual1"
                            value={formData.actual1}
                            onChange={handleInputChange}
                            placeholder="Actual1"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="delay1"
                            value={formData.delay1}
                            onChange={handleInputChange}
                            placeholder="Delay1"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="teamMemberName"
                            value={formData.teamMemberName}
                            onChange={handleInputChange}
                            placeholder="Team/Member Name"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="howManyTimesTake"
                            value={formData.howManyTimesTake}
                            onChange={handleInputChange}
                            placeholder="How many time take"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <textarea
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleInputChange}
                          placeholder="Remarks"
                          rows={2}
                          className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Stage 2 */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Stage 2</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <input
                            type="text"
                            name="planned2"
                            value={formData.planned2}
                            onChange={handleInputChange}
                            placeholder="Planned2"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="actual2"
                            value={formData.actual2}
                            onChange={handleInputChange}
                            placeholder="Actual2"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="delay2"
                            value={formData.delay2}
                            onChange={handleInputChange}
                            placeholder="Delay2"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="employeeName1"
                            value={formData.employeeName1}
                            onChange={handleInputChange}
                            placeholder="Employee Name1"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="employeeName2"
                            value={formData.employeeName2}
                            onChange={handleInputChange}
                            placeholder="Employee Name2"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <input
                            type="text"
                            name="howManyTimeTake2"
                            value={formData.howManyTimeTake2}
                            onChange={handleInputChange}
                            placeholder="How Many Time Take"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <textarea
                            name="remarks2"
                            value={formData.remarks2}
                            onChange={handleInputChange}
                            placeholder="Remarks"
                            rows={1}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Stage 3 */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Stage 3</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            name="planned3"
                            value={formData.planned3}
                            onChange={handleInputChange}
                            placeholder="Planned3"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="actual3"
                            value={formData.actual3}
                            onChange={handleInputChange}
                            placeholder="Actual3"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            name="delay3"
                            value={formData.delay3}
                            onChange={handleInputChange}
                            placeholder="Delay3"
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      {isAdmin ? "Update Task" : "Submit Ticket"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="bg-green-500 text-white text-center py-2">
                <p className="text-sm font-medium">Powered by Botivate</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
