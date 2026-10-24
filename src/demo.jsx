

"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Eye,
  ExternalLink,
  Server,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
  Code,
  Zap,
  Shield,
  Bug,
  Sparkles,
  Loader,
  FileText,
  Database,
  Activity,
} from "lucide-react"
import Button from "../ui/Button"
import supabase from "../../supabaseClient"
import Select from "./components/Dashboard/shared/Select";

// Google Sheets API configuration
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzG8CyTBV-lk2wQ0PKjhrGUnBKdRBY-tkFVz-6GzGcbXqdEGYF0pWyfCl0BvGfVhi0/exec"
const SHEET_ID = "1FI822cXWCrELlxq09D-HPQtQE0t7bWPAacJZMsWD3Vc"

// ✅ ENHANCED CACHING SYSTEM
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes
const QUICK_CACHE_TIME = 2 * 1000 // 2 seconds for instant UI
const PROCESSING_CACHE_TIME = 30 * 1000 // 30 seconds for processed data

// Global cache objects
let dataCache = {
  fmsData: null,
  systemListData: null,
  lastFetched: 0,
  quickCache: {
    systems: null,
    processedData: null,
    lastCached: 0
  },
  processingCache: new Map()
}

// ✅ Cache validation functions
const isCacheValid = () => {
  return dataCache.fmsData && dataCache.systemListData &&
    (Date.now() - dataCache.lastFetched) < CACHE_EXPIRY_TIME
}

const isQuickCacheValid = () => {
  return dataCache.quickCache.systems &&
    (Date.now() - dataCache.quickCache.lastCached) < QUICK_CACHE_TIME
}

const isProcessingCacheValid = (cacheKey) => {
  const cached = dataCache.processingCache.get(cacheKey)
  return cached && (Date.now() - cached.timestamp) < PROCESSING_CACHE_TIME
}

// ✅ Optimized fetch functions with caching
// ✅ Optimized fetch functions with caching
const fetchSupabaseDataCached = async (tableName) => {
  if (isCacheValid()) {
    
    return tableName === "FMS" ? dataCache.fmsData : dataCache.systemListData
  }

  

  try {
    let { data, error } = await supabase
    .from(tableName)
    .select("*")

    if (error) throw error
    if (!data) throw new Error("No data received")

    // Cache the fresh data
    if (tableName === "FMS") {
      dataCache.fmsData = { data }
    } else if (tableName === "SystemList") {
      dataCache.systemListData = { data }
    }

    if (dataCache.fmsData && dataCache.systemListData) {
      dataCache.lastFetched = Date.now()
    }

    return { data }
  } catch (error) {
    console.error(`Error fetching ${tableName} data:`, error)
    throw error
  }
}


// Utility functions
const normalizeString = (str) => {
  return str ? str.toString().toLowerCase().trim() : ''
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [companyName, setCompanyName] = useState(companyData?.companyName || "")
  const [userRole, setUserRole] = useState(propUserRole || "company")
  const [activeTab, setActiveTab] = useState("inprogress")

  // Update role and company when props change
  useEffect(() => {
    if (propUserRole) {
      setUserRole(propUserRole)
      
    }
    if (companyData?.companyName) {
      setCompanyName(companyData.companyName)
      
    }
  }, [propUserRole, companyData])

  // Simulate getting company name from login context (fallback)
  useEffect(() => {
    if (!propUserRole && !companyData) {
      
      setUserRole("company")
      setCompanyName("")
    }
  }, [])

// ✅ Optimized data processing function with caching
const processSystemsData = useCallback((systemData, userRole, companyName) => {
  const cacheKey = `${userRole}_${companyName}_${systemData?.data?.length || 0}`

  if (isProcessingCacheValid(cacheKey)) {
    
    return dataCache.processingCache.get(cacheKey).data
  }

  
  const startTime = performance.now()

  if (!systemData?.data) {
    throw new Error("Invalid data format received")
  }

  let resultSystems = []

  if (userRole === "admin") {
    // Deduplicate based on system_name + party_name
    const uniqueSystems = systemData.data.filter((row, index, self) =>
      index === self.findIndex(r =>
        (r.system_name?.trim().toLowerCase() || "na") === (row.system_name?.trim().toLowerCase() || "na") &&
        (r.party_name?.trim().toLowerCase() || "na") === (row.party_name?.trim().toLowerCase() || "na")
      )
    )

    resultSystems = uniqueSystems.map((row, index) => {
      const systemName = row.system_name?.trim() || "N/A"
      const systemPartyName = row.party_name?.trim() || "N/A"

      // Match all systemData rows with same system + party
      const matchingSystemRecords = systemData.data.filter(sysRow =>
        sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
        sysRow.party_name?.toLowerCase().trim() === systemPartyName.toLowerCase()
      )

      // Count "existing system edit & update"
      const existingSystemEditCount = matchingSystemRecords.filter(sys =>
        (sys.type_of_system || "").toLowerCase().includes("existing system edit & update")
      ).length

      // ✅ Convert raw data to the expected format for the modal
      const formattedSystemData = matchingSystemRecords.map(sysRow => ({
        // Map raw Supabase fields to the expected modal fields
        partyName: sysRow.party_name || "N/A",
        systemName: sysRow.system_name || "N/A",
        typeOfSystem: sysRow.type_of_system || "N/A", // ✅ Correct mapping
        descriptionOfWork: sysRow.department_name || "N/A", // ✅ Correct mapping
        actualSubmitDate: sysRow.actual1 || "N/A",
        expectedDateToClose: sysRow.expected_date_to_close || "N/A",
        takenFrom: sysRow.taken_from || "N/A",
        priority: sysRow.priority_in_customer || "N/A",
        assignedTo: sysRow.team_member_name || "N/A",
        workStatus: sysRow.status || "N/A", // ✅ Correct mapping
        remarks: sysRow.remarks || "N/A",
      }))

      return {
        id: row.id,
        sno: index + 1,
        systemName,
        partyName: row.party_name || "N/A",
        departmentName: row.department_name || "N/A",
        typeOfSystem: row.type_of_system || "N/A", // ✅ Use raw field name
        status: row.status_of_system || "",
        totalUpdation: row.total_updation || "N/A",
        flowchart: row.flowchart || "N/A",
        version: row.total_updation || "v1.0.0",
        lastUpdate: new Date().toISOString().split("T")[0],
        url: row.website_link || `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
        description: `${row.type_of_system || "System"} for ${row.department_name || "department"} department`,
        technology: "Web Application",
        developer: "System Admin",
        systemData: formattedSystemData,   // ✅ Use formatted data instead of raw
        existingSystemEditCount,
      }
    })
  } else {
    // Company view - filter only company systems
    

    const companyKey = normalizeString(companyName)

    resultSystems = systemData.data
      .filter(systemRow => normalizeString(systemRow.party_name) === companyKey)
      .map((row, index) => {
        const systemName = row.system_name?.trim() || "N/A"
        const partyName = row.party_name?.trim() || "N/A"

        const matchingSystemRecords = systemData.data.filter(sysRow =>
          sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
          sysRow.party_name?.toLowerCase().trim() === partyName.toLowerCase()
        )

        const existingSystemEditCount = matchingSystemRecords.filter(sys =>
          (sys.type_of_system || "").toLowerCase().includes("existing system edit & update")
        ).length

        // ✅ Convert raw data to the expected format for the modal
        const formattedSystemData = matchingSystemRecords.map(sysRow => ({
          // Map raw Supabase fields to the expected modal fields
          partyName: sysRow.party_name || "N/A",
          systemName: sysRow.system_name || "N/A",
          typeOfSystem: sysRow.type_of_system || "N/A", // ✅ Correct mapping
          descriptionOfWork: sysRow.department_name || "N/A", // ✅ Correct mapping
          actualSubmitDate: sysRow.actual1 || "N/A",
          expectedDateToClose: sysRow.expected_date_to_close || "N/A",
          takenFrom: sysRow.taken_from || "N/A",
          priority: sysRow.priority_in_customer || "N/A",
          assignedTo: sysRow.team_member_name || "N/A",
          workStatus: sysRow.status || "N/A", // ✅ Correct mapping
          remarks: sysRow.remarks || "N/A",
          flowchart:sysRow.flowchart
        }))

        return {
          id: row.id,
          sno: index + 1,
          systemName,
          partyName,
          descriptionOfWork: row.department_name || "N/A",
          typeOfSystem: row.type_of_system || "N/A", // ✅ Use raw field name
          status: row.status_of_system || "",
          totalUpdation: row.total_updation || "N/A",
          flowchart: row.flowchart || "N/A",
          version: row.total_updation || "v1.0.0",
          lastUpdate: new Date().toISOString().split("T")[0],
          url: row.website_link || `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
          description: `${row.type_of_system || "System"} for ${row.department_name || "department"} department`,
          technology: "Web Application",
          developer: "System Admin",
          systemData: formattedSystemData,   // ✅ Use formatted data instead of raw
          existingSystemEditCount,
        }
      })
  }

  // ✅ Cache processed result
  dataCache.processingCache.set(cacheKey, {
    data: resultSystems,
    timestamp: Date.now(),
  })

  if (dataCache.processingCache.size > 5) {
    const oldestKey = dataCache.processingCache.keys().next().value
    dataCache.processingCache.delete(oldestKey)
  }

  
  return resultSystems
}, [])





const fetchSystemsData = useCallback(async () => {
  // ⚡ INSTANT UI with quick cache
  if (isQuickCacheValid() && dataCache.quickCache.systems) {
    
    setSystems(dataCache.quickCache.systems)
    setLoading(false)
    return
  }

  try {
    setLoading(true)
    setError(null)

    
    

    // Fetch system_list from Supabase
    
   const [systemData] = await Promise.all([
  fetchSupabaseDataCached("system_list")  // only system_list
])
 
// process only systemData
const processedSystems = processSystemsData(systemData, userRole, companyName)


   

    // ✅ Now pass [] instead of fmsData
   

    // ✅ UPDATE QUICK CACHE
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
}, [userRole, companyName, processSystemsData])


  // ✅ OPTIMIZED useEffect with caching
  useEffect(() => {
    
    fetchSystemsData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSystemsData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSystemsData])

  // Memoized filtered systems for better performance with updated logic
// Memoized filtered systems for better performance  
// Memoized filtered systems for better performance  
const { inProgressSystems, completedSystems, uniqueTypes, uniqueStatuses } = useMemo(() => {
  const searchLower = searchTerm.toLowerCase()

  const filtered = systems.filter((system) => {
    const matchesSearch = !searchTerm || (
      system.systemName.toLowerCase().includes(searchLower) ||
      system.departmentName.toLowerCase().includes(searchLower) ||
      system.partyName.toLowerCase().includes(searchLower)
    )

    const matchesType = !filterType || system.typeOfSystem === filterType
    const matchesStatusFilter = !filterStatus || system.status === filterStatus

    return matchesSearch && matchesType && matchesStatusFilter
  })

  // Filter for New System type (Column D)
  const newSystems = filtered.filter(system => {
    const typeOfSystem = system.typeOfSystem ? system.typeOfSystem.toLowerCase() : ''
    return typeOfSystem.includes('new system')
  })

  // In progress systems - Column E is blank or "InProgress" AND is New System
  const inProgress = newSystems.filter(system => {
    const status = system.status ? system.status.toLowerCase() : ''
    const isInProgress = status === '' || 
                         status === 'inprogress' || 
                         status === 'in progress' || 
                         status === 'pending' || 
                         !system.status || 
                         system.status.trim() === ''
    
    return isInProgress
  })

  // Completed systems - Column E is "Completed" AND is New System
  const completed = newSystems.filter(system => {
    const status = system.status ? system.status.toLowerCase() : ''
    return status === 'completed'
  })

  // System names को unique बनाने के लिए (for both tabs)
  const uniqueInProgress = []
  const seenInProgressNames = new Set()
  inProgress.forEach(system => {
    const systemNameKey = system.systemName.toLowerCase().trim()
    if (!seenInProgressNames.has(systemNameKey)) {
      seenInProgressNames.add(systemNameKey)
      uniqueInProgress.push(system)
    }
  })

  const uniqueCompleted = []
  const seenCompletedNames = new Set()
  completed.forEach(system => {
    const systemNameKey = system.systemName.toLowerCase().trim()
    if (!seenCompletedNames.has(systemNameKey)) {
      seenCompletedNames.add(systemNameKey)
      uniqueCompleted.push(system)
    }
  })

  const types = [...new Set(systems.map(system => system.typeOfSystem).filter(Boolean))]
  const statuses = [...new Set(systems.map(system => system.status).filter(Boolean))]

  return {
    inProgressSystems: uniqueInProgress,
    completedSystems: uniqueCompleted,
    uniqueTypes: types,
    uniqueStatuses: statuses
  }
}, [systems, searchTerm, filterType, filterStatus])


  // Get current systems based on active tab
  const currentSystems = activeTab === 'inprogress' ? inProgressSystems : completedSystems

  // Memoized sorted systems
  const sortedSystems = useMemo(() => {
    return [...currentSystems].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "lastUpdate") {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [currentSystems, sortField, sortDirection])

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }, [sortField, sortDirection])

  const handleViewSystem = useCallback((system) => {
    setSelectedSystem(system)
    setShowSystemModal(true)
  }, [])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "inprogress":
      case "in progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "development":
        return "bg-blue-100 text-blue-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "inprogress":
      case "in progress":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
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

  // ✅ OPTIMIZED LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600 text-sm">Loading systems data...</span>
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
    <div className="space-y-6">
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
              <div className="text-lg font-semibold text-yellow-600">{inProgressSystems.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-lg font-semibold text-green-600">{completedSystems.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-semibold text-blue-600">{systems.length}</div>
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
                  {inProgressSystems.length}
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
                  {completedSystems.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
       <div className="hidden sm:block overflow-x-auto relative" style={{ maxHeight: '70vh' }}>
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
          S.No.
        </th>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
          Actions
        </th>
        {(userRole === "admin" || userRole === "company") && (
          <th
            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-48"
            onClick={() => handleSort("systemName")}
          >
            <div className="flex items-center space-x-1">
              <span>System Name</span>
              {sortField === "systemName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </div>
          </th>
        )}
        {userRole === "admin" && (
          <th
            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-40"
            onClick={() => handleSort("partyName")}
          >
            <div className="flex items-center space-x-1">
              <span>Party Name</span>
              {sortField === "partyName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </div>
          </th>
        )}
        <th
          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-40"
          onClick={() => handleSort("departmentName")}
        >
          <div className="flex items-center space-x-1">
            <span>Department Name</span>
            {sortField === "departmentName" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
        <th
          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-36"
          onClick={() => handleSort("typeOfSystem")}
        >
          <div className="flex items-center space-x-1">
            <span>Type of System</span>
            {sortField === "typeOfSystem" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
          Status
        </th>
        <th
          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
          onClick={() => handleSort("totalUpdation")}
        >
          <div className="flex items-center space-x-1">
            <span>Total Updation</span>
            {sortField === "totalUpdation" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
        <th
          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
          onClick={() => handleSort("flowchart")}
        >
          <div className="flex items-center space-x-1">
            <span>Flowchart</span>
            {sortField === "flowchart" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
          </div>
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {sortedSystems.length === 0 ? (
        <tr>
          <td colSpan={userRole === "admin" ? "9" : "8"} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center space-y-2">
              {activeTab === 'inprogress' ? (
                <Clock className="w-12 h-12 text-gray-400" />
              ) : (
                <CheckCircle className="w-12 h-12 text-gray-400" />
              )}
              <h3 className="text-gray-900 font-medium text-base">
                No {activeTab === 'inprogress' ? 'in progress' : activeTab} systems found
              </h3>
              <p className="text-gray-500 text-sm">No systems match your current filters.</p>
            </div>
          </td>
        </tr>
      ) : (
        sortedSystems.map((system, index) => (
          <motion.tr
            key={system.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="hover:bg-gray-50"
          >
            <td className="px-3 py-4 w-16">
              <div className="text-sm font-medium text-gray-900">{index + 1}</div>
            </td>
            <td className="px-3 py-4 w-24">
              <div className="flex items-center">
                <Button
                  onClick={() => handleViewSystem(system)}
                  variant="outline"
                  className="flex items-center bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-2 py-1 text-xs"
                >
                  <span>View</span>
                </Button>
              </div>
            </td>
            {(userRole === "admin" || userRole === "company") && (
              <td className="px-3 py-4 w-48">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 mt-1">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Server className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 break-words leading-relaxed" title={system.systemName}>
                      {system.systemName}
                    </div>
                    <div className="text-xs text-gray-500 break-words">{system.developer || 'System Admin'}</div>
                  </div>
                </div>
              </td>
            )}
            {userRole === "admin" && (
              <td className="px-3 py-4 w-40">
                <div className="text-sm text-gray-900 break-words" title={system.partyName}>
                  <div className="line-clamp-2">
                    {system.partyName}
                  </div>
                </div>
              </td>
            )}
            <td className="px-3 py-4 w-40">
              <div className="text-sm text-gray-900 break-words leading-relaxed" title={system.departmentName}>
                {system.departmentName}
              </div>
            </td>
            <td className="px-3 py-4 w-36">
              <div className="text-sm text-gray-900 break-words" title={system.typeOfSystem}>
                <div className="line-clamp-2">
                  {system.typeOfSystem}
                </div>
              </div>
            </td>
            <td className="px-3 py-4 w-28">
              <div className="flex items-center">
                {getStatusIcon(system.status)}
                <span
                  className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
                >
                  {system.status || 'In Progress'}
                </span>
              </div>
            </td>
            <td className="px-3 py-4 w-32">
              <div className="text-sm text-gray-900">{system.totalUpdation}</div>
            </td>
            <td className="px-3 py-4 w-28">
              <div className="text-sm text-gray-900">{system.flowchart}</div>
            </td>
          </motion.tr>
        ))
      )}
    </tbody>
  </table>
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

        {/* Mobile Card View */}
        <div className="sm:hidden" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {sortedSystems.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center space-y-2">
                {activeTab === 'inprogress' ? (
                  <Clock className="w-8 h-8 text-gray-400" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                )}
                <h3 className="text-gray-900 font-medium text-sm">
                  No {activeTab === 'inprogress' ? 'in progress' : activeTab} systems found
                </h3>
                <p className="text-gray-500 text-xs">No systems match your current filters.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {sortedSystems.map((system, index) => (
                <motion.div
                  key={system.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header with S.No and Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        #{system.sno}
                      </span>
                      <div className="flex items-center">
                        {getStatusIcon(system.status)}
                        <span
                          className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
                        >
                          {system.status || 'Progress'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Updates</div>
                      <div className="text-sm font-semibold text-gray-900">{system.totalUpdation}</div>
                    </div>
                  </div>

                  {/* System Info */}
                  <div className="space-y-2 mb-3">
                    {userRole === "admin" && (
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Server className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-600 text-sm">{system.systemName}</h4>
                          <p className="text-xs text-gray-500">{system.developer || 'System Admin'}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Party:</span> {system.partyName}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Department:</span> {system.departmentName}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Type:</span>
                        <span className="text-green-600 font-medium ml-1">{system.typeOfSystem}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Flowchart:</span> {system.flowchart}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleViewSystem(system)}
                      variant="outline"
                      className="flex items-center space-x-1 bg-transparent border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs"
                    >
                      <span>View</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's already in a different format, try to parse it
      const parts = dateString.split(/[-/.]/);
      if (parts.length === 3) {
        // Assume it's yyyy-mm-dd or dd-mm-yyyy or similar
        let day, month, year;
        if (parts[0].length === 4) {
          // yyyy-mm-dd format
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // dd-mm-yyyy or mm-dd-yyyy format
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }

        // Convert to 2-digit format
        if (year.length === 4) {
          year = year.slice(-2);
        }

        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      return dateString; // Return original if can't parse
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Return original if error
  }
};

function SystemDetailsModal({ system, onClose }) {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "inprogress":
      case "in progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "development":
        return "bg-blue-100 text-blue-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

 function getWorkStatusColor(status) {
  const safeStatus = status ? status.toString().trim().toLowerCase() : "";

  switch (safeStatus) {
    case "completed":
      return "bg-green-200 text-green-800";
    case "in progress":
      return "bg-blue-200 text-blue-800";
    case "pending":
      return "bg-yellow-200 text-yellow-800";
    case "cancelled":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-800"; // fallback for undefined/unknown
  }
}



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
                <h2 className="text-2xl font-semibold text-gray-900">{system.systemName}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {system.typeOfSystem} • {system.departmentName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Updates</div>
                <div className="text-2xl font-bold text-gray-900">{system.systemData?.length || 0}</div>
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
              <span>System Updation ({system.systemData?.length || 0})</span>
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
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.partyName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">Department:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.departmentName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <span className="text-gray-600 font-medium text-xs sm:text-sm">System Type:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{system.typeOfSystem}</span>
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
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{system.totalUpdation}</span>
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
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{system.description}</p>
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
                {system.existingSystemEditCount > 0 && (
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                    Edit & Update: {system.existingSystemEditCount}
                  </div>
                )}
              </div>

              {  system.systemData.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            S.No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Party Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            System Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Type of System
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Description of Work
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Actual Submit Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Taken From
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Work Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {system.systemData.map((fmsItem, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              <div className="font-medium" title={fmsItem.party_name}>
                                {fmsItem.partyName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              <div className="font-medium text-blue-600" title={fmsItem.systemName}>
                                {fmsItem.systemName || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                            <div
  className={`font-medium ${
    (fmsItem.typeOfSystem || "")
      .toLowerCase()
      .includes("existing system edit & update")
      ? "text-orange-600"
      : "text-green-600"
  }`}
  title={fmsItem.typeOfSystem}
>
  {fmsItem.typeOfSystem || "N/A"}
</div>

                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 max-w-xs">
                              <div className="truncate" title={fmsItem.descriptionOfWork}>
                                {fmsItem.descriptionOfWork}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                <span>{formatDate(fmsItem.actualSubmitDate)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                              <div title={fmsItem.takenFrom}>
                                {fmsItem.takenFrom}
                              </div>
                            </td>
                          <td className="px-4 py-3 text-sm border-r border-gray-200">
  <span
    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getWorkStatusColor(
      fmsItem?.workStatus
    )}`}
  >
    {fmsItem?.workStatus || "N/A"}
  </span>
</td>

                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={fmsItem.remarks}>
                                {fmsItem.remarks}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-3 p-3">
                    {system.systemData.map((fmsItem, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header with S.No and Status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              #{index + 1}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getWorkStatusColor(fmsItem.workStatus)}`}>
                              {fmsItem.workStatus}
                            </span>
                          {(fmsItem.typeOfSystem || "").toLowerCase().includes("existing system edit & update") && (
  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
    Edit & Update
  </span>
)}

                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(fmsItem.actualSubmitDate)}
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-2">
                          {/* Party & System Info */}
                          <div>
                            <h4 className="font-semibold text-blue-600 text-sm mb-1">{fmsItem.systemName}</h4>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Party:</span> {fmsItem.partyName}
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Type:</span>
                            <span
  className={`font-medium ml-1 ${
    (fmsItem.typeOfSystem || "")
      .toLowerCase()
      .includes("existing system edit & update")
      ? "text-orange-600"
      : "text-green-600"
  }`}
>
  {fmsItem.typeOfSystem || "N/A"}
</span>
    </p>
                          </div>

                          {/* Description */}
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Work Description:</p>
                            <p className="text-xs text-gray-800 bg-gray-50 p-2 rounded border">
                              {fmsItem.descriptionOfWork}
                            </p>
                          </div>

                          {/* Bottom Info */}
                          <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">From:</span> {fmsItem.takenFrom}
                              </p>
                            </div>
                            {fmsItem.remarks && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500 font-medium">Remarks:</p>
                                <p className="text-xs text-gray-700 max-w-32 truncate" title={fmsItem.remarks}>
                                  {fmsItem.remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Database className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h4 className="text-gray-900 font-medium text-sm sm:text-lg mb-1 sm:mb-2">No System Updation Data Available</h4>
                  <p className="text-gray-500 text-xs sm:text-sm px-4">No updation records found for this system.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

