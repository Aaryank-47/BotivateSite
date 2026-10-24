// Centralized date formatting utilities
// Consolidated from TaskTable, TaskList, DeveloperStagePage, SystemsList, CompanyTableSection, AdminDashboard/helpers

/**
 * Format date to DD/MM/YY
 * Used in: TaskTable, SystemsList, CompanyTableSection, demo
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";

  // Handle "N/A" case from CompanyTableSection
  if (dateString === "N/A") return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Format date to DD/MM/YYYY HH:MM
 * Used in: TaskList, DeveloperStagePage
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "";

  // If already in correct format, return as-is
  if (
    typeof dateString === "string" &&
    dateString.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)
  ) {
    return dateString;
  }

  // If it's a Date object or ISO string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid date

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format date to DD/MM/YY with multiple input format support
 * Used in: TaskList, AdminDashboard/helpers
 */
export const formatDateToDDMMYY = (dateString) => {
  if (!dateString) return "";

  try {
    // Handle various date formats
    let date;

    // If it's already in dd/mm/yyyy or dd/mm/yy format, parse it
    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        date = new Date(year, month, day);
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Try parsing as ISO date or other formats
      date = new Date(dateString);
    }

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    // Format to dd/mm/yy
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Return original if error
  }
};
