import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Button from "../../ui/Button";

// Company Filters Component for Supabase
export default function CompanyFilters({
  companyData,
  supabaseData,
  filters,
  onFilterChange,
  onClearFilters,
}) {
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (supabaseData && companyData) {
      const data = supabaseData.filter(
        (item) =>
          item.party_name &&
          item.party_name?.toLowerCase() ===
          companyData?.companyName?.toLowerCase()
      );
      setFilteredData(data);
    }
  }, [supabaseData, companyData]);

  // Get unique values with counts for dropdowns
  const getTypeOfWorkWithCounts = () => {
    const typeOfWorkCounts = {};
    filteredData.forEach((item) => {
      if (item.type_of_work) {
        typeOfWorkCounts[item.type_of_work] =
          (typeOfWorkCounts[item.type_of_work] || 0) + 1;
      }
    });
    return Object.entries(typeOfWorkCounts).map(([type, count]) => ({
      value: type,
      label: `${type}`,
      count: count,
    }));
  };

  const getStatusWithCounts = () => {
    const statusCounts = {
      "In Progress": 0,
      Completed: 0,
    };

    filteredData.forEach((item) => {
      const status = item.actual3 ? "Completed" : "In Progress";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      value: status,
      label: `${status}`,
      count: count,
    }));
  };

  const getPriorityWithCounts = () => {
    const priorityCounts = {};
    filteredData.forEach((item) => {
      if (item.priority_in_customer) {
        priorityCounts[item.priority_in_customer] =
          (priorityCounts[item.priority_in_customer] || 0) + 1;
      }
    });
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      value: priority,
      label: `${priority}`,
      count: count,
    }));
  };

  const typeOfWorkOptions = getTypeOfWorkWithCounts();
  const statusOptions = getStatusWithCounts();
  const priorityOptions = getPriorityWithCounts();

  return (
    <div className="p-3 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="grid items-center grid-cols-3 gap-3">
        {/* Type of Work Filter */}
        <div className="relative">
          <select
            value={filters.typeOfWork}
            onChange={(e) => onFilterChange("typeOfWork", e.target.value)}
            className="w-full px-4 py-2 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Type of Work</option>
            {typeOfWorkOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-4 py-2 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Status</option>
            {statusOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange("priority", e.target.value)}
            className="w-full px-4 py-2 pr-10 text-sm font-medium text-gray-700 transition-all duration-200 border shadow-sm appearance-none bg-white/80 backdrop-blur-sm border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 hover:bg-white/90 hover:border-gray-300/70"
          >
            <option value="">All Priority</option>
            {priorityOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
        </div>

        {/* Clear Filters Button */}
        {(filters.typeOfWork || filters.status || filters.priority) && (
          <div className="col-span-3 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="bg-white/70 backdrop-blur-sm border-gray-200/60 text-gray-700 hover:bg-white/90 hover:text-gray-900 hover:border-gray-300/70 transition-all duration-200 shadow-sm font-medium px-4 py-2.5"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
