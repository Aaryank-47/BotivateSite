/**
 * Attachment upload helper.
 * Google Sheets / Drive upload removed. Returns empty string so task create
 * still works without attachment URL. Wire Supabase Storage here later.
 */
export const uploadFileToGoogleDrive = async (file, taskNumber) => {
  if (!file) return "";
  console.warn(
    "[uploadFile] External Drive upload disabled. Skipping file:",
    file.name,
    "task:",
    taskNumber
  );
  return "";
};
