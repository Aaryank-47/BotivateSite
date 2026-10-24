import { useState, useEffect, useMemo } from "react";
import { formatDate } from "../../../utils/dateFormatters";
import ExpandableText from "../shared/ExpandableText";
import DataTable from "../shared/DataTable";

const HEADERS = [
  "Status",
  "Type of Work",
  "System Name",
  "Description of Work",
  "Expected Date to Close",
  "Priority",
  "Assigned To",
];

// Company Table Component for Supabase
export default function CompanyTableSection({ companyData, supabaseData, filters }) {
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    if (supabaseData && companyData) {
      // First filter by company
      let data = supabaseData.filter(
        (item) =>
          item.party_name &&
          item.party_name?.toLowerCase() ===
          companyData?.companyName?.toLowerCase()
      );

      // Then apply additional filters
      if (filters.typeOfWork) {
        data = data.filter((item) => item.type_of_work === filters.typeOfWork);
      }

      if (filters.status) {
        data = data.filter((item) => {
          const itemStatus = item.actual3 ? "Completed" : "In Progress";
          return itemStatus === filters.status;
        });
      }

      if (filters.priority) {
        data = data.filter(
          (item) => item.priority_in_customer === filters.priority
        );
      }

      setFilteredData(data);
      setCurrentPage(1);
    }
  }, [supabaseData, companyData, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredData, currentPage, itemsPerPage]
  );

  const renderRow = (item) => {
    const status = item.actual3 ? "Completed" : "In Progress";

    return (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
              }`}
          >
            {status}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <div className="text-sm text-gray-900">
            {item.type_of_work || "N/A"}
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <div className="text-sm text-gray-900">
            {item.system_name || "N/A"}
          </div>
        </td>
        <td className="px-4 py-4 text-center align-middle">
          <div className="max-w-xs text-sm text-gray-900">
            <ExpandableText text={item.description_of_work || "N/A"} />
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <div className="text-sm text-gray-900">
            {formatDate(item.expected_date_to_close)}
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High"
              ? "bg-red-100 text-red-800"
              : item.priority_in_customer === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
              }`}
          >
            {item.priority_in_customer || "Normal"}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-center align-middle">
          <div className="text-sm text-gray-900">
            {item.employee_name_1 || "N/A"}
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (item) => {
    const status = item.actual3 ? "Completed" : "In Progress";

    return (
      <div
        key={item.id}
        className="p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden bg-white hover:shadow-md"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

        <div className="flex justify-between items-start mt-1">
          <div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg tracking-tight">
              {item.system_name || "N/A"}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{item.type_of_work || "N/A"}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === "Completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
              {status}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority_in_customer === "High" ? "bg-red-100 text-red-800" : item.priority_in_customer === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
              {item.priority_in_customer || "Normal"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          <div className="col-span-2">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</span>
            <span className="font-semibold text-gray-900"><ExpandableText text={item.description_of_work || "N/A"} /></span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</span>
            <span className="font-semibold text-gray-900">{formatDate(item.expected_date_to_close)}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned To</span>
            <span className="font-semibold text-gray-900">{item.employee_name_1 || "N/A"}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 md:text-xl">
              Tasks Overview
            </h2>
            <p className="text-sm text-gray-600 md:text-base">
              Track your company's tasks and progress
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredData.length} tasks found
          </div>
        </div>
      </div>

      {/* Unified Table/Card View (DataTable switches at the md breakpoint internally) */}
      <div className="flex-1 min-h-0 h-96 overflow-hidden rounded-b-lg border border-gray-200 border-t-0">
        <DataTable
          headers={HEADERS}
          data={paginatedData}
          renderRow={renderRow}
          renderCard={renderCard}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
          totalResults={filteredData.length}
        />
      </div>
    </div>
  );
}
