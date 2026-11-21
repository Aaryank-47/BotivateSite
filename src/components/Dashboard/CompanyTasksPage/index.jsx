"use client";
import TaskList from "../TaskList";

export default function CompanyTasksPage({ userRole, userFilterData, companyData, onRefreshStats }) {
  return (
    <div className="space-y-6 px-1">
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task Overview</h1>
        <p className="text-sm text-gray-500 mt-1">View and track all tasks for your company</p>
      </div>

      <TaskList
        type="all"
        userRole={userRole}
        userFilterData={userFilterData}
        companyData={companyData}
        onRefreshStats={onRefreshStats}
      />
    </div>
  );
}
