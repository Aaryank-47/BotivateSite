"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  TrendingUp,
  Target,
  Activity,
  X,
  Code,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import Button from "../../ui/Button";
import AssignTaskForm from "../AssignTaskForm";
import TaskList from "../TaskList";
import TroubleShootPage from "../TroubleShootPage";
import TasksTable from "../TaskTable";
import DashboardCharts from "../DashboardCharts";
import AiHelperPage from "../AiHelper"; // Adjust the path if needed
import ReportsPage from "../Report";
import UserAccess from "../UserAccess";
import HolidaysPage from "../Holidays";
import DelegationForm from "../DelegationForm";
import DelegationTasks from "../DelegationTasks";
import PCPage from "../PCPage";
import AssignTester from "../AssignTester";
import Tester from "../Tester/Tester";
import ApprovalForDelivery from "../ApprovalForDelivery";
import InformToCustomer from "../InformToCustomer";
import CompanyProfile from "../CompanyProfile";
import SystemApprovals from "../SystemApprovals";
import ChecklistAssign from "../ChecklistAssign";
import ChecklistPending from "../ChecklistPending";
import OrderList from "../OrderList";
import CompanySystemsPage from "../CompanySystemsPage";
import SystemTasksPage from "../SystemTasksPage";
import supabase from "../../../supabaseClient";
import OverviewContent from "./OverviewContent";
import {
  fetchSupabaseData,
  determineUserRole,
  processTeamDataFromSupabase,
} from "./helpers";

// Main AdminDashboard Component
export default function AdminDashboard({
  onLogout,
  username,
  pagination,
  activeTab,
  setActiveTab,
  user,
  userFilterData,
  companyData,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    if (companyData?.companyId) return companyData.companyId;
    try {
      return JSON.parse(sessionStorage.getItem("selectedCompanyId") || "null");
    } catch {
      return null;
    }
  });
  const [selectedSystem, setSelectedSystem] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedSystem") || "null");
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("selectedCompanyId", JSON.stringify(selectedCompanyId));
      sessionStorage.setItem("selectedSystem", JSON.stringify(selectedSystem));
    } catch {
      /* ignore */
    }
  }, [selectedCompanyId, selectedSystem]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalTab, setUserModalTab] = useState("pending");
  const [supabaseData, setSupabaseData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTask, setTotalTask] = useState(0);
  const [pendingTask, setPendingTask] = useState(0);
  const [completeTask, setCompleteTask] = useState(0);

  const userRole = determineUserRole(username, userFilterData, companyData);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const data = await fetchSupabaseData();
        setSupabaseData(data);

        // 🔥 CHANGED: Now awaiting the async function
        const processedTeamMembers = await processTeamDataFromSupabase(
          data,
          userRole
        );
        setTeamMembers(processedTeamMembers);

        await fetchTaskCounts();
      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, companyData, userFilterData]);

  // Fetch task counts from Supabase - OPTIMIZED VERSION
  const fetchTaskCounts = async () => {
    try {


      // Build base query — new schema: user_tasks
      let baseQuery = supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true });

      if (userRole === "company" && companyData?.companyId) {
        baseQuery = baseQuery.eq("company_id", companyData.companyId);
      } else if ((userRole === "employee" || userRole === "user") && userFilterData?.userId) {
        baseQuery = baseQuery.eq("assigned_member_1", userFilterData.userId);
      }

      // Total tasks
      const { count: totalCount, error: totalError } = await baseQuery;
      if (totalError) throw totalError;
      setTotalTask(totalCount || 0);


      // Pending tasks: status is Pending or In Progress and assigned to a member
      let pendingQuery = supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["Pending", "In Progress"])
        .not("assigned_member_1", "is", null);

      if (userRole === "admin" || userRole === "superadmin") {
        // Admins see all assigned pending tasks
      } else if (userRole === "company" && companyData?.companyId) {
        pendingQuery = pendingQuery.eq("company_id", companyData.companyId);
      } else if ((userRole === "employee" || userRole === "user") && userFilterData?.userId) {
        pendingQuery = pendingQuery.eq("assigned_member_1", userFilterData.userId);
      }

      const { count: pendingCount, error: pendingError } = await pendingQuery;
      if (pendingError) throw pendingError;
      setPendingTask(pendingCount || 0);


      // Completed tasks
      let completeQuery = supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "Completed");

      if (userRole === "company" && companyData?.companyId) {
        completeQuery = completeQuery.eq("company_id", companyData.companyId);
      } else if ((userRole === "employee" || userRole === "user") && userFilterData?.userId) {
        completeQuery = completeQuery.eq("assigned_member_1", userFilterData.userId);
      }

      const { count: completeCount, error: completeError } = await completeQuery;
      if (completeError) throw completeError;
      setCompleteTask(completeCount || 0);


    } catch (error) {
      console.error("Error fetching task counts:", error);
    }
  };

  // Create stats array with actual data
  const stats = [
    {
      label: "Total Tasks",
      value: loading ? "..." : totalTask.toString(),
      icon: Users,
      color: "from-blue-500 to-blue-600",
      // change: "+2 this month",
      trend: "up",
      loading: loading,
    },
    {
      label: "Active Tasks",
      value: loading ? "..." : pendingTask.toString(),
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      // change: "+5 today",
      trend: "up",
      loading: loading,
    },
    {
      label: "Completed",
      value: loading ? "..." : completeTask.toString(),
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      // change: "+12% vs yesterday",
      trend: "up",
      loading: loading,
    },
    {
      label: "Pending Issues",
      value: loading ? "..." : pendingTask.toString(),
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      // change: "-2 resolved",
      trend: "down",
      loading: loading,
    },
  ];

  const handleTaskCreated = (newTasks) => {
    setTasks((prev) => [...prev, ...newTasks]);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setUserModalTab("pending");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewContent
            users={teamMembers}
            stats={stats}
            activeTasks={[]}
            onViewUser={handleViewUser}
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        );
      case "assign-task": {
        return (
          <AssignTaskForm
            onTaskCreated={handleTaskCreated}
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
            companyData={companyData}
          />
        );
      }
      case "tasks-table":
        return (
          <TasksTable
            tasks={tasks}
            onRefreshStats={fetchTaskCounts}
            userRole={userRole}
            userFilterData={userFilterData}
            companyData={companyData}
          />
        );
      case "pending-tasks":
        return (
          <TaskList
            userRole={userRole}
            type="pending"
            userFilterData={userFilterData}
            companyData={companyData}
            supabaseData={supabaseData}
            onRefreshStats={fetchTaskCounts}
          />
        );
      case "completed-tasks":
        return (
          <TaskList
            userRole={userRole}
            type="completed"
            userFilterData={userFilterData}
            companyData={companyData}
            supabaseData={supabaseData}
            onRefreshStats={fetchTaskCounts}
          />
        );
      case "troubleshoot":
        return <TroubleShootPage />;
      case "ai-helper":
        return <AiHelperPage />;
      case "reports":
        return (
          <ReportsPage
            userRole={userRole}
          />
        );
      case "checklist-assign":
        return (
          <ChecklistAssign
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
            companyData={companyData}
          />
        );
      case "checklist-pending":
        return (
          <ChecklistPending
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
            companyData={companyData}
            setActiveTab={setActiveTab}
          />
        );
      case "delegation-form":
        return (
          <DelegationForm
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
            companyData={companyData}
          />
        );
      case "delegation-tasks":
        return (
          <DelegationTasks
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
          />
        );
      case "pc-page":
        return (
          <PCPage
            userRole={userRole}
            user={user}
            userFilterData={userFilterData}
          />
        );
      case "assign-tester":
        return <AssignTester userFilterData={userFilterData} />;
      case "tester":
        return <Tester userRole={userRole} userFilterData={userFilterData} />;
      case "system-approvals":
        return <SystemApprovals userFilterData={userFilterData} />;
      case "company-profile":
        return <CompanyProfile companyData={companyData} />;
      case "inform-customer":
        return <InformToCustomer userFilterData={userFilterData} />;
      case "approval-delivery":
        return <ApprovalForDelivery userFilterData={userFilterData} />;
      case "user-access":
        return <UserAccess userRole={userRole} />;
      case "holidays":
        return (
          <HolidaysPage
            userRole={userRole}
            userFilterData={userFilterData}
          />
        );
      case "order-list":
        return <OrderList userRole={userRole} user={user} setActiveTab={setActiveTab} setSelectedCompanyId={setSelectedCompanyId} />;
      case "company-systems":
        return <CompanySystemsPage selectedCompanyId={selectedCompanyId} userRole={userRole} user={user} userFilterData={userFilterData} companyData={companyData} setActiveTab={setActiveTab} setSelectedSystem={setSelectedSystem} />;
      case "system-tasks":
        return <SystemTasksPage selectedSystem={selectedSystem} setActiveTab={setActiveTab} />;
      default:
        return (
          <OverviewContent
            users={teamMembers}
            stats={stats}
            activeTasks={[]}
            onViewUser={handleViewUser}
            userRole={userRole}
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Loading indicator */}
      {loading && (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <span className="text-sm text-blue-800">Loading data...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-auto">{renderContent()}</main>

      {/* User Tasks Modal - Only for admin */}
      {showUserModal && selectedUser && (userRole === "admin" || userRole === "superadmin") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 text-white bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full bg-opacity-20">
                    <span className="text-lg font-bold text-white">
                      {selectedUser.avatar}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedUser.name}'s Tasks
                    </h2>
                    <p className="text-blue-100">
                      {selectedUser.tasksCompleted}/
                      {selectedUser.totalTasksGiven} tasks completed •{" "}
                      {selectedUser.completionRate}% completion rate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-white transition-colors rounded-lg hover:bg-white hover:bg-opacity-20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setUserModalTab("inprogress")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${userModalTab === "inprogress"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>In Progress</span>
                    <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                      {selectedUser.inProgressTasks || 0}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setUserModalTab("completed")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${userModalTab === "completed"
                    ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed Tasks</span>
                    <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                      {selectedUser.tasksCompleted || 0}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {userModalTab === "pending" && (
                <div className="space-y-4">
                  <div className="py-8 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      Pending tasks data will be loaded from sheet in future
                      update
                    </p>
                  </div>
                </div>
              )}
              {userModalTab === "completed" && (
                <div className="space-y-4">
                  <div className="py-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      Completed tasks data will be loaded from sheet in future
                      update
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
