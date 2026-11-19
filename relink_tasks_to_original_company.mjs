/**
 * Relink user_tasks.company_id from Temp@2026 duplicate users → original users
 * (matched by exact company_name, non-Temp@2026 password)
 *
 * Usage:
 *   node relink_tasks_to_original_company.mjs            (dry run)
 *   node relink_tasks_to_original_company.mjs --apply    (applies to both PROD and TEST)
 *   node relink_tasks_to_original_company.mjs --apply --prod-only
 *   node relink_tasks_to_original_company.mjs --apply --test-only
 */
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY     = process.argv.includes("--apply");
const PROD_ONLY = process.argv.includes("--prod-only");
const TEST_ONLY = process.argv.includes("--test-only");

const env = dotenv.parse(fs.readFileSync(".env.sync"));
const PROD_HOST = "fekrswxjqpqnhuvkezxv.supabase.co";
const TEST_HOST = "ewbizsocjgibukmpjpcq.supabase.co";
if (new URL(env.PROD_SUPABASE_URL).host !== PROD_HOST) throw new Error("ABORT: PROD url mismatch");
if (new URL(env.TEST_SUPABASE_URL).host !== TEST_HOST) throw new Error("ABORT: TEST url mismatch");

const prodClient = createClient(env.PROD_SUPABASE_URL, env.PROD_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const testClient = createClient(env.TEST_SUPABASE_URL, env.TEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

async function fetchAllUsers(client) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("users").select("id, username, name, company_name, password, role, is_active").order("id").range(from, from + 999);
    if (error) throw new Error("fetch users: " + error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function fetchAllTasks(client) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("user_tasks").select("id, task_no, company_id").order("id").range(from, from + 999);
    if (error) throw new Error("fetch tasks: " + error.message);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function processDB(client, label) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(50));

  const users = await fetchAllUsers(client);
  const tasks = await fetchAllTasks(client);

  // Temp@2026 duplicates (by company_name)
  const tempUsers = users.filter(u => u.password === "Temp@2026" && u.role === "company");
  // Original users: same company_name, NOT Temp@2026
  const origUsers = users.filter(u => u.password !== "Temp@2026" && u.role === "company");

  // Build map: normalized company_name → original user (prefer is_active=true)
  const origByName = new Map();
  for (const u of origUsers) {
    const key = (u.company_name || "").trim().toLowerCase();
    if (!key) continue;
    const existing = origByName.get(key);
    if (!existing || (!existing.is_active && u.is_active)) {
      origByName.set(key, u);
    }
  }

  // Build remapping: tempUserId → originalUserId
  const remap = new Map(); // temp_id → orig_id
  const noMatch = [];
  for (const t of tempUsers) {
    const key = (t.company_name || "").trim().toLowerCase();
    const orig = origByName.get(key);
    if (orig) {
      remap.set(t.id, orig.id);
    } else {
      noMatch.push(t);
    }
  }

  console.log(`\nTemp@2026 company users  : ${tempUsers.length}`);
  console.log(`Successfully mapped       : ${remap.size}`);
  console.log(`No original found (skipped): ${noMatch.length}`);
  if (noMatch.length) {
    noMatch.forEach(u => console.log(`  SKIP id=${u.id} username="${u.username}" company_name="${u.company_name}"`));
  }

  // Find tasks that need relinking
  const toRelink = tasks.filter(t => t.company_id != null && remap.has(t.company_id));
  console.log(`\nTasks to relink: ${toRelink.length} / ${tasks.length}`);

  // Group by (old_id → new_id) for summary
  const grouped = new Map();
  for (const t of toRelink) {
    const newId = remap.get(t.company_id);
    const key = `${t.company_id}→${newId}`;
    if (!grouped.has(key)) grouped.set(key, { oldId: t.company_id, newId, tasks: [] });
    grouped.get(key).tasks.push(t.task_no);
  }

  // Print summary
  const tempById = new Map(tempUsers.map(u => [u.id, u]));
  const origById = new Map(origUsers.map(u => [u.id, u]));
  for (const [, g] of grouped) {
    const tu = tempById.get(g.oldId);
    const ou = origById.get(g.newId);
    console.log(`  [${g.tasks.length} tasks] "${tu?.company_name}" | temp id=${g.oldId} (${tu?.username}) → orig id=${g.newId} (${ou?.username})`);
  }

  if (!APPLY) return;

  // Apply in batches: update each unique (old → new) pair
  let updated = 0;
  for (const [, g] of grouped) {
    const taskIds = tasks.filter(t => t.company_id === g.oldId).map(t => t.id);
    // Update in chunks of 500
    for (let i = 0; i < taskIds.length; i += 500) {
      const chunk = taskIds.slice(i, i + 500);
      const { error } = await client.from("user_tasks").update({ company_id: g.newId }).in("id", chunk);
      if (error) throw new Error(`Update failed (${g.oldId}→${g.newId}): ${error.message}`);
      updated += chunk.length;
    }
    process.stdout.write(`\r  Updated ${updated}/${toRelink.length} tasks...`);
  }
  console.log(`\n✓ Relinked ${updated} tasks in ${label}`);
}

const dbs = [];
if (!TEST_ONLY) dbs.push({ client: prodClient, label: "PROD" });
if (!PROD_ONLY) dbs.push({ client: testClient, label: "TEST" });

for (const db of dbs) {
  await processDB(db.client, db.label);
}

if (!APPLY) {
  console.log("\n\nDry run complete. Run with --apply to apply changes to both DBs.");
}
