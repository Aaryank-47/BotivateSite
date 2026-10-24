import { isProcessingCacheValid, dataCache, normalizeString } from "./cache"

/**
 * Process systems / user_tasks rows for SystemsList UI (schema v5).
 */
export const processSystemsData = (systemData, userRole, companyName) => {
  const cacheKey = `${userRole}_${companyName}_${systemData?.data?.length || 0}`

  if (isProcessingCacheValid(cacheKey)) {
    return dataCache.processingCache.get(cacheKey).data
  }

  if (!systemData?.data) {
    throw new Error("Invalid data format received")
  }

  const rows = systemData.data.map((row) => {
    const partyName =
      row.company?.name ||
      row.company?.company_name ||
      row.companies?.name ||
      row.party_name ||
      row.company_name ||
      ""
    const systemName =
      row.systems?.name ||
      row.system_name ||
      row.name ||
      ""
    return {
      ...row,
      party_name: partyName,
      system_name: systemName,
      type_of_work: row.type_of_work || row.type_of_system || "",
      status: row.status || row.status_of_system || "",
      description_of_work: row.description_of_work || row.department_name || "",
      team_member_name:
        row.assigned_member?.name ||
        row.assigned_member?.username ||
        row.team_member_name ||
        "",
      priority_in_customer: row.priority || row.priority_in_customer || "Medium",
      expected_date_to_close: row.expected_date_to_close || null,
      website_link: row.website_link || row.link_of_system || "",
    }
  })

  let resultSystems = []

  if (userRole === "admin") {
    const uniqueSystems = rows.filter((row, index, self) =>
      index ===
      self.findIndex(
        (r) =>
          (r.system_name?.trim().toLowerCase() || "na") ===
            (row.system_name?.trim().toLowerCase() || "na") &&
          (r.party_name?.trim().toLowerCase() || "na") ===
            (row.party_name?.trim().toLowerCase() || "na")
      )
    )

    resultSystems = uniqueSystems.map((row, index) => {
      const systemName = row.system_name?.trim() || "N/A"
      const systemPartyName = row.party_name?.trim() || "N/A"

      const matchingSystemRecords = rows.filter(
        (sysRow) =>
          sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
          sysRow.party_name?.toLowerCase().trim() === systemPartyName.toLowerCase()
      )

      const existingSystemEditCount = matchingSystemRecords.filter((sys) =>
        (sys.type_of_work || "").toLowerCase().includes("existing system edit & update")
      ).length

      const formattedSystemData = matchingSystemRecords.map((sysRow) => ({
        party_name: sysRow.party_name || "N/A",
        system_name: sysRow.system_name || "N/A",
        type_of_work: sysRow.type_of_work || "N/A",
        description_of_work: sysRow.description_of_work || "N/A",
        actual1: sysRow.assigned_at || sysRow.given_date || "N/A",
        expected_date_to_close: sysRow.expected_date_to_close || "N/A",
        taken_from: sysRow.taken_from || "N/A",
        priority_in_customer: sysRow.priority_in_customer || "N/A",
        team_member_name: sysRow.team_member_name || "N/A",
        status: sysRow.status || "N/A",
        remarks: sysRow.remarks || "N/A",
        flowchart: sysRow.flowchart || "N/A",
      }))

      return {
        id: row.id,
        sno: index + 1,
        system_name: systemName,
        systemName,
        party_name: systemPartyName,
        partyName: systemPartyName,
        description_of_work: row.description_of_work || "N/A",
        departmentName: row.description_of_work || "N/A",
        type_of_work: row.type_of_work || "N/A",
        typeOfSystem: row.type_of_work || "N/A",
        status: row.status || "",
        total_updation: matchingSystemRecords.length,
        totalUpdation: matchingSystemRecords.length,
        flowchart: row.flowchart || "N/A",
        version: "v1.0.0",
        lastUpdate: new Date().toISOString().split("T")[0],
        url:
          row.website_link ||
          `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
        description: `${row.type_of_work || "System"} for ${row.description_of_work || "department"}`,
        technology: "Web Application",
        developer: "System Admin",
        systemData: formattedSystemData,
        existingSystemEditCount,
      }
    })
  } else {
    const companyKey = normalizeString(companyName)

    resultSystems = rows
      .filter((systemRow) => normalizeString(systemRow.party_name) === companyKey)
      .map((row, index) => {
        const systemName = row.system_name?.trim() || "N/A"
        const partyName = row.party_name?.trim() || "N/A"

        const matchingSystemRecords = rows.filter(
          (sysRow) =>
            sysRow.system_name?.toLowerCase().trim() === systemName.toLowerCase() &&
            sysRow.party_name?.toLowerCase().trim() === partyName.toLowerCase()
        )

        const existingSystemEditCount = matchingSystemRecords.filter((sys) =>
          (sys.type_of_work || "").toLowerCase().includes("existing system edit & update")
        ).length

        const formattedSystemData = matchingSystemRecords.map((sysRow) => ({
          party_name: sysRow.party_name || "N/A",
          system_name: sysRow.system_name || "N/A",
          type_of_work: sysRow.type_of_work || "N/A",
          description_of_work: sysRow.description_of_work || "N/A",
          actual1: sysRow.assigned_at || sysRow.given_date || "N/A",
          expected_date_to_close: sysRow.expected_date_to_close || "N/A",
          taken_from: sysRow.taken_from || "N/A",
          priority_in_customer: sysRow.priority_in_customer || "N/A",
          team_member_name: sysRow.team_member_name || "N/A",
          status: sysRow.status || "N/A",
          remarks: sysRow.remarks || "N/A",
          flowchart: sysRow.flowchart || "N/A",
        }))

        return {
          id: row.id,
          sno: index + 1,
          system_name: systemName,
          systemName,
          party_name: partyName,
          partyName,
          description_of_work: row.description_of_work || "N/A",
          departmentName: row.description_of_work || "N/A",
          type_of_work: row.type_of_work || "N/A",
          typeOfSystem: row.type_of_work || "N/A",
          status: row.status || "",
          total_updation: matchingSystemRecords.length,
          totalUpdation: matchingSystemRecords.length,
          flowchart: row.flowchart || "N/A",
          version: "v1.0.0",
          lastUpdate: new Date().toISOString().split("T")[0],
          url:
            row.website_link ||
            `https://${systemName.toLowerCase().replace(/\s+/g, "")}.com`,
          description: `${row.type_of_work || "System"} for ${row.description_of_work || "department"}`,
          technology: "Web Application",
          developer: "System Admin",
          systemData: formattedSystemData,
          existingSystemEditCount,
        }
      })
  }

  dataCache.processingCache.set(cacheKey, {
    data: resultSystems,
    timestamp: Date.now(),
  })

  if (dataCache.processingCache.size > 5) {
    const oldestKey = dataCache.processingCache.keys().next().value
    dataCache.processingCache.delete(oldestKey)
  }

  return resultSystems
}
