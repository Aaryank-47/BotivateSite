import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import DashboardCharts from "../DashboardCharts";
import CompanyFilters from "./CompanyFilters";
import CompanyTableSection from "./CompanyTableSection";
import TeamOverview from "../TeamOverview";

// OverviewContent Component with User Role Support
export default function OverviewContent({
  users,
  stats,
  activeTasks,
  onViewUser,
  userRole,
  companyData,
  userFilterData,
  supabaseData,
}) {
  // Company filters state
  const [companyFilters, setCompanyFilters] = useState({
    typeOfWork: "",
    status: "",
    priority: "",
  });

  // Filter stats based on user role
  const filteredStats = (() => {
    if (userRole === "company") {
      return stats.filter((stat) => stat.label !== "Active Tasks");
    } else if (userRole === "employee" || userRole === "user") {
      return stats.filter(
        (stat) =>
          stat.label === "Total Tasks" ||
          stat.label === "Active Tasks" ||
          stat.label === "Completed" ||
          stat.label === "Pending Issues"
      );
    }
    return stats;
  })();

  const handleCompanyFilterChange = (filterType, value) => {
    setCompanyFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearCompanyFilters = () => {
    setCompanyFilters({
      typeOfWork: "",
      status: "",
      priority: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Company Filters at the top - Only for Company */}
      {userRole === "company" && (
        <CompanyFilters
          companyData={companyData}
          supabaseData={supabaseData}
          filters={companyFilters}
          onFilterChange={handleCompanyFilterChange}
          onClearFilters={clearCompanyFilters}
        />
      )}

      {/* Stats cards — columns match how many there are, so no empty slot */}
      <div
        className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
          { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" }[filteredStats.length] || "lg:grid-cols-4"
        }`}
      >
        {filteredStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div
                className={`flex items-center text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
              >
                <TrendingUp
                  className={`w-3 h-3 mr-1 ${stat.trend === "down" ? "rotate-180" : ""
                    }`}
                />
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
              {stat.loading && (
                <div className="mt-2">
                  <div className="w-16 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics — all logged-in roles */}
      {(userRole === "admin" ||
        userRole === "superadmin" ||
        userRole === "hod" ||
        userRole === "company" ||
        userRole === "employee" ||
        userRole === "user") && (
          <DashboardCharts
            userRole={
              // DashboardCharts treats "admin" as full analytics
              userRole === "superadmin" || userRole === "hod"
                ? "admin"
                : userRole === "employee"
                  ? "user"
                  : userRole
            }
            companyData={companyData}
            userFilterData={userFilterData}
            supabaseData={supabaseData}
          />
        )}

      {/* Company Table Section - Only for Company */}
      {userRole === "company" && (
        <CompanyTableSection
          companyData={companyData}
          supabaseData={supabaseData}
          filters={companyFilters}
        />
      )}

      {/* Team Overview — full featured component (moved from sidebar) */}
      {(userRole === "admin" ||
        userRole === "superadmin" ||
        userRole === "hod") && (
        <TeamOverview
          userRole={userRole}
          userFilterData={userFilterData}
        />
      )}
    </div>
  );
}
