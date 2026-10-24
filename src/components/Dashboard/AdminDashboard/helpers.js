import supabase from "../../../supabaseClient";

// Fetch data from Supabase
export const fetchSupabaseData = async () => {
  try {
    let allData = [];
    let from = 0;
    const limit = 5000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase
        .from("user_tasks")
        .select(`
          *,
          company:users!user_tasks_company_id_fkey ( id, name, company_name ),
          systems ( id, name ),
          assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username ),
          assigned_by_user:users!user_tasks_assigned_by_fkey ( id, name, username )
        `)
        .range(from, from + limit - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const normalized = data.map((row) => ({
          ...row,
          party_name:
            row.company?.company_name ||
            row.company?.name ||
            row.companies?.name ||
            row.party_name ||
            "",
          system_name: row.systems?.name || row.system_name || "",
          team_member_name:
            row.assigned_member?.name ||
            row.assigned_member?.username ||
            row.team_member_name ||
            "",
          type_of_system: row.type_of_work || row.type_of_system || "",
          status_of_system: row.status || "",
        }));
        allData = [...allData, ...normalized];
        from += limit;
      }

      if (!data || data.length < limit) {
        keepFetching = false;
      }
    }

    return allData;
  } catch (error) {
    console.error("Error fetching Supabase user_tasks data:", error);
    return [];
  }
};

// Role detection — company must win when companyData is present
export const determineUserRole = (username, userFilterData, companyData) => {
  // Resolve role from session / cookie FIRST so superadmin is not collapsed to admin
  const readSessionRole = () => {
    if (typeof window === "undefined") return null;
    try {
      const fromSession = sessionStorage.getItem("userSession");
      if (fromSession) {
        const userData = JSON.parse(fromSession);
        if (userData?.role) return String(userData.role).toLowerCase();
      }
    } catch (_) {}
    try {
      const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("userSession="));
      if (match) {
        const raw = decodeURIComponent(match.slice("userSession=".length));
        const parts = raw.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload?.role) return String(payload.role).toLowerCase();
        }
      }
    } catch (_) {}
    return null;
  };

  const sessionRole = readSessionRole();
  if (sessionRole === "superadmin") return "superadmin";
  if (sessionRole === "admin") return "admin";
  if (sessionRole === "hod") return "hod";
  if (sessionRole === "company") return "company";
  if (sessionRole === "employee" || sessionRole === "user") return "user";

  // Explicit username / flag fallbacks
  if (username === "superadmin") return "superadmin";
  if (username === "admin" || userFilterData?.isAdmin === true) {
    return "admin";
  }


  // 3) Company login: companyData is set in LoginModal for role=company
  //    (do NOT require username to be empty — company users also have username)
  if (companyData?.companyId || companyData?.companyName) {
    return "company";
  }

  // 4) Employee / individual user
  if (
    userFilterData &&
    (userFilterData.username || userFilterData.name || userFilterData.memberName)
  ) {
    return "user";
  }

  return userFilterData ? "user" : "admin";
};

// ============================================================================
// TIME CALCULATION FUNCTIONS
// ============================================================================

export const calculateTimeDifference = (item) => {
  try {
    const planned3 = item.planned3;
    const actual3 = item.actual3;
    const planned2 = item.planned2;
    const actual2 = item.actual2;
    const howManyTimeTake = item.how_many_time_take;
    const howManyTimeTake2 = item.how_many_time_take_2;
    const actual1 = item.actual1;


    // Helper to check if value is NOT NULL
    const isNotNull = (value) => {
      return value !== null &&
        value !== undefined &&
        value.toString().trim() !== "";
    };

    // Helper to check if value IS NULL
    const isNull = (value) => {
      return value === null ||
        value === undefined ||
        value.toString().trim() === "";
    };

    // Helper to check if string is a valid date (not a name)
    const isValidDateString = (str) => {
      if (!str || typeof str !== 'string') return false;

      // If it contains only letters and spaces, it's likely a name
      if (/^[a-zA-Z\s]+$/.test(str.trim())) {

        return false;
      }

      // Check if it's a valid date
      const date = new Date(str);
      const isValid = !isNaN(date.getTime());

      return isValid;
    };

    // 1️⃣ PRIMARY CONDITION: If BOTH planned3 AND actual3 are NOT NULL
    if (isNotNull(planned3) && isNotNull(actual3)) {

      return "0h 0m";
    }

    // 2️⃣ SECONDARY CONDITION: If planned3 is NOT NULL AND actual3 is NULL
    if (isNotNull(planned3) && isNull(actual3)) {


      // 🧠 SUB-CONDITION A: Both planned2 AND actual2 are NULL
      if (isNull(planned2) && isNull(actual2)) {


        // Check if both values exist and are valid dates
        if (isNotNull(howManyTimeTake) && isNotNull(actual1)) {
          const howManyTimeTakeStr = howManyTimeTake.toString().trim();
          const actual1Str = actual1.toString().trim();

          // Validate both are dates, not names
          if (isValidDateString(howManyTimeTakeStr) && isValidDateString(actual1Str)) {




            const result = calculateWorkingHoursDifference(actual1Str, howManyTimeTakeStr);

            return result;
          } else {

            return "0h 0m";
          }
        } else {

          return "0h 0m";
        }
      }

      // 🧠 SUB-CONDITION B: Both planned2 AND actual2 are NOT NULL
      if (isNotNull(planned2) && isNotNull(actual2)) {


        if (isNotNull(howManyTimeTake2)) {

          const result = formatTimeWithWorkingHours(howManyTimeTake2);

          return result;
        }

        return "0h 0m";
      }
    }


    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in calculateTimeDifference:", error);
    return "0h 0m";
  }
};

// Calculate difference considering working hours (10:00 AM - 06:00 PM, Monday to Saturday)
export const calculateWorkingHoursDifference = (startTimeStr, endTimeStr) => {
  try {




    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);




    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {

      return "0h 0m";
    }

    // Ensure start is before end
    if (startTime >= endTime) {

      return "0h 0m";
    }

    let totalWorkingMinutes = 0;
    const workStartHour = 10;  // 10:00 AM
    const workEndHour = 18;     // 06:00 PM
    const workingHoursPerDay = workEndHour - workStartHour; // 8 hours

    let currentDate = new Date(startTime);

    // Calculate difference in days
    const diffTime = Math.abs(endTime - startTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));



    // Loop through each day
    for (let day = 0; day <= diffDays; day++) {
      const dayDate = new Date(startTime);
      dayDate.setDate(startTime.getDate() + day);

      // 🔥 NEW: Check if it's Sunday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek === 0) {

        continue; // Skip Sunday
      }

      const dayStart = new Date(dayDate);
      dayStart.setHours(workStartHour, 0, 0, 0);

      const dayEnd = new Date(dayDate);
      dayEnd.setHours(workEndHour, 0, 0, 0);

      // Calculate actual working time for this day
      const actualStart = new Date(Math.max(startTime.getTime(), dayStart.getTime()));
      const actualEnd = new Date(Math.min(endTime.getTime(), dayEnd.getTime()));

      if (actualStart < actualEnd && actualStart < dayEnd && actualEnd > dayStart) {
        const dayMinutes = (actualEnd - actualStart) / (1000 * 60);

        // Ensure we don't exceed 8 hours (480 minutes) per day
        const cappedMinutes = Math.min(dayMinutes, workingHoursPerDay * 60);

        totalWorkingMinutes += cappedMinutes;

      }
    }



    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const minutes = Math.floor(totalWorkingMinutes % 60);

    // Convert to days and hours (8-hour working day)
    const days = Math.floor(totalHours / 8);    // 8 घंटे = 1 working day
    const hours = totalHours % 8;               // Remaining hours

    let result;
    if (days > 0) {
      result = `${days}d ${hours}h ${minutes}m`;
    } else {
      result = `0d ${hours}h ${minutes}m`;
    }


    return result;

  } catch (error) {
    console.error("❌ Error in calculateWorkingHoursDifference:", error);
    return "0h 0m";
  }
};

// Format time with working hours consideration
export const formatTimeWithWorkingHours = (timeStr) => {
  try {


    if (!timeStr || timeStr.toString().trim() === "") {
      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // Already in "Xh Ym" format
    if (str.includes('h') && str.includes('m')) {

      return str;
    }

    // Handle "X days" format
    if (str.toLowerCase().includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const hours = days * 8; // 8 working hours per day
        return `${hours}h 0m`;
      }
    }

    // Plain number (assume hours)
    if (/^\d+(\.\d+)?$/.test(str)) {
      const hours = parseFloat(str);
      const h = Math.floor(hours);
      const m = Math.floor((hours % 1) * 60);
      return `${h}h ${m}m`;
    }

    // Date string
    if (str.includes('T') || str.includes('-')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        return calculateWorkingHoursDifference(str, now.toISOString());
      }
    }

    return "0h 0m";

  } catch (error) {
    console.error("❌ Error in formatTimeWithWorkingHours:", error);
    return "0h 0m";
  }
};

// Helper function to parse time string to minutes
export const parseTimeStringToMinutes = (timeStr) => {
  let totalMinutes = 0;

  // Extract hours
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }

  // Extract minutes
  const minutesMatch = timeStr.match(/(\d+)\s*m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }

  // If no h/m found but it's a number, assume hours
  if (totalMinutes === 0 && /^\d+$/.test(timeStr)) {
    totalMinutes = parseInt(timeStr) * 60;
  }

  return totalMinutes;
};

// Helper function to format minutes to "Xh Ym" format
export const formatMinutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h 0m`;
  } else {
    return `0h ${minutes}m`;
  }
};

// Helper function to check if value is a valid date
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;

  const str = dateStr.toString().trim();

  // Check if it's a name (contains letters but not date patterns)
  if (/^[a-zA-Z\s]+$/.test(str)) {
    return false;
  }

  // Check if it's a date string (contains date patterns)
  if (str.includes('T') || str.includes('-') || str.includes('/')) {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }

  return false;
};

// Helper function to check if value is a time format
export const isTimeFormat = (timeStr) => {
  if (!timeStr) return false;

  const str = timeStr.toString().trim();

  // Check for patterns like "Xh Ym", "X hours", "X days", etc.
  if (/(\d+\s*(h|hours?|hrs?))|(\d+\s*(d|days?))|(\d+\s*(m|min|minutes?))/i.test(str)) {
    return true;
  }

  // Check for simple numbers (assume they are hours)
  if (/^\d+$/.test(str)) {
    return true;
  }

  return false;
};

// Helper function to calculate difference between two dates
export const calculateDifference = (dateStr1, dateStr2) => {
  try {


    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {

      return "0h 0m";
    }

    const timeDifferenceMs = Math.abs(date1.getTime() - date2.getTime());
    const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

    return formatMinutesToDays(totalMinutes);
  } catch (error) {
    console.error("Error in calculateDifference:", error);
    return "0h 0m";
  }
};

// Enhanced helper function to format time spent from string with days
export const formatTimeSpent = (timeStr) => {
  try {


    if (!timeStr) {

      return "0h 0m";
    }

    const str = timeStr.toString().trim();

    // If it's already in proper format with days/hours/minutes, return as is
    if ((str.includes('day') || str.includes('d')) && str.includes('h') && str.includes('m')) {

      return formatToDaysHoursMinutes(str);
    }

    // If it's already in "Xh Ym" format, convert to days format
    if (str.includes('h') && str.includes('m')) {

      return convertHoursMinutesToDays(str);
    }

    // Handle simple numbers (assume they are hours)
    if (/^\d+$/.test(str)) {
      const totalHours = parseInt(str);

      return formatHoursToDays(totalHours);
    }

    // Handle "X days" format
    if (str.includes('day')) {
      const daysMatch = str.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);

        return `${days}day${days !== 1 ? 's' : ''} 0h 0m`;
      }
    }

    // Handle "X hours" format
    if (str.includes('hour')) {
      const hoursMatch = str.match(/(\d+)\s*hours?/i);
      if (hoursMatch) {
        const totalHours = parseInt(hoursMatch[1]);

        return formatHoursToDays(totalHours);
      }
    }

    // Handle "X hours Y minutes" format
    const hoursMinutesMatch = str.match(/(\d+)\s*h\s*(\d+)\s*m/i) ||
      str.match(/(\d+)\s*hours?\s*(\d+)\s*minutes?/i);
    if (hoursMinutesMatch) {
      const hours = parseInt(hoursMinutesMatch[1]);
      const minutes = parseInt(hoursMinutesMatch[2]);

      const totalHours = hours + (minutes / 60);
      return formatHoursToDays(totalHours);
    }

    // If it's a date string, calculate difference from current time
    if (str.includes('T')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const timeDifferenceMs = Math.abs(now.getTime() - date.getTime());
        const totalMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
        return formatMinutesToDays(totalMinutes);
      }
    }


    return "0h 0m";
  } catch (error) {
    console.error("Error in formatTimeSpent:", error);
    return "0h 0m";
  }
};

// Helper function to format hours into days, hours, minutes
export const formatHoursToDays = (totalHours) => {
  const days = Math.floor(totalHours / 24);
  const remainingHours = Math.floor(totalHours % 24);
  const minutes = Math.floor((totalHours * 60) % 60);

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${remainingHours}h${minutes}m`;
  } else {
    return `0day ${remainingHours}h ${minutes}m`;
  }
};

// Helper function to format minutes into days, hours, minutes
export const formatMinutesToDays = (totalMinutes) => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Helper function to convert existing "Xh Ym" format to days format
export const convertHoursMinutesToDays = (timeStr) => {
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const totalHours = hours + (minutes / 60);
  return formatHoursToDays(totalHours);
};

// Helper function to format existing days/hours/minutes string
export const formatToDaysHoursMinutes = (timeStr) => {
  const daysMatch = timeStr.match(/(\d+)\s*day/);
  const hoursMatch = timeStr.match(/(\d+)\s*h/);
  const minutesMatch = timeStr.match(/(\d+)\s*m/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  if (days > 0) {
    return `${days}day${days !== 1 ? 's' : ''}${hours}h${minutes}m`;
  } else {
    return `0day ${hours}h ${minutes}m`;
  }
};

// Fixed date format function for ISO dates
export const formatDateToDDMMYY = (dateInput) => {
  if (!dateInput || dateInput.toString().trim() === "") {
    return "No assign date";
  }

  try {
    const dateStr = dateInput.toString().trim();

    // Handle ISO date format (2025-05-03T00:00:00+00:00)
    if (dateStr.includes('T') && dateStr.includes('-')) {
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        return dateStr; // Return original if parsing fails
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear());

      return `${day}/${month}/${year}`;
    }

    // Handle other date formats (existing logic)
    let date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[2].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[0];
        return `${day}/${month}/${year}`;
      }
      date = new Date(dateStr);
    } else if (!isNaN(dateStr) && dateStr.length > 4) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = parseInt(dateStr);
      date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateInput);
    return dateInput.toString().trim();
  }
};

/**
 * Batch fetch all team names from the dropdown table in one query.
 * @returns {Promise<Map<string, string>>} Map of lowercase member name → team name
 */
const fetchAllTeamNames = async () => {
  try {
    // New schema: team members live in users (role admin/employee)
    const { data, error } = await supabase
      .from("users")
      .select("id, name, username, role")
      .eq("is_active", true)
      .in("role", ["admin", "employee"]);

    if (error || !data) return new Map();

    const teamMap = new Map();
    data.forEach((row) => {
      const key = (row.name || row.username || "").trim().toLowerCase();
      if (key) {
        teamMap.set(key, row.role === "admin" ? "Admin" : "Employee");
      }
    });
    return teamMap;
  } catch (error) {
    console.error("Error batch-fetching team names:", error);
    return new Map();
  }
};

/**
 * Process team data for the Team Overview section.
 * Optimized: fetches only needed columns, batches team name lookups.
 * @param {Array} _supabaseData - unused (kept for backward compat), does its own lean fetch
 * @param {string} userRole - "admin", "user", or "company"
 * @returns {Promise<Array>} Processed team member data
 */
export const processTeamDataFromSupabase = async (_supabaseData, userRole = "admin") => {
  const role = (userRole || "").toLowerCase();
  // Team Overview metrics for admin & superadmin only
  if (role !== "admin" && role !== "superadmin") {
    return [];
  }

  // OPTIMIZATION 1: Fetch all columns needed using pagination to bypass 5000 row limit
  let leanData = [];
  let from = 0;
  const limit = 5000;
  let keepFetching = true;

  while (keepFetching) {
    const { data: pageData, error } = await supabase
      .from("user_tasks")
      .select(`
        id, given_date, status, completed_at, assigned_at, type_of_work,
        expected_date_to_close,
        assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username )
      `)
      .range(from, from + limit - 1);

    if (error) {
      console.error("Error fetching team data:", error);
      return [];
    }

    if (pageData && pageData.length > 0) {
      const normalized = pageData.map((row) => ({
        ...row,
        team_member_name:
          row.assigned_member?.name ||
          row.assigned_member?.username ||
          "",
        // Map old FMS completion flags to new status field for downstream logic
        actual3: row.status === "Completed" ? (row.completed_at || row.given_date) : null,
        actual1: row.assigned_at || row.given_date || null,
        planned3: row.given_date || null,
      }));
      leanData = [...leanData, ...normalized];
      from += limit;
    }

    if (!pageData || pageData.length < limit) {
      keepFetching = false;
    }
  }

  // OPTIMIZATION 2: Batch fetch ALL team names in one query (not N+1)
  const teamNameLookup = await fetchAllTeamNames();

  const teamMap = new Map();

  // Sort data by id to get latest entries first
  const sortedData = [...leanData].sort((a, b) => (b.id || 0) - (a.id || 0));

  for (const item of sortedData) {
    const teamMemberRaw = item.team_member_name?.trim() || "";
    const emp1Raw = item.employee_name_1?.trim() || "";
    const emp2Raw = item.employee_name_2?.trim() || "";

    const teamMember = teamMemberRaw.toLowerCase();
    const emp1 = emp1Raw.toLowerCase();
    const emp2 = emp2Raw.toLowerCase();

    // Key: lowercase (for deduplication), Value: raw casing (for display)
    const membersToCredit = new Map();

    if (teamMember && !teamMember.includes("team") && teamMember !== "none" && teamMember !== "-") {
      membersToCredit.set(teamMember, teamMemberRaw);
    }
    if (emp1 && !emp1.includes("team") && emp1 !== "none" && emp1 !== "-") {
      membersToCredit.set(emp1, emp1Raw);
    }
    if (emp2 && !emp2.includes("team") && emp2 !== "none" && emp2 !== "-") {
      membersToCredit.set(emp2, emp2Raw);
    }

    if (membersToCredit.size === 0) continue;

    // OPTIMIZATION 3: Compute time difference once per item
    const timeSpent = calculateTimeDifference(item);

    for (const [memberNameKey, memberNameDisplay] of membersToCredit.entries()) {
      if (!teamMap.has(memberNameKey)) {
        const assignDate = item.given_date || item.actual1;

        teamMap.set(memberNameKey, {
          id: teamMap.size + 1,
          name: memberNameDisplay,
          teamName: teamNameLookup.get(memberNameKey) || "No Team",
          avatar: memberNameDisplay.charAt(0).toUpperCase(),
          assignDate: assignDate ? formatDateToDDMMYY(assignDate) : "No assign date",
          totalTasks: 0,
          completedTasks: 0,
          onTimeCompleted: 0,
          pendingTasks: 0,
          status: "available",
          nearestFutureDate: null,
          latestAssignDate: assignDate,
          timeSpent: timeSpent,
        });
      }

      const member = teamMap.get(memberNameKey);
      member.totalTasks++;

      const plannedData = item.planned3;
      const actualData = item.actual3;
      const plannedHasData = plannedData && plannedData.toString().trim() !== "";
      const actualHasData = actualData && actualData.toString().trim() !== "";

      if (plannedHasData && actualHasData) {
        member.completedTasks++;
        // On-time: completed_at <= expected_date_to_close (end of due day)
        if (isCompletedOnTime(item)) member.onTimeCompleted++;
      } else if (plannedHasData && !actualHasData) {
        member.pendingTasks++;

        // Track nearest future deadline
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const planned3Date = new Date(plannedData);

        if (!isNaN(planned3Date.getTime())) {
          planned3Date.setHours(0, 0, 0, 0);
          if (planned3Date > today) {
            if (!member.nearestFutureDate || planned3Date < member.nearestFutureDate) {
              member.nearestFutureDate = planned3Date;
            }
          }
        }

        // Reuse the already-computed timeSpent instead of calling calculateTimeDifference again
        const currentTimeMinutes = parseTimeStringToMinutes(member.timeSpent);
        const newTimeMinutes = parseTimeStringToMinutes(timeSpent);
        if (newTimeMinutes > currentTimeMinutes) {
          member.timeSpent = timeSpent;
        }
      } else if (!plannedHasData && actualHasData) {
        member.completedTasks++;
        if (isCompletedOnTime(item)) member.onTimeCompleted++;
      }

      // Update assign date to latest
      const assignDate = item.given_date || item.actual1;
      if (assignDate) {
        const currentDate = new Date(member.latestAssignDate || 0);
        const newDate = new Date(assignDate);
        if (!member.latestAssignDate || newDate > currentDate) {
          member.assignDate = formatDateToDDMMYY(assignDate);
          member.latestAssignDate = assignDate;
        }
      }
    }
  }

  // Set status based on nearest future deadline
  teamMap.forEach((member) => {
    if (member.nearestFutureDate) {
      member.status = formatDateToDDMMYY(member.nearestFutureDate);
    } else {
      member.status = "available";
    }
  });

  return Array.from(teamMap.values()).map((member) => ({
    ...member,
    tasksAssigned: member.pendingTasks,
    tasksCompleted: member.completedTasks,
    totalTasksGiven: member.totalTasks,
    completionRate: member.totalTasks
      ? Math.round((member.completedTasks / member.totalTasks) * 100)
      : 0,
    // % of completed tasks that finished on or before expected_date_to_close
    onTimeCompleted: member.onTimeCompleted || 0,
    onTimeRate: member.completedTasks
      ? Math.round((member.onTimeCompleted / member.completedTasks) * 100)
      : 0,
    timeSpent: member.timeSpent || "0h 0m",
  }));
};

/**
 * Task completed on time when status is Completed and completed_at is
 * on or before the end of expected_date_to_close day.
 * If no expected date, we do not count as on-time (strict).
 */
function isCompletedOnTime(item) {
  if (item.status !== "Completed" && !item.actual3) return false;
  const completedRaw = item.completed_at || item.actual3;
  const dueRaw = item.expected_date_to_close;
  if (!completedRaw || !dueRaw) return false;
  const completed = new Date(completedRaw);
  const due = new Date(dueRaw);
  if (isNaN(completed.getTime()) || isNaN(due.getTime())) return false;
  // Compare by calendar day: on-time if completed date <= due date (local)
  const c = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate());
  const d = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return c.getTime() <= d.getTime();
}



