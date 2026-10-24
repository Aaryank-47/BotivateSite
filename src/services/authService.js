/**
 * LEGACY auth helpers (Google Sheets era).
 * Login now uses Supabase users table via LoginModal.
 * Sheet fetchers are no-ops so old imports do not hang the UI.
 */


export const fetchMasterSheetLinkData = async () => {
  console.warn("[authService] Google Sheets removed — fetchMasterSheetLinkData is a no-op");
  return null;
};

export const fetchMasterSheetData = async () => {
  console.warn("[authService] Google Sheets removed — fetchMasterSheetData is a no-op");
  return null;
};

export const getUserFilterData = async (username, role) => {
  console.warn("[authService] Google Sheets removed — getUserFilterData is a no-op");
  return null;
};
