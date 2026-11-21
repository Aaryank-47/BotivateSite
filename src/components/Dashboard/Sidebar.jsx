"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import supabase from "../../supabaseClient"
import { fetchPendingCounts } from "../../services/schemaApi"
import { subscribeCounts, countForTab, onCountsRefresh } from "../../utils/sidebarCounts"
import { setCookie } from "../../utils/jwt"
import {
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Settings,
  Building2,
  User,
  Shield,
  Bot,
  Sparkles,
  CalendarDays,
  UserPlus,
  ClipboardList,
  LayoutList,
  ChevronDown,
  Package,
  ClipboardCheck,
  FlaskConical,
  ShieldCheck,
  Send,
  FileCheck2,
  CalendarCheck,
} from "lucide-react"

const settingsChildIds = ["add-user", "add-company"]
const orderChildIdsAll = ["order-list", "system-approvals", "assign-tester", "tester", "approval-delivery", "inform-customer"]

const Sidebar = ({ activeTab, setActiveTab, onClose, isMobile, user, userFilterData, companyData }) => {
  const [userPermissions, setUserPermissions] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [delegationOpen, setDelegationOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [stageCounts, setPendingCounts] = useState({})
  const [pageCounts, setPageCounts] = useState({})
  useEffect(() => subscribeCounts(setPageCounts), [])
  // stage counts are fetched here; page counts are reported by the pages themselves
  const badgeFor = (id) => (id in stageCounts ? stageCounts[id] : countForTab(pageCounts, id))

  // Function to get dynamic tab label based on user role
  const getTabLabel = (tabId, userRole) => {
    // Role-specific label for the assign-task tab
    if (tabId === "assign-task") {
      const role = (userRole || "").toLowerCase()
      if (role === "company") return "Generate New Ticket"
      if (role === "user" || role === "employee" || role === "hod") return "Create Task"
      // admin, superadmin
      return "Assign Task"
    }

    // Default labels for all other cases
    const defaultLabels = {
      "overview": "Dashboard",
      "assign-task": "Assign Task",
      "tasks-table": "Tasks Table",
      "pending-tasks": "Pending Tasks",
      "completed-tasks": "Completed Tasks",
      "assign-tester": "Assign Tester",
      "tester": "Tester",
      "approval-delivery": "Approval For Delivery",
      "inform-customer": "Inform to Customer",
      "troubleshoot": "Troubleshoot",
      "ai-helper": "AI System Consultant",
      "reports": "Reports",
      "delegation": "Delegation",
      "delegation-form": "Delegation Form",
      "delegation-tasks": "Delegation Tasks",
      "checklist-assign": "Assign Task",
      "checklist-pending": "Pending Task",
      "pc-page": "PC Page",
      "add-user": "Add User",
      "add-company": "Add Company",
      "holidays": "Holidays",
      "order-list": "Order List",
      "mis-tasks": "MIS Tasks",
      "meeting": "Meeting",
      "company-systems": "My Systems",
      "company-tasks": "My Tasks",
      "company-profile": "Company Profile",
      "system-approvals": "System Approvals"
    }

    return defaultLabels[tabId] || "Unknown"
  }

  // All available tabs with their identifiers (labels will be dynamic)
  const getAllTabs = (userRole) => [
    { id: "pc-page", label: getTabLabel("pc-page", userRole), icon: LayoutList, key: "pc-page" },
    { id: "overview", label: getTabLabel("overview", userRole), icon: BarChart3, key: "dashboard" },
    { id: "assign-task", label: getTabLabel("assign-task", userRole), icon: Plus, key: "assign-task" },
    { id: "tasks-table", label: getTabLabel("tasks-table", userRole), icon: FileText, key: "tasks-table" },
    { id: "pending-tasks", label: getTabLabel("pending-tasks", userRole), icon: Clock, key: "pending-tasks" },
    { id: "completed-tasks", label: getTabLabel("completed-tasks", userRole), icon: CheckCircle, key: "completed-tasks" },
    { id: "assign-tester", label: getTabLabel("assign-tester", userRole), icon: ClipboardCheck, key: "assign-tester" },
    { id: "tester", label: getTabLabel("tester", userRole), icon: FlaskConical, key: "tester" },
    { id: "approval-delivery", label: getTabLabel("approval-delivery", userRole), icon: ShieldCheck, key: "approval-delivery" },
    { id: "inform-customer", label: getTabLabel("inform-customer", userRole), icon: Send, key: "inform-customer" },
    { id: "system-approvals", label: getTabLabel("system-approvals", userRole), icon: FileCheck2, key: "system-approvals" },
    { id: "checklist-assign", label: getTabLabel("checklist-assign", userRole), icon: UserPlus, key: "checklist-assign" },
    { id: "checklist-pending", label: getTabLabel("checklist-pending", userRole), icon: ClipboardList, key: "checklist-pending" },
    { id: "delegation-form", label: getTabLabel("delegation-form", userRole), icon: UserPlus, key: "delegation-form" },
    { id: "delegation-tasks", label: getTabLabel("delegation-tasks", userRole), icon: ClipboardList, key: "delegation-tasks" },
    { id: "troubleshoot", label: getTabLabel("troubleshoot", userRole), icon: Settings, key: "troubleshoot" },
    { id: "ai-helper", label: getTabLabel("ai-helper", userRole), icon: Bot, key: "ai-helper" },
    { id: "reports", label: getTabLabel("reports", userRole), icon: BarChart3, key: "reports" },
    { id: "holidays", label: getTabLabel("holidays", userRole), icon: CalendarDays, key: "holidays" },
    { id: "add-user", label: getTabLabel("add-user", userRole), icon: UserPlus, key: "add-user" },
    { id: "add-company", label: getTabLabel("add-company", userRole), icon: Building2, key: "add-company" },
    { id: "order-list", label: getTabLabel("order-list", userRole), icon: Package, key: "order-list" },
    { id: "mis-tasks", label: getTabLabel("mis-tasks", userRole), icon: ClipboardList, key: "mis-tasks" },
    { id: "meeting", label: getTabLabel("meeting", userRole), icon: CalendarCheck, key: "meeting" },
    // company accounts only: their own systems page (click a system to see its tasks)
    ...((userRole || "").toLowerCase() === "company"
      ? [
          { id: "company-systems", label: getTabLabel("company-systems", userRole), icon: Building2, key: "company-systems" },
          { id: "company-tasks", label: "Task Overview", icon: CheckCircle, key: "company-tasks" },
          { id: "company-profile", label: getTabLabel("company-profile", userRole), icon: User, key: "company-profile" },
        ]
      : []),
  ]

  // Safe helper to parse permission object whether it comes as jsonb object or string
  const parsePermission = (p) => {
    if (!p) return null
    if (typeof p === "object") return p
    if (typeof p === "string") {
      try {
        const parsed = JSON.parse(p)
        if (parsed && typeof parsed === "object") return parsed
      } catch {
        return null
      }
    }
    return null
  }

  // Helper to resolve permissions array from user object or stored session
  const resolvePermissions = (data) => {
    if (!data) return ["dashboard"]
    const role = (data.role || data.type || "").toLowerCase()
    if (role === "superadmin") return ["all"]

    // 1. Check explicit permission JSON object from DB
    const permObj = parsePermission(data.permission || data.permissions)
    if (permObj) {
      if (permObj.all === true) return ["all"]
      const keys = Object.keys(permObj).filter((k) => permObj[k] === true)
      if (keys.length > 0) {
        if (role === "company") {
          const companyRequired = ["dashboard", "company-systems", "company-tasks", "troubleshoot", "ai-helper", "company-profile"]
          return [...new Set([...keys, ...companyRequired])]
        }
        if (role === "admin" || role === "superadmin") {
          return [...new Set([...keys, "mis-tasks"])]
        }
        return keys
      }
    }

    // 2. Check pagination (legacy permission array or string)
    const pag = data.pagination || (data.companyData && data.companyData.paginationNew)
    if (pag) {
      if (pag === "all") return ["all"]
      if (Array.isArray(pag) && pag.length > 0) {
        const arr = pag.map((p) => String(p).toLowerCase())
        if (role === "admin" || role === "superadmin") return [...new Set([...arr, "mis-tasks"])]
        return arr
      }
      if (typeof pag === "string") {
        try {
          const parsed = JSON.parse(pag)
          if (parsed && typeof parsed === "object") {
            if (parsed.all === true) return ["all"]
            const keys = Object.keys(parsed).filter((k) => parsed[k] === true)
            if (keys.length > 0) {
              if (role === "admin" || role === "superadmin") return [...new Set([...keys, "mis-tasks"])]
              return keys
            }
          }
        } catch {
          /* ignore */
        }
        const split = pag.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean)
        if (split.length > 0) {
          if (role === "admin" || role === "superadmin") return [...new Set([...split, "mis-tasks"])]
          return split
        }
      }
    }

    // 3. Role defaults if no explicit permissions configured yet
    const defaults = {
      admin: ["all"],
      hod: [
        "dashboard", "assign-task", "pending-tasks", "completed-tasks", "tasks-table",
        "delegation-form", "delegation-tasks", "checklist-assign", "checklist-pending", "pc-page",
        "assign-tester", "tester", "approval-delivery", "order-list", "meeting", "holidays",
      ],
      employee: [
        "dashboard", "assign-task", "pending-tasks", "completed-tasks", "checklist-assign", "checklist-pending", "delegation-tasks", "pc-page", "tester", "meeting", "holidays",
      ],
      company: [
        "dashboard", "company-systems", "company-tasks", "troubleshoot", "ai-helper", "company-profile",
      ],
    }
    const base = defaults[role] || ["dashboard"]
    // Always merge company required pages even if DB has partial permissions
    if (role === "company") {
      const companyRequired = ["dashboard", "company-systems", "company-tasks", "troubleshoot", "ai-helper", "company-profile"]
      return [...new Set([...base, ...companyRequired])]
    }
    if (role === "admin" || role === "superadmin") {
      return [...new Set([...base, "mis-tasks"])]
    }
    return base
  }

  useEffect(() => {
    let userData = null

    if (user) {
      userData = {
        role: user.role || user.type,
        type: user.role || user.type,
        username: user.username,
        pagination: user.pagination,
        permission: user.permission || user.permissions,
        userId: user.userId || user.id,
        filterData: userFilterData,
        companyData: companyData,
      }
    } else {
      // Get user data from different sources as a fallback
      const storedSession = sessionStorage.getItem("userSession")
      if (storedSession) {
        try {
          userData = JSON.parse(storedSession)
        } catch (e) {
          console.error("❌ Error parsing session data:", e)
        }
      }

      if (!userData) {
        const storedUsername = localStorage.getItem("tempUsername")
        if (storedUsername) {
          userData = { username: storedUsername }
        }
      }
    }

    setUserInfo(userData)
    setUserPermissions(resolvePermissions(userData))
  }, [user, userFilterData, companyData])

  // Sync fresh permissions directly from users table and react to real-time edits
  useEffect(() => {
    const fetchFreshPermissions = async () => {
      const uName = user?.username || userInfo?.username
      const uId = user?.userId || user?.id || userInfo?.userId
      if (!uName && !uId) return

      try {
        let query = supabase.from("users").select("id, username, role, permission, is_active")
        if (uId) query = query.eq("id", uId)
        else query = query.eq("username", uName)

        const { data: row, error } = await query.maybeSingle()
        if (!error && row && row.permission) {
          const perm = parsePermission(row.permission)
          if (perm) {
            let newPerms
            if (row.role === "superadmin" || perm.all === true) {
              newPerms = ["all"]
            } else {
              const keys = Object.keys(perm).filter((k) => perm[k] === true)
              const base = keys.length > 0 ? keys : ["dashboard"]
              // Always ensure company accounts see their required pages
              const companyRequired = ["dashboard", "company-systems", "company-tasks", "troubleshoot", "ai-helper", "company-profile"]
              newPerms = row.role === "company" ? [...new Set([...base, ...companyRequired])] : base
            }
            setUserPermissions(newPerms)
            try {
              const sess = JSON.parse(sessionStorage.getItem("userSession") || "{}")
              sess.permission = perm
              sess.permissions = perm
              sess.pagination = newPerms
              sessionStorage.setItem("userSession", JSON.stringify(sess))
              window.dispatchEvent(new CustomEvent("userSessionUpdated", { detail: sess }))
              setCookie("userSession", sess, 7)
            } catch {
              /* ignore */
            }
          }
        }
      } catch (err) {
        console.warn("Could not sync fresh user permissions:", err)
      }
    }

    fetchFreshPermissions()

    const onSessionUpdate = (e) => {
      if (e.detail?.permission) {
        const perm = parsePermission(e.detail.permission)
        if (perm) {
          const newPerms =
            perm.all === true
              ? ["all"]
              : Object.keys(perm).filter((k) => perm[k] === true)
          setUserPermissions(newPerms.length > 0 ? newPerms : ["dashboard"])
        }
      }
    }
    window.addEventListener("userSessionUpdated", onSessionUpdate)
    return () => window.removeEventListener("userSessionUpdated", onSessionUpdate)
  }, [user?.username, user?.userId, userInfo?.username, userInfo?.userId])

  // Filter tabs strictly based on permissions
  const getVisibleTabs = () => {
    const role = (userInfo?.role || userInfo?.type || "").toLowerCase()
    const allTabs = getAllTabs(role)

    // Superadmin always gets all tabs
    if (role === "superadmin") return allTabs

    const hasAll = userPermissions.includes("all")

    // Company accounts never get internal employee management tools
    const companyProhibited = [
      "add-user",
      "add-company",
      "holidays",
      "meeting",
      "delegation-form",
      "delegation-tasks",
      "checklist-assign",
      "checklist-pending",
      "pc-page",
      "assign-tester",
      "tester",
      "approval-delivery",
      "inform-customer",
      "system-approvals",
      // Company accounts use the combined "My Tasks" page instead of separate pending/completed pages
      "pending-tasks",
      "completed-tasks",
    ]

    const visible = allTabs.filter((tab) => {
      // 1. Dashboard is always visible to everyone
      if (tab.id === "overview" || tab.key === "dashboard") return true

      // 2. Company accounts check
      if (role === "company") {
        if (companyProhibited.includes(tab.id)) return false
      }

      // 3. Full access granted
      if (hasAll) {
        if (tab.id === "system-approvals") return false
        return true
      }

      // 4. Permission match based on userPermissions array
      const tabIdNorm = tab.id.toLowerCase().replace(/[-_\s]/g, "")
      const tabKeyNorm = (tab.key || "").toLowerCase().replace(/[-_\s]/g, "")

      return userPermissions.some((perm) => {
        if (!perm) return false
        const pNorm = String(perm).toLowerCase().replace(/[-_\s]/g, "")
        return (
          pNorm === tabIdNorm ||
          pNorm === tabKeyNorm ||
          (pNorm === "overview" && tabKeyNorm === "dashboard") ||
          (pNorm === "dashboard" && tabIdNorm === "overview") ||
          (pNorm === "pendingtask" && (tabIdNorm === "pendingtasks" || tabKeyNorm === "pendingtasks")) ||
          (pNorm === "completedtask" && (tabIdNorm === "completedtasks" || tabKeyNorm === "completedtasks")) ||
          (pNorm === "delegation" && (tabIdNorm === "delegationform" || tabIdNorm === "delegationtasks")) ||
          (pNorm === "checklist" && (tabIdNorm === "checklistassign" || tabIdNorm === "checklistpending")) ||
          (pNorm === "settings" && (tabIdNorm === "adduser" || tabIdNorm === "addcompany"))
        )
      })
    })

    return visible.length > 0 ? visible : [allTabs[0]] // At least show dashboard
  }

  // company accounts get a fixed order: Dashboard, My Systems, Troubleshoot, AI Consultant, Company Profile
  const COMPANY_TAB_ORDER = ["overview", "company-systems", "company-tasks", "troubleshoot", "ai-helper", "company-profile"]
  const isCompanyRole = (userInfo?.role || userInfo?.type || "").toLowerCase() === "company"
  const visibleTabs = isCompanyRole
    ? [...getVisibleTabs()].sort((x, y) => {
        const ix = COMPANY_TAB_ORDER.indexOf(x.id)
        const iy = COMPANY_TAB_ORDER.indexOf(y.id)
        return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy)
      })
    : getVisibleTabs()

  // Safety reset: if the activeTab is not in the allowed visibleTabs list, reset it to "overview"
  // Exception: hidden tabs like "company-systems" that are accessed via navigation
  useEffect(() => {
    const hiddenAllowedTabs = ["company-systems", "system-tasks"];
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab) && !hiddenAllowedTabs.includes(activeTab)) {
      setActiveTab("overview")
    }
  }, [visibleTabs, activeTab, setActiveTab])

  useEffect(() => {
    if (
      activeTab === "delegation-form" ||
      activeTab === "delegation-tasks" ||
      activeTab === "checklist-assign" ||
      activeTab === "checklist-pending"
    ) {
      setChecklistOpen(true)
      setDelegationOpen(true)
    }
    if (settingsChildIds.includes(activeTab)) setSettingsOpen(true)
    if (
      orderChildIdsAll.includes(activeTab) ||
      activeTab === "company-systems" ||
      activeTab === "system-tasks"
    ) {
      setOrderOpen(true)
    }
  }, [activeTab])

  // Pending-item badges for the order pipeline stages (refreshed on tab change and every few seconds)
  useEffect(() => {
    const role = (userInfo?.role || userInfo?.type || "").toLowerCase()
    if (!role || role === "company") return
    let alive = true
    // a load started before a refresh request may return old numbers; only the latest load is applied
    let seq = 0
    const load = async () => {
      const mine = ++seq
      try {
        const c = await fetchPendingCounts({
          userId: userFilterData?.userId ?? userFilterData?.id ?? null,
          seesAll: role === "admin" || role === "superadmin" || !!userFilterData?.isAdmin,
          withRequests: role === "superadmin",
        })
        if (alive && mine === seq) setPendingCounts(c)
      } catch (e) {
        console.error("pending counts", e)
      }
    }
    load()
    const t = setInterval(load, 8000)
    // e.g. a task completed: adjust the badge now, then refetch the real counts
    const seesAll = role === "admin" || role === "superadmin" || !!userFilterData?.isAdmin
    const myId = userFilterData?.userId ?? userFilterData?.id ?? null
    const off = onCountsRefresh((delta, { pendingTaskOwner } = {}) => {
      setPendingCounts((prev) => {
        const next = { ...prev }
        for (const [k, d] of Object.entries(delta)) {
          if (!(k in next)) continue
          // members only count their own pending tasks
          if (k === "pending-tasks" && !seesAll && pendingTaskOwner != null && String(pendingTaskOwner) !== String(myId)) continue
          next[k] = Math.max(0, next[k] + d)
        }
        return next
      })
      load()
    })
    return () => {
      alive = false
      clearInterval(t)
      off()
    }
  }, [userInfo, userFilterData, activeTab])

  // Get user role icon
  const getUserRoleIcon = () => {
    if (!userInfo) return User

    switch (userInfo.role) {
      case "admin":
        return Shield
      case "company":
        return Building2
      case "user":
      default:
        return User
    }
  }

  // Get user role color
  const getUserRoleColor = () => {
    if (!userInfo) return "text-gray-500"

    switch (userInfo.role) {
      case "admin":
        return "text-red-500"
      case "company":
        return "text-blue-500"
      case "user":
      default:
        return "text-green-500"
    }
  }

  const RoleIcon = getUserRoleIcon()

  return (
    <aside className="w-80 bg-white border-r border-gray-100 flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="p-4">
        {/* User Info Section */}
       {/* User Info Section */}
        {userInfo && (
          <div className="mb-5 p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-white ${getUserRoleColor()}`}>
                <RoleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {userInfo.role === "company" && userInfo.companyData?.companyName 
                    ? userInfo.companyData.companyName 
                    : userInfo.username || "Unknown User"
                  }
                </p>
                <p className={`text-xs font-medium capitalize ${getUserRoleColor()}`}>
                  {userInfo.role || "user"}
                </p>
              </div>
            </div>

            {/* Permission Summary */}
            {userPermissions.includes("all") && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                  Full Access
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="space-y-1">
          {(() => {
            // New Checklist & Delegation group (primary)
            const checklistChildIds = ["checklist-assign", "checklist-pending"]
            // Keep legacy ids nested under same group if still visible
            const legacyDelegationIds = ["delegation-form", "delegation-tasks"]
            const allChecklistIds = [...checklistChildIds, ...legacyDelegationIds]
            const orderChildIds = [
              "order-list",
              "system-approvals",
              "assign-tester",
              "tester",
              "approval-delivery",
              "inform-customer",
            ]
            // company accounts have no "Party System and Updation" group: Troubleshoot is a normal item
            const tasksChildIds = isCompanyRole
              ? []
              : [
                  "assign-task",
                  "tasks-table",
                  "pending-tasks",
                  "completed-tasks",
                  "troubleshoot",
                  "reports",
                ]
            const checklistChildren = visibleTabs.filter((t) =>
              checklistChildIds.includes(t.id) || legacyDelegationIds.includes(t.id)
            )
            const orderChildren = visibleTabs
              .filter((t) => orderChildIds.includes(t.id))
              .sort((a, b) => orderChildIds.indexOf(a.id) - orderChildIds.indexOf(b.id))
            const tasksChildren = visibleTabs.filter((t) =>
              tasksChildIds.includes(t.id)
            )
            const settingsChildren = visibleTabs.filter((t) => settingsChildIds.includes(t.id))
            const settingsActive = settingsChildIds.includes(activeTab)
            const topLevelTabs = visibleTabs.filter(
              (t) =>
                !settingsChildIds.includes(t.id) &&
                !allChecklistIds.includes(t.id) &&
                !tasksChildIds.includes(t.id) &&
                !orderChildIds.includes(t.id)
            )
            const checklistActive = allChecklistIds.includes(activeTab)
            const orderActive =
              orderChildIds.includes(activeTab) ||
              (!isCompanyRole && (activeTab === "company-systems" || activeTab === "system-tasks"))
            const tasksActive = tasksChildIds.includes(activeTab)
            const showChecklistGroup = checklistChildren.length > 0
            const showOrderGroup = orderChildren.length > 0
            const showTasksGroup = tasksChildren.length > 0

            // Non-company users reach the company systems / system tasks pages by clicking a row in Order List,
            // so keep "Order List" highlighted while they are on those pages.
            const orderDrilldown =
              !isCompanyRole && (activeTab === "company-systems" || activeTab === "system-tasks")
            const isTabActive = (tab) =>
              activeTab === tab.id || (tab.id === "order-list" && orderDrilldown)

            const renderTabBtn = (tab, { nested = false } = {}) => (
              <motion.button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (isMobile && onClose) onClose()
                }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 rounded-full text-left transition-colors duration-150 ${
                  nested ? "px-3 py-2.5" : "px-4 py-3"
                } ${
                  isTabActive(tab)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <tab.icon className={`${nested ? "w-4 h-4" : "w-5 h-5"} flex-shrink-0`} />
                <span
                  className={`font-medium min-w-0 flex-1 leading-snug whitespace-nowrap ${
                    nested ? "text-sm" : "text-[14px]"
                  }`}
                >
                  {tab.label}
                </span>
                {badgeFor(tab.id) > 0 && (
                  <span className="ml-auto shrink-0 min-w-[20px] rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                    {badgeFor(tab.id)}
                  </span>
                )}
                {isTabActive(tab) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 shrink-0 bg-indigo-500 rounded-full"
                  />
                )}
                {tab.id === "ai-helper" && activeTab !== tab.id && (
                  <span className="ml-auto shrink-0">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </span>
                )}
              </motion.button>
            )

            const groupBtnClass = (active) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors duration-150 ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`

            const renderTasksGroup = () => (
              <div key="tasks-group" className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setTasksOpen((o) => !o)
                    setSettingsOpen(false)
                    setChecklistOpen(false)
                    setDelegationOpen(false)
                    setOrderOpen(false)
                  }}
                  className={groupBtnClass(tasksActive)}
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[14px] leading-snug min-w-0 flex-1 whitespace-nowrap">
                    Party System and Updation
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${
                      tasksOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {tasksOpen && (
                  <div className="ml-3 space-y-1 pl-2">
                    {tasksChildren.map((child) => renderTabBtn(child, { nested: true }))}
                  </div>
                )}
              </div>
            )

            const renderChecklistGroup = () => (
              <div key="checklist-group" className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setChecklistOpen((o) => !o)
                    setSettingsOpen(false)
                    setTasksOpen(false)
                    setDelegationOpen(false)
                    setOrderOpen(false)
                  }}
                  title="Checklist and Delegation"
                  className={groupBtnClass(checklistActive)}
                >
                  <ClipboardList className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[14px] leading-snug min-w-0 flex-1 whitespace-nowrap">
                    Checklist and Delegation
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${
                      checklistOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {checklistOpen && (
                  <div className="ml-3 space-y-1 pl-2">
                    {checklistChildren.map((child) =>
                      renderTabBtn(child, { nested: true })
                    )}
                  </div>
                )}
              </div>
            )


            const renderOrderGroup = () => (
              <div key="order-group" className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOrderOpen((o) => !o)
                    setSettingsOpen(false)
                    setTasksOpen(false)
                    setChecklistOpen(false)
                    setDelegationOpen(false)
                  }}
                  className={groupBtnClass(orderActive)}
                >
                  <Package className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[14px] leading-snug min-w-0 flex-1 whitespace-nowrap">
                    Order System
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${
                      orderOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {orderOpen && (
                  <div className="ml-3 space-y-1 pl-2">
                    {orderChildren.map((child) =>
                      renderTabBtn(child, { nested: true })
                    )}
                  </div>
                )}
              </div>
            )

            const renderSettingsGroup = () => (
              <div key="settings-group" className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen((o) => !o)
                    setTasksOpen(false)
                    setChecklistOpen(false)
                    setDelegationOpen(false)
                    setOrderOpen(false)
                  }}
                  className={groupBtnClass(settingsActive)}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-[14px] leading-snug min-w-0 flex-1 whitespace-nowrap">
                    Settings
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${
                      settingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {settingsOpen && (
                  <div className="ml-3 space-y-1 pl-2">
                    {settingsChildren.map((child) => renderTabBtn(child, { nested: true }))}
                  </div>
                )}
              </div>
            )

            // Order: pc-page, overview, Tasks group, Checklist & Delegation group, Order group, rest, meeting
            const ordered = []
            const used = new Set()
            const pushTab = (id) => {
              const tab = topLevelTabs.find((x) => x.id === id)
              if (tab) {
                ordered.push(renderTabBtn(tab))
                used.add(id)
              }
            }
            pushTab("pc-page")
            pushTab("overview")
            if (showTasksGroup) ordered.push(renderTasksGroup())
            if (showChecklistGroup) ordered.push(renderChecklistGroup())
            if (showOrderGroup) ordered.push(renderOrderGroup())
            topLevelTabs.forEach((tab) => {
              if (tab.id !== "meeting" && !used.has(tab.id)) ordered.push(renderTabBtn(tab))
            })
            if (settingsChildren.length > 0) ordered.push(renderSettingsGroup())
            pushTab("meeting")
            return ordered
          })()}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar