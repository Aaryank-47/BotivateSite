"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { fetchPendingCounts } from "../../services/schemaApi"
import { subscribeCounts, countForTab, onCountsRefresh } from "../../utils/sidebarCounts"
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
  UserCog,
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
} from "lucide-react"

const orderChildIdsAll = ["order-list", "system-approvals", "assign-tester", "tester", "approval-delivery", "inform-customer"]

const Sidebar = ({ activeTab, setActiveTab, onClose, isMobile, user, userFilterData, companyData }) => {
  const [userPermissions, setUserPermissions] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [delegationOpen, setDelegationOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
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
      "user-access": "User Access",
      "holidays": "Holidays",
      "order-list": "Order List",
      "company-systems": "My Systems",
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
    { id: "user-access", label: getTabLabel("user-access", userRole), icon: UserCog, key: "user-access" },
    { id: "order-list", label: getTabLabel("order-list", userRole), icon: Package, key: "order-list" },
    // company accounts only: their own systems page (click a system to see its tasks)
    ...((userRole || "").toLowerCase() === "company"
      ? [
          { id: "company-systems", label: getTabLabel("company-systems", userRole), icon: Building2, key: "company-systems" },
          { id: "company-profile", label: getTabLabel("company-profile", userRole), icon: User, key: "company-profile" },
        ]
      : []),
  ]

  useEffect(() => {
    let userData = null;

    if (user) {
      userData = {
        role: user.type,
        type: user.type,
        username: user.username,
        pagination: user.pagination,
        filterData: userFilterData,
        companyData: companyData
      }
    } else {
      // Get user data from different sources as a fallback
      const storedSession = sessionStorage.getItem('userSession')
      if (storedSession) {
        try {
          userData = JSON.parse(storedSession)
        } catch (e) {
          console.error("❌ Error parsing session data:", e)
        }
      }

      if (!userData) {
        const storedUsername = localStorage.getItem('tempUsername')
        if (storedUsername) {
          userData = {
            username: storedUsername,
          }
        }
      }
    }

    setUserInfo(userData)

    if (userData) {
      // Handle different user types
      if (userData.role === "admin" || userData.type === "admin" || userData.role === "superadmin" || userData.type === "superadmin") {
        setUserPermissions(["all"])
      } else if (userData.role === "hod" || userData.type === "hod") {
        setUserPermissions(["dashboard", "assign-task", "pending-tasks", "tasks-table", "holidays"])
      } else if (userData.role === "company") {
        handleCompanyPermissions(userData)
      } else if (userData.role === "employee" || userData.type === "employee") {
        handleUserPermissions(userData)
      } else {
        setUserPermissions(["dashboard"])
      }
    } else {
      setUserPermissions(["dashboard"])
    }
  }, [user, userFilterData, companyData])

  // Handle company permissions using paginationnew from Column E
const handleCompanyPermissions = (userData) => {

  const paginationNew = userData.companyData?.paginationNew;
  const pagination = userData.pagination;

  if (paginationNew) {

    if (typeof paginationNew === "string") {
      if (paginationNew.toLowerCase() === "all") {
        setUserPermissions(["all"]);
      } else {
        const permissions = paginationNew
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        setUserPermissions(permissions);
      }
    } else if (Array.isArray(paginationNew)) {
      const permissions = paginationNew.map(perm => perm.toLowerCase());
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected paginationNew format:", paginationNew);
      setUserPermissions(["dashboard"]);
    }
  } else if (pagination) {

    if (typeof pagination === "string") {
      if (pagination.toLowerCase() === "all") {
        setUserPermissions(["all"]);
      } else {
        const permissions = pagination
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        setUserPermissions(permissions);
      }
    } else if (Array.isArray(pagination)) {
      const permissions = pagination.map(perm => perm.toLowerCase());
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected pagination format:", pagination);
      setUserPermissions(["dashboard"]);
    }
  } else {
    setUserPermissions(["dashboard"]);
  }
};


  // Handle user permissions using existing pagination logic
 const handleUserPermissions = (userData) => {

  const pagination = userData.pagination;

  if (pagination) {

    if (typeof pagination === "string") {
      // case: string like "all" or "pending-tasks,completed-tasks"
      if (pagination.toLowerCase() === "all") {
        setUserPermissions(["all"]);
      } else {
        const permissions = pagination
          .split(",")
          .map(perm => perm.trim().toLowerCase())
          .filter(perm => perm.length > 0);

        setUserPermissions(permissions);
      }
    } else if (Array.isArray(pagination)) {
      // case: already an array
      const permissions = pagination.map(perm => perm.toLowerCase());
      setUserPermissions(permissions);
    } else {
      console.warn("⚠️ Unexpected pagination format:", pagination);
      setUserPermissions(["dashboard"]);
    }
  } else {
    setUserPermissions(["dashboard"]);
  }
};


  // Filter tabs based on permissions
  const getVisibleTabs = () => {
    const allTabs = getAllTabs(userInfo?.role) // Get tabs with dynamic labels

    if (userPermissions.includes("all")) {
      const roleAll = (userInfo?.role || userInfo?.type || "").toLowerCase()
      // User Access ONLY for superadmin
      // Holidays: superadmin, admin, hod, employee (NOT company)
      if (roleAll === "superadmin") return allTabs
      if (roleAll === "admin") {
        return allTabs.filter((t) => t.id !== "user-access" && t.id !== "system-approvals")
      }
      // company with "all" — no user-access, holidays, delegation, checklist, pc
      if (roleAll === "company") {
        return allTabs.filter(
          (t) =>
            t.id !== "user-access" &&
            t.id !== "holidays" &&
            t.id !== "delegation-form" &&
            t.id !== "delegation-tasks" &&
            t.id !== "checklist-assign" &&
            t.id !== "checklist-pending" &&
            t.id !== "pc-page" &&
            t.id !== "assign-task" &&
            t.id !== "pending-tasks" &&
            t.id !== "assign-tester" &&
            t.id !== "tester" &&
            t.id !== "approval-delivery" &&
            t.id !== "inform-customer" &&
            t.id !== "system-approvals"
        )
      }
      // others with "all"
      return allTabs.filter(
        (t) =>
          t.id !== "user-access" &&
          t.id !== "holidays" &&
          t.id !== "system-approvals" &&
          (t.id !== "assign-tester" || roleAll === "hod")
      )
    }

    const role = (userInfo?.role || userInfo?.type || "").toLowerCase()
    const isEmployee = role === "employee"

    const visibleTabs = allTabs.filter(tab => {
      // Company accounts always get their systems page
      if (tab.id === "company-systems" || tab.id === "company-profile") return true
      // ...plus the AI consultant and Troubleshoot pages
      if (
        (userInfo?.role || userInfo?.type || "").toLowerCase() === "company" &&
        (tab.id === "ai-helper" || tab.id === "troubleshoot")
      )
        return true

      // Always show dashboard
      if (tab.id === "overview" || tab.key === "dashboard") {
        return true
      }

      // User Access: superadmin always; others only if explicitly granted in DB permission
      if (tab.id === "user-access") {
        if (role === "superadmin") return true
        // fall through to permission match below
      }

      // Holidays: superadmin, admin, hod, employee — NOT company
      if (tab.id === "holidays") {
        return (
          role === "admin" ||
          role === "superadmin" ||
          role === "hod" ||
          role === "employee" ||
          role === "user"
        )
      }

      // Assign Tester: superadmin, admin, hod. Tester: everyone except company.
      if (tab.id === "system-approvals") {
        return role === "superadmin"
      }
      if (tab.id === "assign-tester") {
        return role === "superadmin" || role === "admin" || role === "hod"
      }
      if (tab.id === "tester" || tab.id === "approval-delivery" || tab.id === "inform-customer") {
        return role !== "company"
      }

      // Company never sees delegation, checklist, or PC
      if (role === "company") {
        if (
          tab.id === "delegation-form" ||
          tab.id === "delegation-tasks" ||
          tab.id === "checklist-assign" ||
          tab.id === "checklist-pending" ||
          tab.id === "pc-page" ||
          tab.id === "assign-task" ||
          tab.id === "pending-tasks"
        ) {
          return false
        }
      }

      // Checklist Assign + old Delegation Form: superadmin, admin, hod only
      if (tab.id === "delegation-form" || tab.id === "checklist-assign") {
        return (
          role === "superadmin" ||
          role === "admin" ||
          role === "hod"
        )
      }

      // Checklist Pending + Delegation Tasks: everyone except company
      if (tab.id === "delegation-tasks" || tab.id === "checklist-pending") {
        return (
          role === "superadmin" ||
          role === "admin" ||
          role === "hod" ||
          role === "employee" ||
          role === "user"
        )
      }

      // PC Page: superadmin, admin, hod only
      if (tab.id === "pc-page") {
        return (
          role === "superadmin" ||
          role === "admin" ||
          role === "hod"
        )
      }

      // Trust users.permission from DB (loaded into userPermissions at login).
      // Only use role baselines when permission list is empty / missing.
      if (isEmployee) {
        const hasExplicit = userPermissions.some(
          (p) => !["dashboard", "all"].includes(String(p).toLowerCase())
        )
        if (!hasExplicit) {
          return tab.id === "assign-task" || tab.id === "pending-tasks"
        }
      }

      if (role === "company") {
        const hasExplicit = userPermissions.some(
          (p) => !["dashboard", "all"].includes(String(p).toLowerCase())
        )
        if (!hasExplicit) {
          // Company baseline: ticket + pending only (no developer-stage)
          return tab.id === "assign-task" || tab.id === "pending-tasks"
        }
      }

      // Check explicit permissions
      return userPermissions.some(permission => {
        const permLower = permission.toLowerCase().replace(/[-_\s]/g, '')
        const tabKeyLower = tab.key.toLowerCase().replace(/[-_\s]/g, '')
        const tabIdLower = tab.id.toLowerCase().replace(/[-_\s]/g, '')

        return (
          permLower === tabKeyLower ||
          permLower === tabIdLower ||
          permLower.includes(tabKeyLower) ||
          tabKeyLower.includes(permLower) ||
          (permLower === "pendingtask" && (tabIdLower === "pendingtasks" || tabKeyLower === "pendingtasks"))
        )
      })
    })

    return visibleTabs.length > 0 ? visibleTabs : [allTabs[0]] // At least show dashboard
  }

  // company accounts get a fixed order: Dashboard, My Systems, Troubleshoot, AI Consultant, Company Profile
  const COMPANY_TAB_ORDER = ["overview", "company-systems", "troubleshoot", "ai-helper", "company-profile"]
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
    <aside className="w-72 bg-white border-r border-gray-100 flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              checklistChildIds.includes(t.id)
            )
            const orderChildren = visibleTabs
              .filter((t) => orderChildIds.includes(t.id))
              .sort((a, b) => orderChildIds.indexOf(a.id) - orderChildIds.indexOf(b.id))
            const tasksChildren = visibleTabs.filter((t) =>
              tasksChildIds.includes(t.id)
            )
            const topLevelTabs = visibleTabs.filter(
              (t) =>
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
                  {!orderOpen && orderChildren.reduce((n, c) => n + badgeFor(c.id), 0) > 0 && (
                    <span className="shrink-0 min-w-[20px] rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                      {orderChildren.reduce((n, c) => n + badgeFor(c.id), 0)}
                    </span>
                  )}
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

            // Order: pc-page, overview, Tasks group, Checklist & Delegation group, rest
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
              if (!used.has(tab.id)) ordered.push(renderTabBtn(tab))
            })
            return ordered
          })()}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar