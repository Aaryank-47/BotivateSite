"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User } from "lucide-react"
import supabase from "../../../supabaseClient.js"

import ReportStats from "./ReportStats"
import ReportFilters from "./ReportFilters"
import ReportTable from "./ReportTable"
import { exportToCSV as exportToCSVHelper, exportToPDF as exportToPDFHelper, exportCompanyDistributionPDF } from "./exportHelpers"

const ReportsPage = () => {
  const [reportsData, setReportsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userInfo, setUserInfo] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  })
  const [stats, setStats] = useState({
    totalPending: 0,
    byCompany: {},
    byPerson: {},
    todayTasks: 0,
    upcomingTasks: 0,
    overdueTasks: 0,
    companyPersonDistribution: {}
  })

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = () => {
      let userData = null
      
      const storedSession = sessionStorage.getItem('userSession')
      if (storedSession) {
        try {
          userData = JSON.parse(storedSession)
        } catch (e) {
          console.error("Error parsing session data:", e)
        }
      }
      
      if (!userData) {
        const storedUsername = localStorage.getItem('tempUsername')
        if (storedUsername) {
          userData = { username: storedUsername }
        }
      }
      
      setUserInfo(userData)
    }
    
    fetchUserInfo()
  }, [])

  // Fetch reports data from Supabase
  useEffect(() => {
    fetchReportsData()
  }, [dateRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('user_tasks')
        .select(`
          *,
          company:users!user_tasks_company_id_fkey ( id, name, company_name ),
          systems ( id, name ),
          assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username )
        `)
        .in('status', ['Pending', 'In Progress'])
        .order('created_at', { ascending: false })

      // Apply date filter if dates are selected
      if (dateRange.startDate && dateRange.endDate) {
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day

        query = query
          .gte('given_date', startDate.toISOString())
          .lte('given_date', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Normalize schema v5 rows for report UI (aliases for legacy field names)
      const normalized = (data || []).map((row) => {
        const party_name =
          row.company?.company_name ||
          row.company?.name ||
          row.companies?.name ||
          row.party_name ||
          ""
        const system_name = row.systems?.name || row.system_name || ""
        const team_member_name =
          row.assigned_member?.name ||
          row.assigned_member?.username ||
          row.team_member_name ||
          ""
        return {
          ...row,
          party_name,
          system_name,
          team_member_name,
          employee_name_1: team_member_name,
          planned3: row.expected_date_to_close || null,
          priority_in_customer: row.priority || "Medium",
        }
      })

      setReportsData(normalized)
      setFilteredData(normalized)
      
      // Calculate statistics
      calculateStats(normalized)
      
    } catch (error) {
      console.error("Error fetching reports data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const stats = {
      totalPending: data.length,
      byCompany: {},
      byPerson: {},
      todayTasks: 0,
      upcomingTasks: 0,
      overdueTasks: 0,
      companyPersonDistribution: {}
    }
    
    data.forEach(task => {
      const company = task.party_name || 'Unknown Company'
      stats.byCompany[company] = (stats.byCompany[company] || 0) + 1
      
      const person = task.employee_name_1 || task.team_member_name || 'Unassigned'
      stats.byPerson[person] = (stats.byPerson[person] || 0) + 1
      
      if (!stats.companyPersonDistribution[company]) {
        stats.companyPersonDistribution[company] = {}
      }
      stats.companyPersonDistribution[company][person] = (stats.companyPersonDistribution[company][person] || 0) + 1
      
      // Deadline from expected_date_to_close (exposed as planned3 alias)
      if (task.planned3 || task.expected_date_to_close) {
        const expectedDate = new Date(task.planned3 || task.expected_date_to_close)
        
        if (expectedDate.toDateString() === today.toDateString()) {
          stats.todayTasks++
        } else if (expectedDate > today) {
          stats.upcomingTasks++
        } else if (expectedDate < today) {
          stats.overdueTasks++
        }
      }
    })
    
    setStats(stats)
  }

  // Apply filters (search across all relevant fields; coerce to string)
  useEffect(() => {
    let filtered = [...reportsData]

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((task) => {
        const blob = [
          task.task_no,
          task.party_name,
          task.employee_name_1,
          task.team_member_name,
          task.system_name,
          task.status,
          task.priority,
          task.priority_in_customer,
          task.type_of_work,
          task.description_of_work,
          task.notes,
          task.remarks,
        ]
          .map((v) => (v == null ? "" : String(v).toLowerCase()))
          .join(" ")
        return blob.includes(query)
      })
    }

    setFilteredData(filtered)
  }, [searchQuery, reportsData])

  // Stats shown in UI follow current search filter
  const displayStats = (() => {
    if (!searchQuery || !searchQuery.trim()) return stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const s = {
      totalPending: filteredData.length,
      byCompany: {},
      byPerson: {},
      todayTasks: 0,
      upcomingTasks: 0,
      overdueTasks: 0,
      companyPersonDistribution: {},
    }
    filteredData.forEach((task) => {
      const company = task.party_name || "Unknown Company"
      s.byCompany[company] = (s.byCompany[company] || 0) + 1
      const person = task.employee_name_1 || task.team_member_name || "Unassigned"
      s.byPerson[person] = (s.byPerson[person] || 0) + 1
      if (!s.companyPersonDistribution[company]) s.companyPersonDistribution[company] = {}
      s.companyPersonDistribution[company][person] =
        (s.companyPersonDistribution[company][person] || 0) + 1
      if (task.planned3 || task.expected_date_to_close) {
        const expectedDate = new Date(task.planned3 || task.expected_date_to_close)
        if (expectedDate.toDateString() === today.toDateString()) s.todayTasks++
        else if (expectedDate > today) s.upcomingTasks++
        else if (expectedDate < today) s.overdueTasks++
      }
    })
    return s
  })()

  const handleExportToCSV = (type) =>
    exportToCSVHelper(type, displayStats, filteredData, filteredData)
  const handleExportToPDF = () =>
    exportToPDFHelper(displayStats, filteredData, dateRange, filteredData)
  const handleExportCompanyPDF = () =>
    exportCompanyDistributionPDF(displayStats, filteredData, dateRange)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Distribution Reports</h1>
              <p className="text-gray-600 mt-2">
                View task distribution by company and person with deadline analysis
              </p>
            </div>
            
            {userInfo && (
              <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userInfo.role || 'user'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ReportFilters 
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          exportToPDF={handleExportToPDF}
          exportToCSV={handleExportToCSV}
        />

        <ReportStats stats={displayStats} />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredData.length}</span> tasks
            {dateRange.startDate && dateRange.endDate && 
              ` for ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
            }
          </p>
        </div>

        <ReportTable 
          stats={displayStats}
          reportsData={filteredData}
          exportToCSV={handleExportToCSV}
          exportToPDF={handleExportCompanyPDF}
        />
        
      </motion.div>
    </div>
  )
}

export default ReportsPage
