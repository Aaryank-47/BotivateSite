import { createClient } from "@supabase/supabase-js";
import localSupabase, { resetLocalDb as _resetLocalDb } from "./localDb/localSupabase";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Connect to remote Supabase if credentials are provided; fallback to localDb if not.
const supabase = (supabaseURL && supabaseKey)
  ? createClient(supabaseURL, supabaseKey)
  : localSupabase;

if (!supabaseURL || !supabaseKey) {
  console.warn("Notice: Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are missing. Running in local fallback mode.");
}

export const resetLocalDb = _resetLocalDb;
export default supabase;

