/**
 * Restore TEST users table from pre-sync backup.
 * Usage:
 *   node restore_test_users.mjs            (dry run)
 *   node restore_test_users.mjs --apply    (actually restores)
 */
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = dotenv.parse(fs.readFileSync(".env.sync"));

const TEST_HOST = "ewbizsocjgibukmpjpcq.supabase.co";
if (new URL(env.TEST_SUPABASE_URL).host !== TEST_HOST) throw new Error("ABORT: TEST url mismatch");

const test = createClient(env.TEST_SUPABASE_URL, env.TEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BACKUP_FILE = "backup_snapshot/2026-11-19T06-52-33-746Z-test-before-clone/users.json";
const users = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf8"));

console.log(`Mode: ${APPLY ? "APPLY (will restore)" : "DRY RUN (read only)"}`);
console.log(`Backup file: ${BACKUP_FILE}`);
console.log(`Users in backup: ${users.length}`);

// Current TEST users count
const { count: currentCount } = await test.from("users").select("*", { count: "exact", head: true });
console.log(`Current TEST users: ${currentCount}`);

if (!APPLY) {
  console.log("\nDry run complete. Run with --apply to restore.");
  process.exit(0);
}

// Fetch current TEST users to find differences
const allCurrent = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await test.from("users").select("*").order("id").range(from, from + 999);
  if (error) throw new Error("Fetch current users: " + error.message);
  allCurrent.push(...data);
  if (data.length < 1000) break;
}
const currentById = new Map(allCurrent.map(u => [u.id, u]));

// Only upsert rows that differ from current (avoids FK issues with wipe)
const toUpsert = users.filter(bk => {
  const cur = currentById.get(bk.id);
  if (!cur) return true; // new row
  return Object.keys(bk).some(k => JSON.stringify(bk[k]) !== JSON.stringify(cur[k]));
});
console.log(`Rows to upsert (changed/new): ${toUpsert.length}`);

if (toUpsert.length === 0) {
  console.log("Nothing to restore — backup matches current.");
  process.exit(0);
}

const CHUNK = 100;
let upserted = 0;
for (let i = 0; i < toUpsert.length; i += CHUNK) {
  const chunk = toUpsert.slice(i, i + CHUNK);
  const { error } = await test.from("users").upsert(chunk, { onConflict: "id" });
  if (error) throw new Error(`Upsert failed at row ${i}: ${error.message}`);
  upserted += chunk.length;
  process.stdout.write(`\rUpserted ${upserted}/${toUpsert.length}...`);
}

console.log(`\n✓ Restored ${upserted} changed users in TEST.`);
