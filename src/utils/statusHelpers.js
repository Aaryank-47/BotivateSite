// Centralized status color and icon helper utilities
// Consolidated from SystemsList, report, TroubleShootPage, TaskList, demo

/**
 * Get CSS classes for priority badges
 * Used in: report, TroubleShootPage, TaskList
 */
export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Get CSS classes for status badges
 * Used in: report, SystemsList
 */
export const getStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "in progress":
    case "inprogress":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800";
    case "development":
      return "bg-blue-100 text-blue-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Get CSS classes for work status badges
 * Used in: SystemsList, demo
 */
export const getWorkStatusColor = (status) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in progress":
    case "inprogress":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
