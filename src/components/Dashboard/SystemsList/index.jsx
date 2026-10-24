"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Server,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

import Button from "../../ui/Button"

import ExpandableText from "../shared/ExpandableText";
import DataTable from "../shared/DataTable";
import { getStatusColor } from "../../../utils/statusHelpers"
import SystemDetailsModal from "./SystemDetailsModal"
import { useCalculateTotalUpdate, useTotalUpdate } from "./hooks"
import { dataCache, isQuickCacheValid, fetchSupabaseDataCached } from "./cache"
import { processSystemsData } from "./dataProcessing"
import supabase from "../../../supabaseClient"
import Select from "../shared/Select";

const DEFAULT_ITEMS_PER_PAGE = 50

// Maps the UI sort keys used by the header controls to the actual row fields
const SORT_FIELD_MAP = {
  systemName: "system_name",
  partyName: "party_name",
  departmentName: "description_of_work",
  typeOfSystem: "type_of_work",
}

export default function SystemsList({ userRole: propUserRole, companyData }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [sortField, setSortField] = useState("systemName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [systems, setSystems] = useState([])

  const [companyName, setCompanyName] = useState(companyData?.companyName || "")
  const [userRole, setUserRole] = useState(propUserRole || "company")
  const [activeTab, setActiveTab] = useState("inprogress")
  const [fmsData, setFmsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingData, setPendingData] = useState([])
  const [completeData, setCompleteData] = useState([])

  // Pagination state (1-indexed, tracked separately per tab)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1)
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)
  // Latest request id per type, used to ignore stale responses from rapid page clicks
  const pageRequestId = useRef({ pending: 0, completed: 0 })
  const [pendingTotal, setPendingTotal] = useState(0)
  const [completedTotal, setCompletedTotal] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const { getTotalUpdate, getUpdateData } = useCalculateTotalUpdate(completeData);

  // Fetch counts efficiently (head: true)
  const fetchCounts = async () => {
    try {
      const [pendingResult, completedResult, totalResult] = await Promise.all([
        supabase.from("user_tasks").select("*", { count: "exact", head: true }).in("status", ["Pending", "In Progress"]),
        supabase.from("user_tasks").select("*", { count: "exact", head: true }).eq("status", "Completed").eq("type_of_work", "New System"),
        supabase.from("user_tasks").select("*", { count: "exact", head: true }),
      ])
      setPendingTotal(pendingResult.count || 0)
      setCompletedTotal(completedResult.count || 0)
      setTotalCount(totalResult.count || 0)
    } catch (err) {
      console.error("Error fetching counts:", err)
    }
  }

  // Page-indexed fetch for a specific type. `page` is 0-indexed; the loaded rows
  // REPLACE that tab's data. `pageSize` is passed explicitly so callers that just
  // changed itemsPerPage don't read a stale value from this closure.
  // Returns the rows, or null if a newer request for the same type superseded this one.
  const fetchPagedData = async (type, page, pageSize = itemsPerPage) => {
    const requestId = ++pageRequestId.current[type]
    const from = page * pageSize
    const to = from + pageSize - 1

    let query = supabase.from("user_tasks").select(`
      *,
      company:users!user_tasks_company_id_fkey ( id, name, company_name ),
      systems ( id, name ),
      assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username )
    `)

    if (type === "pending") {
      query = query.in("status", ["Pending", "In Progress"])
    } else {
      query = query.eq("status", "Completed").eq("type_of_work", "New System")
    }

    const { data, error } = await query.order("id", { ascending: false }).range(from, to)
    if (error) throw error

    const rows = (data || []).map(row => ({
      ...row,
      party_name: row.company?.name || row.company?.company_name || "",
      system_name: row.systems?.name || row.system_name || "",
      team_member_name:
        row.assigned_member?.name ||
        row.assigned_member?.username ||
        "",
      type_of_system: row.type_of_work || "",
      status_of_system: row.status || "",
      status: type === "pending" ? "Pending" : "Completed"
    }))

    // A newer request for this tab was issued while this one was in flight - drop it
    if (requestId !== pageRequestId.current[type]) return null

    if (type === "pending") {
      setPendingData(rows)
    } else {
      setCompleteData(rows)
    }

    return rows
  }

  // Initial fetch (page 1 of both tabs)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true)
        setError(null)
        setPendingCurrentPage(1)
        setCompletedCurrentPage(1)
        await fetchCounts()
        await Promise.all([
          fetchPagedData("pending", 0, itemsPerPage),
          fetchPagedData("completed", 0, itemsPerPage),
        ])
      } catch (err) {
        setError(err.message)
        console.error("Error fetching FMS data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
  }, [])

  // Active-tab pagination values
  const activeType = activeTab === "completed" ? "completed" : "pending"
  const currentPage = activeType === "pending" ? pendingCurrentPage : completedCurrentPage
  const totalResults = activeType === "pending" ? pendingTotal : completedTotal
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage))

  // Prev/next page: fetch that page (replacing the tab's data), then move the page pointer
  const handlePageChange = async (newPage) => {
    const type = activeType
    if (newPage < 1 || newPage > totalPages) return
    setPageLoading(true)
    try {
      const rows = await fetchPagedData(type, newPage - 1, itemsPerPage)
      if (rows === null) return // superseded by a newer request
      if (type === "pending") {
        setPendingCurrentPage(newPage)
      } else {
        setCompletedCurrentPage(newPage)
      }
    } catch (err) {
      console.error("Error fetching page:", err)
    } finally {
      setPageLoading(false)
    }
  }

  // Page size change: itemsPerPage is shared by both tabs, so reset BOTH tabs to
  // page 1 and refetch page 0 with the new size (keeps the inactive tab consistent too)
  const handleItemsPerPageChange = async (n) => {
    setItemsPerPage(n)
    setPageLoading(true)
    try {
      const [pendingRows, completedRows] = await Promise.all([
        fetchPagedData("pending", 0, n),
        fetchPagedData("completed", 0, n),
      ])
      if (pendingRows !== null) setPendingCurrentPage(1)
      if (completedRows !== null) setCompletedCurrentPage(1)
    } catch (err) {
      console.error("Error changing page size:", err)
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    if (propUserRole) {
      setUserRole(propUserRole)
    }
    if (companyData?.companyName) {
      setCompanyName(companyData.companyName)
    }
  }, [propUserRole, companyData])

  useEffect(() => {
    if (!propUserRole && !companyData) {
      setUserRole("company")
      setCompanyName("")
    }
  }, [])

  const fetchSystemsData = useCallback(async () => {
    if (isQuickCacheValid() && dataCache.quickCache.systems) {
      setSystems(dataCache.quickCache.systems)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [systemData] = await Promise.all([
        fetchSupabaseDataCached("FMS")
      ])

      const processedSystems = processSystemsData(systemData, userRole, companyName)

      dataCache.quickCache = {
        systems: processedSystems,
        lastCached: Date.now()
      }

      setSystems(processedSystems)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching systems data:', err)
    } finally {
      setLoading(false)
    }
  }, [userRole, companyName])

  useEffect(() => {
    fetchSystemsData()
    const interval = setInterval(fetchSystemsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSystemsData])

  const filteredPending = userRole === "company"
    ? pendingData.filter(row => row.party_name === companyData?.companyName)
    : pendingData

  const filteredCompleted = userRole === "company"
    ? completeData.filter(row => row.party_name === companyData?.companyName)
    : completeData

  const currentSystems = activeTab === "inprogress"
    ? filteredPending
    : filteredCompleted

  const { filteredSystems, uniqueTypes, uniqueStatuses } = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()

    const filtered = currentSystems.filter((system) => {
      const matchesSearch = !searchTerm || (
        system.system_name?.toLowerCase().includes(searchLower) ||
        system.description_of_work?.toLowerCase().includes(searchLower) ||
        system.party_name?.toLowerCase().includes(searchLower) ||
        system.type_of_work?.toLowerCase().includes(searchLower)
      )

      const matchesType = !filterType || system.type_of_work === filterType
      const matchesStatusFilter = !filterStatus || system.status === filterStatus

      return matchesSearch && matchesType && matchesStatusFilter
    })

    const types = [...new Set(filtered.map(s => s.type_of_work).filter(Boolean))]
    const statuses = [...new Set(filtered.map(s => s.status).filter(Boolean))]

    return {
      filteredSystems: filtered,
      uniqueTypes: types,
      uniqueStatuses: statuses
    }
  }, [currentSystems, searchTerm, filterType, filterStatus, activeTab])

  // Search/filter + sort applied within the currently loaded page
  const sortedSystems = useMemo(() => {
    const getValue = (row) => {
      if (sortField === "totalUpdation") return getTotalUpdate(row);
      const value = row[SORT_FIELD_MAP[sortField] || sortField];
      return value === null || value === undefined ? "" : value;
    };

    return [...filteredSystems].sort((a, b) => {
      let aValue = getValue(a);
      let bValue = getValue(b);

      if (sortField === "lastUpdate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue === bValue) return 0;
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredSystems, sortField, sortDirection, getTotalUpdate]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField, sortDirection])

  const handleViewSystem = useCallback((system) => {
    const totalUpdates = getTotalUpdate(system);
    const updateData = getUpdateData(system);

    setSelectedSystem({
      ...system,
      totalUpdates,
      updateData
    });
    setShowSystemModal(true);
  }, [getTotalUpdate, getUpdateData]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "inprogress":
      case "in progress":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "completed":
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "maintenance":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "development":
        return <Server className="w-4 h-4 text-blue-500" />
      case "inactive":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Server className="w-4 h-4 text-gray-500" />
    }
  }

  // Sortable header label (clickable, shows the current sort direction)
  const sortableLabel = (label, field) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center space-x-1 uppercase tracking-wider hover:text-blue-600"
    >
      <span>{label}</span>
      {sortField === field && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
    </button>
  )

  const isCompletedTab = activeTab === "completed"
  const showSystemNameCol = userRole === "admin" || userRole === "company"
  const showPartyNameCol = userRole === "admin"

  // Column set mirrors the old <th> list, including the tab/role-conditional columns
  const HEADERS = [
    { label: "S.No.", width: "4rem" },
    ...(isCompletedTab ? [{ label: "Actions", width: "6rem" }] : []),
    ...(showSystemNameCol ? [{ label: sortableLabel("System Name", "systemName"), width: "12rem" }] : []),
    ...(showPartyNameCol ? [{ label: sortableLabel("Party Name", "partyName"), width: "10rem" }] : []),
    { label: sortableLabel("Department Name", "departmentName"), width: "10rem" },
    { label: sortableLabel("Type of System", "typeOfSystem"), width: "9rem" },
    { label: "Status", width: "7rem" },
    ...(isCompletedTab ? [{ label: sortableLabel("Total Updation", "totalUpdation"), width: "8rem" }] : []),
  ]

  const pageOffset = (currentPage - 1) * itemsPerPage

  const renderRow = (system, index) => (
    <motion.tr
      key={system.id ?? index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05 }}
      className="hover:bg-gray-50"
    >
      <td className="px-3 py-4 text-center align-middle">
        <div className="text-sm font-medium text-gray-900">{pageOffset + index + 1}</div>
      </td>
      {isCompletedTab && (
        <td className="px-3 py-4 text-center align-middle">
          <div className="flex items-center justify-center">
            <Button
              onClick={() => handleViewSystem(system)}
              variant="outline"
              className="flex items-center bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
            >
              <span>View</span>
            </Button>
          </div>
        </td>
      )}
      {showSystemNameCol && (
        <td className="px-3 py-4 text-center align-middle">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 mt-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Server className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 break-words leading-relaxed" title={system.system_name}>
                {system.system_name}
              </div>
              <div className="text-xs text-gray-500 break-words">{system.developer || 'System Admin'}</div>
            </div>
          </div>
        </td>
      )}
      {showPartyNameCol && (
        <td className="px-3 py-4 overflow-hidden text-center align-middle">
          <div className="text-sm text-gray-900 truncate" title={system.party_name}>
            {system.party_name}
          </div>
        </td>
      )}
      <td className="px-3 py-4 overflow-hidden text-center align-middle">
        <div className="text-sm text-gray-900 truncate leading-relaxed">
          <ExpandableText text={system.description_of_work} />
        </div>
      </td>
      <td className="px-3 py-4 text-center align-middle">
        <div className="text-sm text-gray-900 break-words" title={system.type_of_work}>
          <div className="line-clamp-2">
            {system.type_of_work}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-center align-middle">
        <div className="flex items-center">
          {getStatusIcon(system.status)}
          <span
            className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
          >
            {system.status || 'In Progress'}
          </span>
        </div>
      </td>
      {isCompletedTab && (
        <td className="px-3 py-4 text-center align-middle">
          <div className="text-sm text-gray-900">
            {getTotalUpdate(system)}
          </div>
        </td>
      )}
    </motion.tr>
  )

  const renderCard = (system, index) => (
    <div key={system.id ?? index} className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
            {system.system_name || "Unknown System"}
          </span>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{system.party_name || "—"}</p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}>
          {system.status || 'Progress'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Developer</span>
          <span className="font-semibold text-gray-900">{system.developer || 'System Admin'}</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Type</span>
          <span className="font-semibold text-gray-900">{system.type_of_work || "—"}</span>
        </div>
        {isCompletedTab && (
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Updation</span>
            <span className="font-semibold text-gray-900">{getTotalUpdate(system)}</span>
          </div>
        )}
        <div className="col-span-2">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
          <div className="font-semibold text-gray-900">
            <ExpandableText text={system.description_of_work} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button
          onClick={() => handleViewSystem(system)}
          variant="outline"
          className="flex items-center space-x-1 bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs"
        >
          <span>View Details</span>
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-gray-100 pb-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <div className="h-10 w-full max-w-xs bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 flex-1 max-w-[180px] bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse hidden sm:block" />
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse hidden md:block" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-red-800 font-medium">Error Loading Data</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button
          onClick={fetchSystemsData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Systems List</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and monitor all your systems {userRole === "admin" ? "(Admin View)" : `for ${companyName}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500">In Progress</div>
              <div className="text-lg font-semibold text-yellow-600">{pendingTotal}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-lg font-semibold text-green-600">{completedTotal}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-semibold text-blue-600">{totalCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="">All Type of work</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Single Table with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inprogress')}
              className={`flex-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-r border-gray-200 ${activeTab === 'inprogress'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">In Progress</span>
                </div>
                <span className="sm:hidden text-xs text-center">In Progress</span>
                <span className="bg-yellow-100 text-yellow-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                  {filteredPending.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'completed'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Completed</span>
                </div>
                <span className="sm:hidden text-xs text-center">Completed</span>
                <span className="bg-green-100 text-green-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                  {filteredCompleted.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        <style jsx>{`
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    max-height: calc(2 * 1.4em);
  }
`}</style>

        <div
          className={`flex flex-col flex-1 min-h-0 transition-opacity ${pageLoading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <DataTable
            headers={HEADERS}
            data={sortedSystems}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="min-w-[1000px]"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalResults={totalResults}
          />
        </div>
      </div>

      {/* System Details Modal */}
      {showSystemModal && selectedSystem && (
        <SystemDetailsModal
          system={selectedSystem}
          onClose={() => {
            setShowSystemModal(false)
            setSelectedSystem(null)
          }}
        />
      )}
    </div>
  )
}
