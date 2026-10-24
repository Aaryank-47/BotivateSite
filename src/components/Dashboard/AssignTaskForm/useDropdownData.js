import { useState, useEffect, useCallback } from "react";
import {
  fetchCompanies,
  fetchSystems,
  fetchAssignableMembers,
  fetchTakenFromUsers,
  WORK_TYPE_OPTIONS,
} from "../../../services/schemaApi";

export const useDropdownData = (userRole, currentUserId) => {
  const [companies, setCompanies] = useState([]);
  const [assignableMembers, setAssignableMembers] = useState([]);
  const [takenFromUsers, setTakenFromUsers] = useState([]);
  const [workTypes] = useState(WORK_TYPE_OPTIONS);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const [systems, setSystems] = useState([]);
  const [isLoadingSystems, setIsLoadingSystems] = useState(false);

  const fetchDropdownData = useCallback(async () => {
    try {
      setIsLoadingDropdowns(true);
      const [companyRows, memberRows, takenFromRows] = await Promise.all([
        fetchCompanies(),
        fetchAssignableMembers(currentUserId),
        fetchTakenFromUsers(currentUserId),
      ]);
      setCompanies(companyRows);
      setAssignableMembers(memberRows);
      setTakenFromUsers(takenFromRows);
    } catch (error) {
      console.error("❌ Error fetching dropdown data:", error.message);
      setCompanies([]);
      setAssignableMembers([]);
      setTakenFromUsers([]);
    } finally {
      setIsLoadingDropdowns(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Fetch systems that belong to a given company id.
  const fetchSystemsForCompany = async (companyId) => {
    if (!companyId) {
      setSystems([]);
      return;
    }
    setIsLoadingSystems(true);
    try {
      const rows = await fetchSystems(companyId);
      setSystems(rows);
    } catch (error) {
      console.error("❌ Error fetching systems:", error.message);
      setSystems([]);
    } finally {
      setIsLoadingSystems(false);
    }
  };

  return {
    companies,
    assignableMembers,
    takenFromUsers,
    workTypes,
    isLoadingDropdowns,
    systems,
    setSystems,
    isLoadingSystems,
    fetchSystemsForCompany,
  };
};
