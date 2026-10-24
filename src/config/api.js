// Centralized API configuration
// Google Sheets integration removed — app uses Supabase only.

export const API_CONFIG = {
  // Legacy placeholders (unused). Kept so old imports do not crash.
  FETCH_URL: "",
  UPDATE_URL: "",
  MASTER_SHEET_URL: "",
  MASTER_SHEET_LINK_URL: "",
};

/** @deprecated Sheets upload removed — prefer Supabase storage when wired. */
export const SHEET_URL = "";

export const AI_API_URL = "https://ai-agent-ja64.onrender.com";

export default API_CONFIG;
