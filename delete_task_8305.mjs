/**
 * Delete task TK-8305 and all linked data from PROD and TEST.
 * Usage:
 *   node delete_task_8305.mjs            (dry run - shows what will be deleted)
 *   node delete_task_8305.mjs --apply    (actually deletes)
 */
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = dotenv.parse(fs.readFileSync(".env.sync"));

const PROD_HOST = "fekrswxjqpqnhuvkezxv.supabase.co";
const TEST_HOST = "ewbizsocjgibukmpjpcq.supabase.co";
if (new URL(env.PROD_SUPABASE_URL).host !== PROD_HOST) throw new Error("ABORT: PROD url mismatch");
if (new URL(env.TEST_SUPABASE_URL).host !== TEST_HOST) throw new Error("ABORT: TEST url mismatch");

const prod = createClient(env.PROD_SUPABASE_URL, env.PROD_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const test = createClient(env.TEST_SUPABASE_URL, env.TEST_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TASK_NO = "TK-8305";

async function findAndDelete(client, label) {
  console.log(`\n========== ${label} ==========`);

  // 1. Find the task in user_tasks
  const { data: tasks, error: tErr } = await client.from("user_tasks").select("*").eq("task_no", TASK_NO);
  if (tErr) throw new Error(`user_tasks query: ${tErr.message}`);

  if (!tasks || tasks.length === 0) {
    console.log(`  [${label}] Task ${TASK_NO} NOT found in user_tasks — skipping`);
    return;
  }

  const task = tasks[0];
  console.log(`  Found task: id=${task.id}, task_no=${task.task_no}, title="${task.title}", company="${task.company_name}"`);

  const taskId = task.id;

  // 2. Find linked data
  const { data: subtasks } = await client.from("task_subtasks").select("id, title").eq("task_id", taskId);
  const { data: delegated } = await client.from("delegated_tasks").select("id").eq("task_id", taskId);
  let checklist = [];
  try {
    const r = await client.from("checklist_tasks").select("id").eq("task_id", taskId);
    checklist = r.data || [];
  } catch { /* table may not exist */ }

  console.log(`  Linked: subtasks=${subtasks?.length ?? 0}, delegated=${delegated?.length ?? 0}, checklist=${checklist?.length ?? 0}`);

  if (!APPLY) {
    console.log(`  [DRY RUN] Would delete task id=${taskId} and all linked rows`);
    return;
  }

  // 3. Delete in order (children first)
  if (subtasks?.length) {
    const { error } = await client.from("task_subtasks").delete().eq("task_id", taskId);
    if (error) console.error(`  ERROR deleting subtasks: ${error.message}`);
    else console.log(`  Deleted ${subtasks.length} subtask(s)`);
  }

  if (delegated?.length) {
    const { error } = await client.from("delegated_tasks").delete().eq("task_id", taskId);
    if (error) console.error(`  ERROR deleting delegated_tasks: ${error.message}`);
    else console.log(`  Deleted ${delegated.length} delegated_task(s)`);
  }

  if (checklist?.length) {
    const { error } = await client.from("checklist_tasks").delete().eq("task_id", taskId);
    if (error) console.error(`  ERROR deleting checklist_tasks: ${error.message}`);
    else console.log(`  Deleted ${checklist.length} checklist_task(s)`);
  }

  // 4. Delete the task itself
  const { error: delErr } = await client.from("user_tasks").delete().eq("id", taskId);
  if (delErr) console.error(`  ERROR deleting user_tasks row: ${delErr.message}`);
  else console.log(`  ✓ Deleted task ${TASK_NO} (id=${taskId}) from user_tasks`);
}

console.log(`Mode: ${APPLY ? "APPLY (will delete)" : "DRY RUN (read only)"}`);
console.log(`Target task: ${TASK_NO}`);

await findAndDelete(prod, "PROD");
await findAndDelete(test, "TEST");

if (!APPLY) {
  console.log("\n\nDry run complete. Run with --apply to actually delete.");
} else {
  console.log("\n\nDone. Task TK-8305 deleted from both PROD and TEST.");
}
