"use client";
import TaskList from "../TaskList";

export default function CompanyTasksPage({ userRole, userFilterData, companyData, onRefreshStats }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and track all tasks for your company</p>
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
