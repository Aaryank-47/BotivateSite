"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Plus } from "lucide-react"
import Select from "./Dashboard/shared/Select";

const UserTicketForm = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([{ id: 1 }])
  const [formData, setFormData] = useState({
    date: "",
    personName: "",
    tasks: [
      {
        typeOfWork: "",
        systemName: "",
        descriptionOfWork: "",
        linkOfSystem: "",
        notes: "",
        expectedDateToClose: "",
        priorityForCustomer: "",
        uploadFile: null,
      },
    ],
  })

  const handleInputChange = (e, taskIndex = null) => {
    const { name, value, type, files } = e.target

    if (taskIndex !== null) {
      const updatedTasks = [...formData.tasks]
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        [name]: type === "file" ? files[0] : value,
      }
      setFormData({ ...formData, tasks: updatedTasks })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const addTask = () => {
    const newTask = {
      typeOfWork: "",
      systemName: "",
      descriptionOfWork: "",
      linkOfSystem: "",
      notes: "",
      expectedDateToClose: "",
      priorityForCustomer: "",
      uploadFile: null,
    }
    setTasks([...tasks, { id: tasks.length + 1 }])
    setFormData({
      ...formData,
      tasks: [...formData.tasks, newTask],
    })
  }

  const removeTask = (taskIndex) => {
    if (tasks.length > 1) {
      const updatedTasks = tasks.filter((_, index) => index !== taskIndex)
      const updatedFormTasks = formData.tasks.filter((_, index) => index !== taskIndex)
      setTasks(updatedTasks)
      setFormData({ ...formData, tasks: updatedFormTasks })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    onClose()
  }

  const resetForm = () => {
    setTasks([{ id: 1 }])
    setFormData({
      date: "",
      personName: "",
      tasks: [
        {
          typeOfWork: "",
          systemName: "",
          descriptionOfWork: "",
          linkOfSystem: "",
          notes: "",
          expectedDateToClose: "",
          priorityForCustomer: "",
          uploadFile: null,
        },
      ],
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Generate New Ticket</h2>
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
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Person Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="personName"
                        value={formData.personName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter Person Name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  {tasks.map((task, taskIndex) => (
                    <div key={task.id} className="bg-gray-50 p-6 rounded-lg border relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-blue-600">Task {taskIndex + 1}</h3>
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(taskIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Work <span className="text-red-500">*</span></label>
                          <Select
                            name="typeOfWork"
                            value={formData.tasks[taskIndex]?.typeOfWork || ""}
                            onChange={(e) => handleInputChange(e, taskIndex)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select Type of Work</option>
                            <option value="existing-system">Existing System Edit & Update</option>
                            <option value="new-system">New System</option>
                            <option value="error-received">Error Received</option>
                            <option value="complain">Complain</option>
                            <option value="call-request">Call Request</option>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">System Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="systemName"
                            value={formData.tasks[taskIndex]?.systemName || ""}
                            onChange={(e) => handleInputChange(e, taskIndex)}
                            required
                            placeholder="Enter System Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description Of Work <span className="text-red-500">*</span></label>
                        <textarea
                          name="descriptionOfWork"
                          value={formData.tasks[taskIndex]?.descriptionOfWork || ""}
                          onChange={(e) => handleInputChange(e, taskIndex)}
                          required
                          rows={4}
                          placeholder="Enter Description"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Link of System</label>
                          <input
                            type="url"
                            name="linkOfSystem"
                            value={formData.tasks[taskIndex]?.linkOfSystem || ""}
                            onChange={(e) => handleInputChange(e, taskIndex)}
                            placeholder="Enter System Link"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Date To Close <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            name="expectedDateToClose"
                            value={formData.tasks[taskIndex]?.expectedDateToClose || ""}
                            onChange={(e) => handleInputChange(e, taskIndex)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority for Customer <span className="text-red-500">*</span></label>
                          <Select
                            name="priorityForCustomer"
                            value={formData.tasks[taskIndex]?.priorityForCustomer || ""}
                            onChange={(e) => handleInputChange(e, taskIndex)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">Select Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (Optional)</label>
                          <div className="relative">
                            <input
                              type="file"
                              name="uploadFile"
                              onChange={(e) => handleInputChange(e, taskIndex)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <Upload className="absolute right-3 top-3 text-gray-400" size={20} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          name="notes"
                          value={formData.tasks[taskIndex]?.notes || ""}
                          onChange={(e) => handleInputChange(e, taskIndex)}
                          rows={3}
                          placeholder="Enter Notes"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Add Task Button */}
                      <div className="flex justify-center mt-6">
                        <button
                          type="button"
                          onClick={addTask}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Plus size={16} />
                          <span>ADD TASK</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      SUBMIT TICKET
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

export default UserTicketForm
