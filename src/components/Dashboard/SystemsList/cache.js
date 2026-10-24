import supabase from "../../../supabaseClient"

const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes
const QUICK_CACHE_TIME = 2 * 1000 // 2 seconds for instant UI
const PROCESSING_CACHE_TIME = 30 * 1000 // 30 seconds for processed data

// Global cache objects
export let dataCache = {
  fmsData: null,
  systemListData: null,
  lastFetched: 0,
  quickCache: {
    systems: null,
    processedData: null,
    lastCached: 0
  },
  processingCache: new Map()
}

// ✅ Cache validation functions
export const isCacheValid = () => {
  return dataCache.fmsData && dataCache.systemListData &&
    (Date.now() - dataCache.lastFetched) < CACHE_EXPIRY_TIME
}

export const isQuickCacheValid = () => {
  return dataCache.quickCache.systems &&
    (Date.now() - dataCache.quickCache.lastCached) < QUICK_CACHE_TIME
}

export const isProcessingCacheValid = (cacheKey) => {
  const cached = dataCache.processingCache.get(cacheKey)
  return cached && (Date.now() - cached.timestamp) < PROCESSING_CACHE_TIME
}

// Utility functions
export const normalizeString = (str) => {
  return str ? str.toString().toLowerCase().trim() : ''
}

// ✅ Optimized fetch functions with caching
export const fetchSupabaseDataCached = async (tableName) => {
  // Map legacy table names to new schema
  const resolvedTable =
    tableName === "FMS" || tableName === "fms"
      ? "user_tasks"
      : tableName === "SystemList" || tableName === "system_list"
        ? "systems"
        : tableName

  if (isCacheValid()) {
    return resolvedTable === "user_tasks" ? dataCache.fmsData : dataCache.systemListData
  }

  try {
    let selectClause = "*"
    if (resolvedTable === "user_tasks") {
      selectClause = `
        *,
        company:users!user_tasks_company_id_fkey ( id, name, company_name ),
        systems ( id, name ),
        assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username )
      `
    }

    let { data, error } = await supabase
      .from(resolvedTable)
      .select(selectClause)

    if (error) throw error
    if (!data) throw new Error("No data received")

    if (resolvedTable === "user_tasks") {
      data = data.map((row) => ({
        ...row,
        party_name: row.company?.name || row.company?.company_name || "",
        system_name: row.systems?.name || row.system_name || "",
        team_member_name:
          row.assigned_member?.name ||
          row.assigned_member?.username ||
          "",
        type_of_system: row.type_of_work || "",
        status_of_system: row.status || "",
      }))
      dataCache.fmsData = { data }
    } else if (resolvedTable === "systems") {
      dataCache.systemListData = { data }
    }

    if (dataCache.fmsData && dataCache.systemListData) {
      dataCache.lastFetched = Date.now()
    }

    return { data }
  } catch (error) {
    console.error(`Error fetching ${resolvedTable} data:`, error)
    throw error
  }
}
