import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Server, X, Activity, Database, Calendar, ExternalLink, FileText } from "lucide-react"
import { formatDate } from "../../../utils/dateFormatters"
import { getStatusColor, getWorkStatusColor } from "../../../utils/statusHelpers"
import ExpandableText from "../shared/ExpandableText"
import DataTable from "../shared/DataTable"

const UPDATE_HEADERS = [
  "S.No.",
  "Party Name",
  "System Name",
  "Type of System",
  "Description of Work",
  "Actual Submit Date",
  "Taken From",
  "Work Status",
  "Remarks",
]

export default function SystemDetailsModal({ system, onClose }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [totalUpdateCount, setTotalUpdateCount] = useState(system.totalUpdates || 0);
  // Pagination for the (typically small, single-system) update records table.
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  useEffect(() => {
    setTotalUpdateCount(system.totalUpdates || 0);
  }, [system.totalUpdates]);

  // Get the update data for this system
  const updateData = system.updateData || [];

  const totalUpdatePages = Math.max(1, Math.ceil(updateData.length / itemsPerPage));
  const paginatedUpdateData = useMemo(
    () => updateData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [updateData, currentPage, itemsPerPage]
  );

  const renderUpdateRow = (fmsItem, index) => {
    const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
    return (
      <tr key={fmsItem.id ?? index} className="hover:bg-blue-50 transition-colors">
        <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 whitespace-nowrap align-middle">
          {serialNumber}
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 align-middle">
          <div className="font-medium" title={fmsItem.party_name}>
            {fmsItem.party_name}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 align-middle">
          <div className="font-medium text-blue-600" title={fmsItem.system_name}>
            {fmsItem.system_name || 'N/A'}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 align-middle">
          <div
            className={`font-medium ${(fmsItem.type_of_work || "")
                .toLowerCase()
                .includes("existing system edit & update")
                ? "text-orange-600"
                : "text-green-600"
              }`}
            title={fmsItem.type_of_work}
          >
            {fmsItem.type_of_work || "N/A"}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 max-w-xs align-middle">
          <ExpandableText text={fmsItem.description_of_work} />
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 whitespace-nowrap align-middle">
          <div className="flex items-center justify-center">
            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
            <span>{formatDate(fmsItem.actual3)}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 align-middle">
          <div title={fmsItem.taken_from}>
            {fmsItem.taken_from}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-sm align-middle">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getWorkStatusColor(
              fmsItem?.status
            )}`}
          >
            {fmsItem?.status || "N/A"}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-900 max-w-xs align-middle">
          <div className="truncate" title={fmsItem.remarks}>
            {fmsItem.remarks}
          </div>
        </td>
      </tr>
    );
  };

  const renderUpdateCard = (fmsItem, index) => (
    <div key={fmsItem.id ?? index} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {fmsItem.system_name || "Unknown System"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{fmsItem.party_name || "—"}</p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getWorkStatusColor(fmsItem.status)}`}>
          {fmsItem.status || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type of Work</span>
          <span className="font-semibold text-gray-900">{fmsItem.type_of_work || "N/A"}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</span>
          <span className="font-semibold text-gray-900">{formatDate(fmsItem.actual3)}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
          <div className="font-semibold text-gray-900">
            <ExpandableText text={fmsItem.description_of_work} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{system.system_name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {system.type_of_work} • {system.description_of_work}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Updates</div>
                <div className="text-2xl font-bold text-gray-900">{totalUpdateCount}</div>
              </div>
              {system.existingSystemEditCount > 0 && (
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Edit & Update</div>
                  <div className="text-2xl font-bold text-orange-600">{system.existingSystemEditCount}</div>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Activity className="w-4 h-4" />
              <span>System Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("systemUpdation")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "systemUpdation"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Database className="w-4 h-4" />
              <span>System Updation ({updateData.length || 0})</span>
            </button>
          </nav>
        </div>

        <div className="p-3 sm:p-6 max-h-96 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* System Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                      <Server className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                      <span className="hidden sm:inline">System Information</span>
                      <span className="sm:hidden">System Info</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Party Name:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.party_name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Department:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.description_of_work}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">System Type:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.type_of_work}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Status:</span>
                        <span
                          className={`px-2 py-1 sm:px-3 sm:py-1 text-xs font-medium rounded-full ${getStatusColor(system.status)} w-fit`}
                        >
                          {system.status || 'In Progress'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Total Updates:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{totalUpdateCount}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Flowchart:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{system.flowchart}</span>
                      </div>
                      {system.existingSystemEditCount > 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-gray-600 font-medium text-xs sm:text-sm">Edit & Update Count:</span>
                          <span className="font-semibold text-orange-600 text-xs sm:text-sm">{system.existingSystemEditCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-600" />
                      Description
                    </h4>
                    <div className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                      <ExpandableText text={system.description_of_work} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 sm:p-4 border border-green-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                      <span className="hidden sm:inline">System Metrics</span>
                      <span className="sm:hidden">Metrics</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Technology:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.technology || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Version:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{system.version || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-600" />
                      <span className="hidden sm:inline">Quick Actions</span>
                      <span className="sm:hidden">Actions</span>
                    </h4>
                    <div className="space-y-2">
                      {system.url && system.url !== 'N/A' && (
                        <a
                          href={system.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-xs sm:text-sm font-medium transition-colors p-2 rounded-md hover:bg-purple-100"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Visit System</span>
                        </a>
                      )}
                      {(!system.url || system.url === 'N/A') && (
                        <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm p-2">
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>No URL available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "systemUpdation" && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  <span className="hidden sm:inline">System Updation Records</span>
                  <span className="sm:hidden">Update Records</span>
                </h3>
                {updateData.length > 0 && (
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                    Edit & Update: {updateData.length}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <DataTable
                  headers={UPDATE_HEADERS}
                  data={paginatedUpdateData}
                  renderRow={renderUpdateRow}
                  renderCard={renderUpdateCard}
                  minWidth="min-w-[900px]"
                  currentPage={currentPage}
                  totalPages={totalUpdatePages}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
                  totalResults={updateData.length}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
