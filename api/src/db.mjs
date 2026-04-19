import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasDB = Boolean(url && key);
export const supabase = hasDB
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

if (!hasDB) {
  console.warn("⚠️  Supabase not configured — running in DEMO mode (no persistence, no billing enforcement).");
}
