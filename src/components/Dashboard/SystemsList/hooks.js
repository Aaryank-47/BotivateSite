import { useState, useEffect, useCallback } from "react"

export function useCalculateTotalUpdate(completeData) {
  const [totalUpdateMap, setTotalUpdateMap] = useState({}); // { "<party|system>": count }
  const [totalUpdateDataMap, setTotalUpdateDataMap] = useState({}); // { "<party|system>": [data] }

  useEffect(() => {
    if (!completeData || completeData.length === 0) {
      setTotalUpdateMap({});
      setTotalUpdateDataMap({});
      return;
    }

    const countMap = {};
    const dataMap = {};

    completeData.forEach(row => {
      const key = `${row.party_name?.trim().toLowerCase()}|${row.system_name?.trim().toLowerCase()}`;
      
      // Initialize if not exist
      if (!countMap[key]) countMap[key] = 0;
      if (!dataMap[key]) dataMap[key] = [];

      // Count and collect data for "Existing System Edit & Update"
      if ((row.type_of_work || "").toLowerCase() === "existing system edit & update") {
        countMap[key] += 1;
        dataMap[key].push(row);
      }
    });

    setTotalUpdateMap(countMap);
    setTotalUpdateDataMap(dataMap);
  }, [completeData]);

  // Function to get total updates for a specific row
  const getTotalUpdate = useCallback((row) => {
    const key = `${row.party_name?.trim().toLowerCase()}|${row.system_name?.trim().toLowerCase()}`;
    return totalUpdateMap[key] || 0;
  }, [totalUpdateMap]);

  // Function to get update data for a specific row
  const getUpdateData = useCallback((row) => {
    const key = `${row.party_name?.trim().toLowerCase()}|${row.system_name?.trim().toLowerCase()}`;
    return totalUpdateDataMap[key] || [];
  }, [totalUpdateDataMap]);

  return { getTotalUpdate, getUpdateData };
}

export function useTotalUpdate(completeData = []) {
  return useCallback(
    (system) => {
      if (!system || !completeData) return 0;

      const systemParty = system.partyName?.toLowerCase().trim() || "";
      const systemName = system.systemName?.toLowerCase().trim() || "";

      return completeData.filter(
        (row) =>
          (row.party_name?.toLowerCase().trim() || "") === systemParty &&
          (row.system_name?.toLowerCase().trim() || "") === systemName
      ).length;
    },
    [completeData]
  );
}
