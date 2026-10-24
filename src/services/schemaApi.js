// ============================================================================
// schemaApi.js
// Central data-access layer for Botivate v6 Supabase schema
// (users [incl. company accounts], teams, systems, cmp_task, user_tasks)
// ============================================================================
import supabase from "../supabaseClient";
import { requestCountsRefresh } from "../utils/sidebarCounts";

// Clean up any deprecated localStorage task/entity overrides so browser stays strictly synced with Supabase DB
try {
  if (typeof window !== "undefined" && window.localStorage) {
    [
      "botivate_task_overrides_v1",
      "botivate_local_tasks_v1",
      "botivate_task_testing_v1",
      "botivate_orders_v1",
      "botivate_checklist_tasks",
      "botivate_weekly_calls",
      "botivate_checklist_weekly_demo_v1",
    ].forEach((k) => window.localStorage.removeItem(k));
  }
} catch {
  /* ignore */
}

// ---------------------------------------------------------------------------
// Companies = users with role = 'company' (no separate companies table)
// ---------------------------------------------------------------------------
export const fetchCompanies = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, company_name, username")
    .eq("role", "company")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map((u) => ({
    id: u.id,
    name: u.company_name || u.name,
    username: u.username,
  }));
};

export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, role, company_name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const fetchAssignableMembers = async (excludeUserId = null) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, role")
    .eq("is_active", true)
    // employee + hod (e.g. Rahul Sharma) — only valid user_role_enum values
    .in("role", ["employee", "hod"])
    .order("name", { ascending: true });
  if (error) throw error;
  const rows = data || [];
  return excludeUserId
    ? rows.filter((u) => String(u.id) !== String(excludeUserId))
    : rows;
};

/**
 * Assignable employees sorted by availability (fewest active tasks as Member 1 first).
 * activeCount = tasks where assigned_member_1 = user and status is Pending / In Progress / On Hold.
 * Free members (activeCount === 0) appear first in the dropdown.
 */
export const fetchAssignableMembersWithLoad = async (excludeUserId = null) => {
  const members = await fetchAssignableMembers(excludeUserId);
  if (!members.length) return [];

  const ids = members.map((m) => m.id);
  const { data: taskRows, error } = await supabase
    .from("user_tasks")
    .select("id, status, assigned_member_1")
    .in("assigned_member_1", ids)
    .in("status", ["Pending", "In Progress", "On Hold"]);
  if (error) throw error;

  const counts = {};
  ids.forEach((id) => {
    counts[id] = 0;
  });
  (taskRows || []).forEach((t) => {
    const uid = Number(t.assigned_member_1);
    if (uid && counts[uid] !== undefined) counts[uid] += 1;
  });

  return members
    .map((m) => ({
      ...m,
      activeCount: counts[m.id] || 0,
      isFree: (counts[m.id] || 0) === 0,
    }))
    .sort((a, b) => {
      if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
      return (a.name || a.username || "").localeCompare(b.name || b.username || "");
    });
};

export const fetchSystems = async (companyId = null) => {
  let query = supabase
    .from("systems")
    .select(
      "id, company_id, name, type_of_system, status_of_system, department_name, website_link, system_username, system_password, dummy_link, dummy_username, dummy_password, description, environment, company:users!systems_company_id_fkey ( id, name, company_name )"
    )
    .order("name", { ascending: true });
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const fetchTeamsForHod = async (hodId) => {
  const { data, error } = await supabase
    .from("teams")
    .select(`
      id, name, team_type, description, is_active, hod_id,
      team_members ( id, user_id, users ( id, name, username, role ) )
    `)
    .eq("hod_id", hodId)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const fetchTeamMembers = async (teamId) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, user_id, users ( id, name, username, role )")
    .eq("team_id", teamId);
  if (error) throw error;
  return data || [];
};

export const WORK_TYPE_OPTIONS = [
  "Complain Report",
  "Error Received",
  "Existing System Edit & Update",
  "System Dummy",
  "System Actual",
  "Meeting",
];
export const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
export const EMPL_TASK_STATUS_OPTIONS = [
  "Pending", "In Progress", "Completed", "On Hold", "Cancelled",
];
export const USER_TASK_STATUS_OPTIONS = EMPL_TASK_STATUS_OPTIONS;
export const CMP_TASK_STATUS_OPTIONS = ["Open", "Converted", "Closed"];
export const TEAM_TYPE_OPTIONS = [
  "Development", "Support", "QA", "Operations", "Sales", "General",
];
export const USER_ROLE_OPTIONS = [
  "employee", "company", "hod", "admin", "superadmin",
];
export const TAKEN_FROM_SUGGESTIONS = [];

export const fetchTakenFromUsers = async (excludeUserId = null) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, name, role")
    .eq("is_active", true)
    .eq("role", "employee")
    .order("name", { ascending: true });
  if (error) throw error;
  const rows = data || [];
  if (!excludeUserId) return rows;
  return rows.filter((u) => String(u.id) !== String(excludeUserId));
};

const USER_TASKS_SELECT = `
  id, task_no, given_date, posted_by, taken_from, company_id, type_of_work,
  expected_date_to_close, description_of_work, system_id, link_of_system,
  attachment_file, priority, notes, time_required, assigned_member_1, assigned_member_2,
  assigned_by, remarks,
  status, assigned_at, approved_by, approved_at, completed_at, created_at, updated_at,
  company:users!user_tasks_company_id_fkey ( id, name, company_name ),
  systems ( id, name ),
  posted_by_user:users!user_tasks_posted_by_fkey ( id, name ),
  taken_from_user:users!user_tasks_taken_from_fkey ( id, name, username ),
  assigned_member_1_user:users!user_tasks_assigned_member_1_fkey ( id, name, username ),
  assigned_member_2_user:users!user_tasks_assigned_member_2_fkey ( id, name, username ),
  assigned_by_user:users!user_tasks_assigned_by_fkey ( id, name )
`;

// ─── Sub-tasks (task_subtasks) ───────────────────────────────────────────────
// Main tasks live in user_tasks; their rework / issue tasks (TASK-00047-1, ...) live in
// task_subtasks with the same task columns + root_task_id. Ids are shared by both tables
// (one sequence, see migration_task_subtasks.sql), so an id alone tells which table it is in.

/** Same select for task_subtasks: its foreign keys are named task_subtasks_<col>_fkey. */
export const subtaskSelect = (select) => select.replaceAll("user_tasks_", "task_subtasks_");

/** Marks a task_subtasks row so the task screens treat it like the old rework rows. */
export const asSubtask = (row) => ({ ...row, is_subtask: true, is_testing_issue: true });

/**
 * Runs the same query on user_tasks and task_subtasks and returns both lists merged, newest id first.
 * `applyFilters(query)` adds the filters (.eq / .in / ...) to each query.
 */
export const fetchTasksWithSubtasks = async (select, applyFilters = (q) => q) => {
  const [main, subs] = await Promise.all([
    applyFilters(supabase.from("user_tasks").select(select)),
    applyFilters(supabase.from("task_subtasks").select(subtaskSelect(select))),
  ]);
  if (main.error) throw main.error;
  if (subs.error) throw subs.error;
  return [...(main.data || []), ...(subs.data || []).map(asSubtask)].sort((a, b) => b.id - a.id);
};

/** "task_subtasks" if the id is a sub-task, else "user_tasks". */
export const taskTableOf = async (id) => {
  const { data, error } = await supabase.from("task_subtasks").select("id").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? "task_subtasks" : "user_tasks";
};

export const fetchEmplTasks = async ({
  companyId = null, assignedMemberId = null, status = null, limit = 200,
} = {}) => {
  const rows = await fetchTasksWithSubtasks(USER_TASKS_SELECT, (query) => {
    query = query.order("id", { ascending: false }).limit(limit);
    if (companyId) query = query.eq("company_id", companyId);
    if (assignedMemberId) query = query.eq("assigned_member_1", assignedMemberId);
    if (status) query = query.eq("status", status);
    return query;
  });
  return rows.slice(0, limit);
};
export const fetchUserTasks = fetchEmplTasks;

export const createEmplTask = async (payload) => {
  const row = { ...payload };

  // Auto-extend expected_date_to_close past Sundays + holidays so on-time
  // metrics stay fair. Safe to run once at create (do not re-run on updates).
  if (row.expected_date_to_close && row.given_date) {
    try {
      const holidayRows = await fetchHolidays();
      const { extendExpectedDateISO } = await import("../utils/workingDays");
      const extended = extendExpectedDateISO(
        row.given_date,
        row.expected_date_to_close,
        holidayRows
      );
      if (extended) row.expected_date_to_close = extended;
    } catch (e) {
      console.warn("createEmplTask holiday extend skipped:", e);
    }
  }

  const { data, error } = await supabase.from("user_tasks").insert([row]).select(USER_TASKS_SELECT);
  if (error) throw error;
  return data?.[0];
};
export const createUserTask = createEmplTask;

export const updateEmplTask = async (id, payload) => {
  const table = await taskTableOf(id);
  const select = table === "task_subtasks" ? subtaskSelect(USER_TASKS_SELECT) : USER_TASKS_SELECT;
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select(select);
  if (error) throw error;
  return table === "task_subtasks" && data?.[0] ? asSubtask(data[0]) : data?.[0];
};
export const updateUserTask = updateEmplTask;

/**
 * Forward task: active owner (Member 1) → Member 2 (or explicit nextMemberId).
 * Pending only lists assigned_member_1, so the task moves queues on forward.
 * Previous owner is kept on assigned_member_2.
 */
export const forwardEmplTask = async (taskId, optsOrCurrentUserId = {}, maybeNextMemberId) => {
  let nextMemberId = null;
  let byUserId = null;
  let requireOwner = false;
  let currentUserId = null;

  if (
    optsOrCurrentUserId !== null &&
    typeof optsOrCurrentUserId === "object" &&
    !Array.isArray(optsOrCurrentUserId)
  ) {
    nextMemberId = optsOrCurrentUserId.nextMemberId ?? null;
    byUserId = optsOrCurrentUserId.byUserId ?? null;
    requireOwner = !!optsOrCurrentUserId.requireOwner;
    currentUserId = optsOrCurrentUserId.currentUserId ?? null;
  } else {
    // legacy: forwardEmplTask(taskId, currentUserId, nextMemberId)
    currentUserId = optsOrCurrentUserId;
    nextMemberId = maybeNextMemberId ?? null;
    requireOwner = true;
    byUserId = currentUserId;
  }

  const table = await taskTableOf(taskId);
  const { data: task, error: fetchErr } = await supabase
    .from(table)
    .select("id, status, assigned_member_1, assigned_member_2, remarks")
    .eq("id", taskId)
    .single();
  if (fetchErr) throw fetchErr;
  if (!task) throw new Error("Task not found.");

  const st = (task.status || "").toLowerCase();
  if (st === "completed" || st === "cancelled") {
    throw new Error("Cannot forward a completed or cancelled task.");
  }

  const owner = task.assigned_member_1 ? Number(task.assigned_member_1) : null;
  const backup = task.assigned_member_2 ? Number(task.assigned_member_2) : null;
  const target = nextMemberId ? Number(nextMemberId) : backup;
  if (!target) {
    throw new Error(
      "No Member 2 assigned. Set Assign Member 2 first, or pick who to forward to."
    );
  }
  if (owner && Number(target) === Number(owner)) {
    throw new Error("Already owned by this member.");
  }
  if (requireOwner) {
    if (!currentUserId || Number(currentUserId) !== Number(owner)) {
      throw new Error("Only the current owner (Member 1) can forward this task.");
    }
  }

  const stamp = new Date().toISOString();
  const prevLines = task.remarks ? String(task.remarks).split("\n") : [];
  const forwardCount = prevLines.filter((l) => /forward/i.test(l)).length + 1;

  // Look up user names for cleaner, human-readable remarks
  let ownerName = owner ? `#${owner}` : "?";
  let targetName = target ? `#${target}` : "?";
  let byUserName = byUserId ? `#${byUserId}` : "";

  try {
    const idsToLookup = [owner, target, byUserId].filter(Boolean).map(Number);
    if (idsToLookup.length > 0) {
      const { data: userRows } = await supabase
        .from("users")
        .select("id, name, username")
        .in("id", idsToLookup);
      if (userRows?.length) {
        const map = new Map(userRows.map((u) => [u.id, u.name || u.username]));
        if (owner && map.has(owner)) ownerName = map.get(owner);
        if (target && map.has(target)) targetName = map.get(target);
        if (byUserId && map.has(Number(byUserId))) byUserName = map.get(Number(byUserId));
      }
    }
  } catch (lookupErr) {
    console.warn("User lookup for forward log failed:", lookupErr);
  }

  const line = `Forwarded #${forwardCount} (${stamp.slice(0, 10)}${
    byUserName ? ` by ${byUserName}` : ""
  }): ${ownerName} → ${targetName}`;
  const remarks = task.remarks ? `${String(task.remarks)}\n${line}` : line;

  const { data, error } = await supabase
    .from(table)
    .update({
      assigned_member_1: target,
      assigned_member_2: owner,
      assigned_at: stamp,
      assigned_by: byUserId ? Number(byUserId) : null,
      status: "In Progress",
      remarks,
      updated_at: stamp,
    })
    .eq("id", taskId)
    .select(table === "task_subtasks" ? subtaskSelect(USER_TASKS_SELECT) : USER_TASKS_SELECT);
  if (error) throw error;
  if (!data?.length) throw new Error("Forward failed.");
  return table === "task_subtasks" ? asSubtask(data[0]) : data[0];
};
export const forwardUserTask = forwardEmplTask;

const CMP_TASK_SELECT = `
  id, task_name, description, company_id, system_id, posted_by,
  assigned_member_id, assigned_by, priority, status, created_at,
  link_of_system, attachment_file, notes, remarks, time_required,
  given_date, expected_date_to_close,
  converted_task_id,
  company:users!cmp_task_company_id_fkey ( id, name, company_name ),
  systems ( id, name ),
  posted_by_user:users!cmp_task_posted_by_fkey ( id, name ),
  assigned_member:users!cmp_task_assigned_member_id_fkey ( id, name ),
  assigned_by_user:users!cmp_task_assigned_by_fkey ( id, name ),
  converted_task:user_tasks!cmp_task_converted_task_id_fkey ( id, task_no, status )
`;

export const fetchCmpTasks = async ({ companyId = null, status = null, limit = 200 } = {}) => {
  let query = supabase.from("cmp_task").select(CMP_TASK_SELECT)
    .order("id", { ascending: false }).limit(limit);
  if (companyId) query = query.eq("company_id", companyId);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createCmpTask = async (payload) => {
  const row = { ...payload };

  // Auto-extend expected_date_to_close past Sundays + holidays (same as createEmplTask)
  if (row.expected_date_to_close && row.given_date) {
    try {
      const holidayRows = await fetchHolidays();
      const { extendExpectedDateISO } = await import("../utils/workingDays");
      const extended = extendExpectedDateISO(
        row.given_date,
        row.expected_date_to_close,
        holidayRows
      );
      if (extended) row.expected_date_to_close = extended;
    } catch (e) {
      console.warn("createCmpTask holiday extend skipped:", e);
    }
  }

  const { data, error } = await supabase.from("cmp_task").insert([row]).select(CMP_TASK_SELECT);
  if (error) throw error;
  return data?.[0];
};

export const updateCmpTask = async (id, payload) => {
  const { data, error } = await supabase.from("cmp_task").update(payload).eq("id", id).select(CMP_TASK_SELECT);
  if (error) throw error;
  return data?.[0];
};


/**
 * Developer Stage core action:
 * Convert an Open company ticket (cmp_task) into an internal user_tasks row.
 *
 * - Creates user_tasks (optionally assigned to member_1)
 * - Marks cmp_task status = Converted and stores converted_task_id
 * - On link failure, rolls back the created user_task
 */
export const convertCmpTaskToUserTask = async ({
  cmpTask,
  typeOfWork,
  expectedDateToClose,
  takenFromUserId,
  assignedMember1Id = null,
  assignedMember2Id = null,
  assignedByUserId = null,
  remarks = null,
  timeRequired = null,
}) => {
  if (!cmpTask?.id) throw new Error("Missing company ticket.");
  if (!typeOfWork) throw new Error("Type of work is required.");
  if (!expectedDateToClose) throw new Error("Expected date to close is required.");
  if (!takenFromUserId) throw new Error("Taken From (person) is required.");
  if (!assignedByUserId) throw new Error("Converter user id is required.");
  if (Number(assignedByUserId) === Number(takenFromUserId)) {
    throw new Error("Posted By (you) and Taken From must be different people.");
  }

  const desc =
    [cmpTask.task_name, cmpTask.description].filter(Boolean).join(" — ") ||
    cmpTask.task_name ||
    "Converted company ticket";

  const member1 = assignedMember1Id ? Number(assignedMember1Id) : null;
  const now = new Date().toISOString();

  // expected_date_to_close is auto-extended inside createEmplTask (Sundays + holidays)
  const userTaskPayload = {
    given_date: now,
    posted_by: Number(assignedByUserId),
    taken_from: Number(takenFromUserId),
    company_id: Number(cmpTask.company_id),
    type_of_work: typeOfWork,
    expected_date_to_close: new Date(expectedDateToClose).toISOString(),
    description_of_work: desc,
    system_id: cmpTask.system_id ? Number(cmpTask.system_id) : null,
    link_of_system: cmpTask.link_of_system || null,
    attachment_file: cmpTask.attachment_file || null,
    priority: cmpTask.priority || "Medium",
    notes: cmpTask.notes || null,
    time_required: timeRequired ? new Date(timeRequired).toISOString() : null,
    assigned_member_1: member1,
    assigned_member_2: assignedMember2Id ? Number(assignedMember2Id) : null,
    assigned_by: member1 ? Number(assignedByUserId) : null,
    assigned_at: member1 ? now : null,
    remarks: remarks || cmpTask.remarks || null,
    status: member1 ? "In Progress" : "Pending",
  };

  const created = await createUserTask(userTaskPayload);
  if (!created?.id) throw new Error("Failed to create internal task.");

  try {
    const updated = await updateCmpTask(cmpTask.id, {
      status: "Converted",
      assigned_member_id: member1,
      assigned_by: Number(assignedByUserId),
      converted_task_id: created.id,
      remarks: remarks || cmpTask.remarks || null,
      time_required: timeRequired ? new Date(timeRequired).toISOString() : cmpTask.time_required,
    });
    return { userTask: created, cmpTask: updated };
  } catch (err) {
    // Best-effort rollback so we do not leave an orphan user_task
    try {
      await supabase.from("user_tasks").delete().eq("id", created.id);
    } catch (_) {
      /* ignore */
    }
    throw err;
  }
};

export const uploadAttachment = async (file) => {
  if (!file) return "";
  const fileName = `TASK-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("attachment_file").upload(fileName, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from("attachment_file").getPublicUrl(fileName);
  return urlData?.publicUrl || "";
};

// ---------------------------------------------------------------------------
// User Access (superadmin) — full CRUD on public.users
// ---------------------------------------------------------------------------
export const SIDEBAR_PAGE_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assign-task", label: "Assign Task / Generate Ticket" },
  { key: "tasks-table", label: "Tasks Table" },
  { key: "pending-tasks", label: "Pending Tasks" },
  { key: "completed-tasks", label: "Completed Tasks" },
  { key: "assign-tester", label: "Assign Tester" },
  { key: "tester", label: "Tester" },
  { key: "approval-delivery", label: "Approval For Delivery" },
  { key: "inform-customer", label: "Inform to Customer" },
  { key: "system-approvals", label: "System Approvals" },
  { key: "troubleshoot", label: "Troubleshoot" },
  { key: "ai-helper", label: "AI System Consultant" },
  { key: "reports", label: "Reports" },
  { key: "delegation-form", label: "Delegation Form" },
  { key: "delegation-tasks", label: "Delegation Tasks" },
  { key: "checklist-assign", label: "Checklist Assign" },
  { key: "checklist-pending", label: "Checklist Pending" },
  { key: "pc-page", label: "PC Page" },
  { key: "user-access", label: "User Access" },
  { key: "holidays", label: "Holidays" },
];


export const fetchAllUsersForAdmin = async () => {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, password, name, role, company_name, permission, is_active, created_at, updated_at"
    )
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createAppUser = async (payload) => {
  const row = {
    username: String(payload.username || "").trim(),
    password: String(payload.password || ""),
    name: String(payload.name || "").trim(),
    role: payload.role || "employee",
    company_name:
      payload.role === "company"
        ? String(payload.company_name || payload.name || "").trim()
        : null,
    permission: payload.permission || {},
    is_active: payload.is_active !== false,
  };
  if (!row.username) throw new Error("Username is required.");
  if (!row.password) throw new Error("Password is required.");
  if (!row.name) throw new Error("Name is required.");
  if (row.role === "company" && !row.company_name) {
    throw new Error("Company name is required for company accounts.");
  }

  const { data, error } = await supabase
    .from("users")
    .insert([row])
    .select(
      "id, username, password, name, role, company_name, permission, is_active, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data;
};

export const updateAppUser = async (id, payload) => {
  if (!id) throw new Error("User id is required.");
  const row = {};
  if (payload.username !== undefined) row.username = String(payload.username).trim();
  if (payload.password !== undefined && payload.password !== "") {
    row.password = String(payload.password);
  }
  if (payload.name !== undefined) row.name = String(payload.name).trim();
  if (payload.role !== undefined) row.role = payload.role;
  if (payload.company_name !== undefined || payload.role !== undefined) {
    const role = payload.role;
    if (role === "company") {
      row.company_name = String(
        payload.company_name || payload.name || ""
      ).trim();
    } else if (role && role !== "company") {
      row.company_name = null;
    } else if (payload.company_name !== undefined) {
      row.company_name = payload.company_name
        ? String(payload.company_name).trim()
        : null;
    }
  }
  if (payload.permission !== undefined) row.permission = payload.permission;
  if (payload.is_active !== undefined) row.is_active = !!payload.is_active;

  const { data, error } = await supabase
    .from("users")
    .update(row)
    .eq("id", id)
    .select(
      "id, username, password, name, role, company_name, permission, is_active, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data;
};

export const setUserActive = async (id, isActive) => {
  const { data, error } = await supabase
    .from("users")
    .update({ is_active: !!isActive })
    .eq("id", id)
    .select("id, is_active")
    .single();
  if (error) throw error;
  return data;
};

// ---------------------------------------------------------------------------
// Holidays — admin/superadmin calendar; Sundays always off in app logic
// ---------------------------------------------------------------------------
export const fetchHolidays = async () => {
  const { data, error } = await supabase
    .from("holidays")
    .select(
      "id, holiday_date, name, description, is_recurring, created_by, created_at, updated_at"
    )
    .order("holiday_date", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createHoliday = async (payload) => {
  const holidayDate = payload.holiday_date || payload.date;
  if (!holidayDate) throw new Error("Holiday date is required.");
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Holiday name is required.");

  const row = {
    holiday_date: String(holidayDate).slice(0, 10),
    name,
    description: payload.description ? String(payload.description).trim() : null,
    is_recurring: !!payload.is_recurring,
    created_by: payload.created_by ? Number(payload.created_by) : null,
  };

  const { data, error } = await supabase
    .from("holidays")
    .insert([row])
    .select(
      "id, holiday_date, name, description, is_recurring, created_by, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data;
};

export const updateHoliday = async (id, payload) => {
  if (!id) throw new Error("Holiday id is required.");
  const row = {};
  if (payload.holiday_date !== undefined || payload.date !== undefined) {
    row.holiday_date = String(payload.holiday_date || payload.date).slice(0, 10);
  }
  if (payload.name !== undefined) row.name = String(payload.name).trim();
  if (payload.description !== undefined) {
    row.description = payload.description
      ? String(payload.description).trim()
      : null;
  }
  if (payload.is_recurring !== undefined) row.is_recurring = !!payload.is_recurring;

  const { data, error } = await supabase
    .from("holidays")
    .update(row)
    .eq("id", id)
    .select(
      "id, holiday_date, name, description, is_recurring, created_by, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return data;
};

export const deleteHoliday = async (id) => {
  if (!id) throw new Error("Holiday id is required.");
  const { error } = await supabase.from("holidays").delete().eq("id", id);
  if (error) throw error;
  return true;
};

/**
 * After a holiday is added/updated, push expected_date_to_close for open tasks
 * whose window includes that holiday so on-time metrics stay fair.
 * Returns number of tasks updated.
 */
export const extendOpenTasksForHoliday = async (holidayRow, allHolidayRows = null) => {
  if (!holidayRow?.holiday_date) return 0;

  const holidays = allHolidayRows || (await fetchHolidays());

  const { data: tasks, error } = await supabase
    .from("user_tasks")
    .select("id, given_date, expected_date_to_close, status")
    .not("status", "in", '("Completed","Cancelled")');
  if (error) throw error;
  if (!tasks?.length) return 0;

  const {
    holidayAffectsWindow,
    extendExpectedDateISO,
  } = await import("../utils/workingDays");

  let updated = 0;

  for (const task of tasks) {
    if (!task.given_date || !task.expected_date_to_close) continue;
    if (!holidayAffectsWindow(
      holidayRow.holiday_date,
      task.given_date,
      task.expected_date_to_close,
      !!holidayRow.is_recurring
    )) {
      continue;
    }

    // Fully recompute expected close so Sundays + all holidays are compensated
    // and the final date lands on a working day (matches createEmplTask behaviour).
    const iso = extendExpectedDateISO(
      task.given_date,
      task.expected_date_to_close,
      holidays
    );
    if (!iso) continue;

    // Only write if the date actually moved forward
    const prev = String(task.expected_date_to_close).slice(0, 10);
    const next = String(iso).slice(0, 10);
    if (next <= prev) continue;

    const { error: upErr } = await supabase
      .from("user_tasks")
      .update({ expected_date_to_close: iso })
      .eq("id", task.id);
    if (!upErr) updated++;
  }
  return updated;
};

// ─── Delegated Tasks ─────────────────────────────────────────────────────────

export const fetchDelegationUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, username, role, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).filter(
    (u) => !["company"].includes(String(u.role || "").toLowerCase())
  );
};

function daysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const a = new Date(String(fromDate).slice(0, 10) + "T00:00:00");
  const b = new Date(String(toDate).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export const fetchDelegatedTasks = async () => {
  const { data, error } = await supabase
    .from("delegated_tasks")
    .select(
      `
      id,
      serial_number,
      task_details,
      assigned_to,
      assigned_by,
      target_date,
      planned_date,
      actual_date,
      delay_duration,
      status,
      remarks,
      new_target_date,
      created_at,
      updated_at,
      assignee:users!delegated_tasks_assigned_to_fkey ( id, name, username ),
      assigner:users!delegated_tasks_assigned_by_fkey ( id, name, username )
    `
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createDelegatedTask = async ({
  task_details,
  assigned_to,
  assigned_by,
  target_date,
}) => {
  if (!task_details || !String(task_details).trim()) {
    throw new Error("Task details are required.");
  }
  if (!assigned_to) throw new Error("Please select a person.");
  if (!assigned_by) throw new Error("Assigner is missing.");
  if (!target_date) throw new Error("Target date is required.");

  // Planned date auto = target date on assign
  const planned_date = target_date;

  const { data, error } = await supabase
    .from("delegated_tasks")
    .insert([
      {
        task_details: String(task_details).trim(),
        assigned_to: Number(assigned_to),
        assigned_by: Number(assigned_by),
        target_date,
        planned_date,
        status: "Pending",
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Complete task: sets actual_date (done), delay = actual - planned, status, remarks */
export const completeDelegatedTask = async (id, remarks = "", plannedDate = null) => {
  if (!id) throw new Error("Task id is required.");
  const actual = new Date().toISOString().slice(0, 10);
  let delay = null;
  if (plannedDate) {
    delay = daysBetween(plannedDate, actual);
  } else {
    // fetch planned if not passed
    const { data: row } = await supabase
      .from("delegated_tasks")
      .select("planned_date")
      .eq("id", id)
      .single();
    if (row?.planned_date) delay = daysBetween(row.planned_date, actual);
  }
  const { data, error } = await supabase
    .from("delegated_tasks")
    .update({
      status: "Completed",
      remarks: remarks ? String(remarks).trim() : null,
      actual_date: actual,
      delay_duration: delay,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Extend: new_target_date + remarks (reason); status Extended; planned can stay original */
export const extendDelegatedTask = async (id, new_target_date, remarks) => {
  if (!id) throw new Error("Task id is required.");
  if (!new_target_date) throw new Error("New target date is required.");
  if (!remarks || !String(remarks).trim()) {
    throw new Error("Remarks / reason is required when extending.");
  }
  const { data, error } = await supabase
    .from("delegated_tasks")
    .update({
      status: "Extended",
      new_target_date,
      target_date: new_target_date,
      remarks: String(remarks).trim(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Checklist Tasks ─────────────────────────────────────────────────────────

export const createChecklistTask = async (payload) => {
  const { data, error } = await supabase
    .from("checklist_tasks")
    .insert([
      {
        assigned_by: payload.assigned_by ? Number(payload.assigned_by) : null,
        name: payload.name,
        task_name: payload.task_name,
        task_category: payload.task_category,
        task_type: payload.task_type,
        description: payload.description || "",
        days: payload.days || [],
        status: "Pending",
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchChecklistTasks = async () => {
  const { data, error } = await supabase
    .from("checklist_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateChecklistTask = async (id, { status, remarks }) => {
  const patch = {
    status: status || "Pending",
    remarks: remarks ? String(remarks).trim() : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("checklist_tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Weekly Calls ────────────────────────────────────────────────────────────

export const createWeeklyCall = async (payload) => {
  const { data, error } = await supabase
    .from("weekly_calls")
    .insert([
      {
        party_name: payload.party_name,
        responsible_person: payload.responsible_person,
        responsible_phone: payload.responsible_phone,
        calling_person_name: payload.calling_person_name,
        task_description: payload.task_description || "",
        calling_days: payload.calling_days || [],
        assigned_by: payload.assigned_by ? Number(payload.assigned_by) : null,
        status: "Pending",
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchWeeklyCalls = async () => {
  const { data, error } = await supabase
    .from("weekly_calls")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateWeeklyCall = async (id, { has_issue, customer_said, proof_url, status }) => {
  const patch = {
    has_issue: has_issue ?? null,
    customer_said: customer_said ? String(customer_said).trim() : null,
    proof_url: proof_url || null,
    status: status || (has_issue ? "Issue" : "Completed"),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("weekly_calls")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Orders (Order System) ───────────────────────────────────────────────────

export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createOrder = async (payload) => {
  const row = {
    party_name: payload.party_name,
    type_of_work: payload.type_of_work || "Project",
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    value_of_order:
      payload.value_of_order === "" || payload.value_of_order == null
        ? null
        : Number(payload.value_of_order),
    payment_type: payload.payment_type || null,
    nda_required: !!payload.nda_required,
    nda_attachment_url: payload.nda_attachment_url || null,
    quotation_number: payload.quotation_number || null,
    quotation_attachment_url: payload.quotation_attachment_url || null,
    status: payload.status || "Submitted",
    remarks: payload.remarks || null,
    created_by: payload.created_by || null,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Company List: systems joined with company user credentials fallback */
export const fetchCompanyList = async () => {
  try {
    const { data, error } = await supabase
      .from("systems")
      .select(
        `
        id,
        company_id,
        name,
        description,
        department_name,
        company_username,
        company_password,
        type_of_system,
        status_of_system,
        website_link,
        company:users!systems_company_id_fkey ( id, username, password, company_name, name )
      `
      )
      .order("id", { ascending: true });
    if (!error && data) {
      return data.map((s, i) => ({
        serial_no: i + 1,
        company_id: s.company_id,
        department: s.department_name || "—",
        system_name: s.name,
        description_of_system: s.description || "—",
        company_username:
          s.company_username || s.company?.username || "—",
        company_password:
          s.company_password || s.company?.password || "—",
        company_name: s.company?.company_name || s.company?.name || "—",
        status_of_system: s.status_of_system,
        type_of_system: s.type_of_system,
      }));
    }
  } catch {
    /* fall through */
  }

  // Local fallback from seed-shaped localStorage if any
  try {
    const raw = localStorage.getItem("botivate_company_list_v1");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
};

// ─── Testing workflow & Task Delivery (persisted in Supabase) ────────────────

const TASK_TESTING_SELECT = `
  *,
  task:user_tasks!task_testing_task_id_fkey ( id, task_no, status ),
  subtask:task_subtasks!task_testing_subtask_id_fkey (
    id, task_no, status, relation_type, issue_remarks,
    source_testing:task_testing!task_subtasks_source_testing_id_fkey (
      id, tester_type, tester_id, delivery_group,
      tester:users!task_testing_tester_id_fkey ( id, name )
    )
  ),
  made_by_user:users!task_testing_made_by_fkey ( id, name, username ),
  tester:users!task_testing_tester_id_fkey ( id, name, username ),
  assigned_by_user:users!task_testing_assigned_by_fkey ( id, name ),
  company:users!task_testing_company_id_fkey ( id, name, company_name ),
  system:systems!task_testing_system_id_fkey ( id, name ),
  reworks:task_subtasks!task_subtasks_source_testing_id_fkey ( id, relation_type, task_no, status )
`;

// Compatibility helpers: no longer using localStorage overrides
export const getTaskOverrides = () => ({});
export const getLocalTasks = () => [];

export const TESTER_TYPES = ["Frontend", "Backend"];

/** A delivery is split into one Frontend + one Backend testing row; both share delivery_group (= first row's id). */
const groupOf = (r) => {
  const src = r.subtask?.source_testing;
  return src?.delivery_group || src?.id || r.delivery_group || r.id;
};

export const dispatchNo = (row) => `DSP-${String(groupOf(row || {}) || "").padStart(4, "0")}`;

/** For a delivery row with multiple parts (historical re-tests), returns only the latest active part per test type. */
export const activePartsOf = (parts = []) => {
  if (!parts.length) return [];
  const byType = new Map();
  const sorted = [...parts].sort((a, b) => b.id - a.id);
  const untyped = [];
  for (const p of sorted) {
    const t = p.tester_type || p.parent_issue?.source_tester_type;
    if (t) {
      if (!byType.has(t)) byType.set(t, p);
    } else {
      untyped.push(p);
    }
  }
  if (byType.size > 0) {
    const order = ["Frontend", "Backend"];
    const res = [];
    for (const t of order) {
      if (byType.has(t)) res.push(byType.get(t));
    }
    for (const [t, p] of byType.entries()) {
      if (!order.includes(t)) res.push(p);
    }
    return res;
  }
  return untyped.slice(0, 1);
};

/**
 * Testing id per row: task no + F (Frontend) / B (Backend), e.g. TASK-00037-F / TASK-00037-B.
 * A sub-task's delivery shows the sub-task (TASK-00037-1-F); the main task stays on `root_task`.
 */
const annotateTestingNos = (rows) => {
  for (const r of rows) {
    const sub = r.subtask;
    const sourceTesting = sub?.source_testing;
    if (sub) {
      r.root_task = r.task;
      r.task = { id: sub.id, task_no: sub.task_no, status: sub.status };
    }
    if (!r.tester_type && sourceTesting?.tester_type) {
      r.tester_type = sourceTesting.tester_type;
    }
    if (sub) {
      r.parent_issue = {
        relation_type: sub.relation_type,
        remarks: sub.issue_remarks,
        source_tester_type: sourceTesting?.tester_type,
        previous_tester: sourceTesting?.tester,
        previous_tester_id: sourceTesting?.tester_id,
      };
    }
    if (!r.tester_type) continue;
    const taskNo = r.task?.task_no || `TASK-${String(r.task_id || "").padStart(5, "0")}`;
    r.testing_no = `${taskNo}-${r.tester_type === "Backend" ? "B" : "F"}`;
  }
  return rows;
};

export const fetchTaskTesting = async () => {
  const { data, error } = await supabase
    .from("task_testing")
    .select(TASK_TESTING_SELECT)
    .order("id", { ascending: false });
  if (error) {
    console.error("fetchTaskTesting error:", error);
    throw error;
  }
  return annotateTestingNos(data || []);
};

/** One entry per delivery (its first row) with all its testing rows attached as `parts`. */
const groupDeliveries = (rows) => {
  const groups = new Map();
  for (const r of rows) {
    const k = groupOf(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = groupOf(r);
    if (seen.has(k)) continue;
    seen.add(k);
    const parts = groups.get(k);
    const primary = parts.find((p) => p.id === k) || parts[0];
    out.push({ ...primary, parts });
  }
  return out;
};

/**
 * A delivery's current round: its latest part per tester type. A sub-task's re-delivery joins the
 * delivery it was raised on, so after Approval / Inform "Not Done" the old parts keep their result
 * while the re-delivery starts fresh. The stage is Pending while any latest part is still Pending,
 * otherwise it is the newest part's result. The entry is the newest latest part (its id is the one
 * the stage result is saved on) with all parts attached.
 */
const currentRound = (d) => {
  const active = activePartsOf(d.parts);
  const newest = [...active].sort((a, b) => b.id - a.id)[0] || d;
  const stageStatus = (field) =>
    active.some((p) => (p[field] || "Pending") === "Pending") ? "Pending" : newest[field];
  return {
    ...newest,
    parts: d.parts,
    roundParts: active,
    approval_status: stageStatus("approval_status"),
    inform_status: stageStatus("inform_status"),
  };
};

/**
 * Delivery testing is Done ONLY when ALL assigned test types (Frontend, Backend, or both)
 * have completed and their latest test result is "Done".
 * If any test has an Issue or is Pending, testingDone is FALSE.
 */
const testingDone = (d) => {
  if (!d.parts || d.parts.length === 0) return false;

  const types = [
    ...new Set(
      d.parts
        .map((p) => p.tester_type || p.parent_issue?.source_tester_type)
        .filter(Boolean)
    ),
  ];

  // Legacy single-test rows without tester_type
  if (types.length === 0) {
    return d.parts.every((p) => p.tester_id && p.test_status === "Done");
  }

  // Every assigned testing type must have its latest test completed as "Done"
  for (const t of types) {
    const partsOfT = d.parts
      .filter((p) => (p.tester_type || p.parent_issue?.source_tester_type) === t)
      .sort((a, b) => b.id - a.id);
    const latest = partsOfT[0];
    if (!latest || !latest.tester_id || latest.test_status !== "Done") {
      return false;
    }
  }

  return true;
};

/** Calls a Postgres function; each one runs as a single transaction (see migration_task_subtasks.sql). */
const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    console.error(`${fn} error:`, error);
    throw error;
  }
  return data;
};

/** Task Update -> Complete: close the task in user_tasks + queue it in task_testing (one transaction). */
export const completeTaskWithDelivery = async ({
  task,
  systemLink,
  githubLink,
  loginId,
  password,
  remarks,
  madeByUserId,
  madeByName,
}) => {
  const madeBy = madeByUserId || task.assignedMember1Id || task.assigned_member_1 || null;
  const companyId = task.companyId || task.company_id || null;
  const systemId = task.systemId || task.system_id || null;

  return rpc("complete_task_with_delivery", {
    p_task_id: Number(task.id),
    p_system_link: systemLink || null,
    p_github_link: githubLink || null,
    p_login_id: loginId || null,
    p_password: password || null,
    p_remarks: remarks || null,
    p_made_by: madeBy ? Number(madeBy) : null,
    p_company_id: companyId ? Number(companyId) : null,
    p_system_id: systemId ? Number(systemId) : null,
    p_type_of_product: task.typeOfWork || task.type_of_work || null,
  });
};

/** Task Update -> Pending: new expected delivery date + remark, task stays pending in DB. */
export const postponeTask = async ({ taskId, expectedDate, remarks }) => {
  const now = new Date().toISOString();
  const patch = {
    expected_date_to_close: new Date(expectedDate).toISOString(),
    updated_at: now,
  };
  if (remarks) patch.remarks = remarks;

  const { error } = await supabase
    .from(await taskTableOf(taskId))
    .update(patch)
    .eq("id", taskId);
  if (error) {
    console.error("postponeTask error:", error);
    throw error;
  }
};

/**
 * Assign Frontend and/or Backend testers to a delivery row. `testers` = { Frontend: userId, Backend: userId }
 * (either or both may be selected).
 */
export const assignTester = async (row, { testers, expectedDate, remarks, assignedBy }) => {
  const res = await rpc("assign_testers", {
    p_testing_id: row.id,
    p_frontend_tester_id: testers.Frontend ? Number(testers.Frontend) : null,
    p_backend_tester_id: testers.Backend ? Number(testers.Backend) : null,
    p_expected_date: expectedDate ? new Date(expectedDate).toISOString() : null,
    p_remarks: remarks || null,
    p_assigned_by: assignedBy ? Number(assignedBy) : null,
  });

  // Cleanup guard: if only one tester was assigned, remove any phantom unassigned row
  // created by older versions of the SQL function.
  const dGroup = row.delivery_group || row.id;
  const unselectedTypes = TESTER_TYPES.filter((t) => !testers[t]);
  if (unselectedTypes.length > 0) {
    try {
      await supabase
        .from("task_testing")
        .delete()
        .eq("delivery_group", dGroup)
        .is("tester_id", null)
        .in("tester_type", unselectedTypes);
    } catch {
      /* ignore */
    }
  }

  return res;
};

/**
 * Saves a Tester / Approval / Inform result. A failing result (Issue / Not Done) also creates the
 * sub-task in task_subtasks (TASK-00047 -> TASK-00047-1, ...) — all in one transaction.
 * A test Done that finishes the delivery's testing marks the main task Completed.
 * Returns the new rework task id, if any.
 */
const STAGE_BADGE = { test: "tester", approval: "approval-delivery", inform: "inform-customer" };

const submitStageResult = async (stage, row, { status, remarks, byUserId, byName }) => {
  const childId = await rpc("submit_stage_result", {
    p_testing_id: row.id,
    p_stage: stage,
    p_status: status,
    p_remarks: remarks || null,
    p_by_user_id: byUserId ? Number(byUserId) : null,
    p_by_name: byName || null,
  });
  // sidebar badges now, not on its next poll: the row leaves this stage's pending list, and an
  // Issue / Not Done adds a sub-task to Pending Tasks for the person who made it
  const delta = status === "Pending" ? {} : { [STAGE_BADGE[stage]]: -1 };
  if (childId) delta["pending-tasks"] = 1;
  requestCountsRefresh(delta, { pendingTaskOwner: row.made_by });
  return childId;
};

const STAGE_FIELDS = {
  approval: ["approval_status", "approval_remarks", "approval_checked_at", "approval_checked_by"],
  inform: ["inform_status", "inform_remarks", "inform_checked_at", "inform_checked_by"],
};

/**
 * submit_stage_result saves the result on `row`'s delivery_group only, but a sub-task's
 * re-delivery has its own group — copy the result onto the delivery's other parts still Pending.
 */
const copyStageResult = async (stage, row, parts = [], { status, remarks, byName }) => {
  const [statusCol, remarksCol, atCol, byCol] = STAGE_FIELDS[stage];
  const rest = parts
    .filter(
      (p) =>
        p.id !== row.id &&
        (p[statusCol] || "Pending") === "Pending" &&
        !(row.delivery_group && p.delivery_group === row.delivery_group)
    )
    .map((p) => p.id);
  if (!rest.length) return;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("task_testing")
    .update({
      [statusCol]: status,
      [remarksCol]: remarks || null,
      [atCol]: status === "Pending" ? null : now,
      [byCol]: byName || null,
      updated_at: now,
    })
    .in("id", rest);
  if (error) throw error;
};

/**
 * Tester result. Done -> history (the delivery moves to Approval For Delivery once both
 * Frontend and Backend are Done). Pending -> stays in the tester pending list.
 * Issue -> history + new task for the maker.
 */
export const submitTesterResult = (row, opts) => submitStageResult("test", row, opts);

/** Deliveries whose Frontend and Backend tests are both Done; each has its testing rows in `parts`. */
export const fetchApprovalRows = async () =>
  groupDeliveries(await fetchTaskTesting()).filter(testingDone).map(currentRound);

/**
 * Approval For Delivery. Done -> history. Pending -> stays pending.
 * Not Done -> history + new pending task for the maker (Pending Tasks and Tasks Table).
 */
export const submitApprovalResult = async (row, opts) => {
  const childId = await submitStageResult("approval", row, opts);
  await copyStageResult("approval", row, row.roundParts, opts);
  return childId;
};

/**
 * Order Form: systems listed next to the quotation are saved under the company whose
 * name matches the order's party (shown later in Order List > company systems).
 * Returns { saved, skipped, noCompany }.
 */
export const createSystemsForParty = async (partyName, systems, login = null) => {
  const companies = await fetchCompanies();
  const key = (partyName || "").trim().toLowerCase();
  let company = companies.find(
    (c) => (c.name || "").toLowerCase() === key || (c.company_name || "").toLowerCase() === key
  );
  let created = null;
  if (!company) {
    // New party: register it as a company account so its systems have an owner
    const all = await fetchAllUsersForAdmin();
    const taken = new Set(all.map((u) => String(u.username).toLowerCase()));
    const base = key.replace(/[^a-z0-9]+/g, "").slice(0, 14) || "company";
    let username = (login?.username || "").trim() || base;
    if (!login?.username) for (let i = 2; taken.has(username.toLowerCase()); i++) username = `${base}${i}`;
    const password = (login?.password || "").trim() || `${base.slice(0, 8)}@123`;
    company = await createAppUser({
      username,
      password,
      name: partyName.trim(),
      company_name: partyName.trim(),
      role: "company",
      permission: { dashboard: true, "assign-task": true, "pending-tasks": true },
    });
    created = { username, password };
  }
  const existing = await fetchSystems(company.id);
  const taken = new Set(existing.map((s) => (s.name || "").toLowerCase()));
  let saved = 0;
  let skipped = 0;
  for (const s of systems) {
    const name = (s.name || "").trim();
    if (!name || taken.has(name.toLowerCase())) {
      skipped += 1;
      continue;
    }
    const { error } = await supabase.from("systems").insert([
      {
        company_id: company.id,
        name,
        department_name: (s.department || "").trim() || null,
        description: (s.description || "").trim() || null,
        type_of_system: "New System",
        status_of_system: "Development",
      },
    ]);
    if (error) throw error;
    taken.add(name.toLowerCase());
    saved += 1;
  }
  return { saved, skipped, created, existed: !created, companyId: company.id };
};

/**
 * Systems whose delivery was approved AND the customer has been informed (Inform to Customer = Done).
 * Returns { [systemId]: { dummy?: {link, id, pass}, actual?: {link, id, pass} } } using the latest
 * informed delivery of each kind, so the company's system list can show the logins.
 */
export const fetchDeliveredCredentials = async (companyId) => {
  const rows = (await fetchTaskTesting()).filter(
    (r) =>
      r.approval_status === "Done" &&
      r.inform_status === "Done" &&
      r.system_id != null &&
      (companyId == null || String(r.company_id) === String(companyId))
  );
  const pick = (r) => ({ link: r.system_link || "", id: r.system_login_id || "", pass: r.system_password || "" });
  const out = {};
  // fetchTaskTesting is newest-first, so the first match per kind is the latest
  for (const r of rows) {
    const kind = /dummy/i.test(r.type_of_product || "") ? "dummy" : "actual";
    const k = String(r.system_id);
    out[k] ||= {};
    out[k][kind] ||= pick(r);
  }
  return out;
};

/**
 * Latest link / id / pass entered in Task Update for each system, whatever stage it is in.
 * Returns { [systemId]: { dummy?: {...}, actual?: {...} } } — "dummy" from System Dummy
 * deliveries, "actual" from every other delivery (newest wins). Used for the staff view.
 */
export const fetchLatestCredentials = async (companyId) => {
  const rows = (await fetchTaskTesting()).filter(
    (r) => r.system_id != null && (companyId == null || String(r.company_id) === String(companyId))
  );
  const out = {};
  for (const r of rows) {
    const kind = /dummy/i.test(r.type_of_product || "") ? "dummy" : "actual";
    const k = String(r.system_id);
    out[k] ||= {};
    out[k][kind] ||= { link: r.system_link || "", id: r.system_login_id || "", pass: r.system_password || "" };
  }
  return out;
};

/** Pipeline stage of one delivery (from groupDeliveries): Assign Tester -> Testing -> Approval For Delivery -> Inform to Customer -> Delivered. */
const stageOfDelivery = (d) => {
  const back = (v) => (v === "Issue" || v === "Not Done" ? " (sent back)" : "");
  const { approval_status, inform_status } = currentRound(d);
  if (inform_status === "Done") return "Delivered";
  if (approval_status === "Done") return "Inform to Customer" + back(inform_status);
  if (testingDone(d)) return "Approval For Delivery" + back(approval_status);
  if (d.parts.some((p) => p.tester_id))
    return "Testing" + back(d.parts.some((p) => p.test_status === "Issue") ? "Issue" : "");
  return "Assign Tester";
};

/** Pipeline stage per task: { [taskId]: stage label } for tasks that were delivered (completed). */
export const fetchStageByTask = async (systemId) => {
  const rows = groupDeliveries(await fetchTaskTesting()).filter(
    (r) => r.task_id != null && (systemId == null || String(r.system_id) === String(systemId))
  );
  const out = {};
  for (const r of rows) out[String(r.task_id)] ||= stageOfDelivery(r);
  return out;
};

/** Current pipeline stage per system (latest delivery wins): { [systemId]: stage label }. */
export const fetchStageBySystem = async (companyId) => {
  const rows = groupDeliveries(await fetchTaskTesting()).filter(
    (r) => r.system_id != null && (companyId == null || String(r.company_id) === String(companyId))
  );
  const out = {};
  // newest-first, so the first row per system is the latest delivery
  for (const r of rows) out[String(r.system_id)] ||= stageOfDelivery(r);
  return out;
};

/** Pending item counts per pipeline stage for the sidebar badges (same rules as each stage's Pending tab). */
export const fetchPendingCounts = async ({ userId = null, seesAll = false, withRequests = false, companyId = null } = {}) => {
  const counts = {};

  // every badge is fetched at the same time, so the slowest query (not the sum of all) sets the delay
  const stageCounts = async () => {
    const rows = await fetchTaskTesting();
    counts["assign-tester"] = rows.filter((r) => !r.tester_id).length;
    counts.tester = rows.filter(
      (r) => r.tester_id && r.test_status === "Pending" && (seesAll || String(r.tester_id) === String(userId))
    ).length;
    counts["approval-delivery"] = groupDeliveries(rows).filter(
      (d) => testingDone(d) && currentRound(d).approval_status === "Pending"
    ).length;
    counts["inform-customer"] = informDeliveries(rows).filter((d) => d.inform_status === "Pending").length;
  };

  const requestCounts = async () => {
    if (!withRequests) return;
    try {
      counts["system-approvals"] = (await fetchSystemRequests()).filter((r) => r.status === "Pending").length;
    } catch {
      counts["system-approvals"] = 0;
    }
  };

  // global counts for page-level badges
  const pendingTaskCounts = async () => {
    try {
      const pendingQuery = (table) => {
        let q = supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .in("status", ["Pending", "In Progress"])
          .not("assigned_member_1", "is", null);
        if (!seesAll) {
          if (companyId) q = q.eq("company_id", companyId);
          else if (userId) q = q.eq("assigned_member_1", userId);
        }
        return q;
      };
      const [{ count: mainCount }, { count: subCount }] = await Promise.all([
        pendingQuery("user_tasks"),
        pendingQuery("task_subtasks"),
      ]);
      counts["pending-tasks"] = (mainCount || 0) + (subCount || 0);
    } catch {
      counts["pending-tasks"] = 0;
    }
  };

  const checklistCounts = async () => {
    try {
      const [cl, wk] = await Promise.all([fetchChecklistTasks(), fetchWeeklyCalls()]);
      counts["checklist-pending"] =
        cl.filter((t) => String(t.status || "").toLowerCase() !== "completed").length +
        wk.filter((t) => String(t.status || "").toLowerCase() !== "completed").length;
    } catch {
      counts["checklist-pending"] = 0;
    }
  };

  const delegationCounts = async () => {
    try {
      let dt = await fetchDelegatedTasks();
      dt = dt.filter((t) => String(t.status || "").toLowerCase() !== "completed");
      if (!seesAll && userId) {
        dt = dt.filter(t => String(t.assigned_to) === String(userId) || String(t.assigned_by) === String(userId));
      }
      counts["delegation-tasks"] = dt.length;
    } catch {
      counts["delegation-tasks"] = 0;
    }
  };

  const orderCounts = async () => {
    try {
      const ord = await fetchOrders();
      counts["order-list"] = ord.filter(t => {
        const s = String(t.status || "").toLowerCase();
        return s !== "completed" && s !== "cancelled";
      }).length;
    } catch {
      counts["order-list"] = 0;
    }
  };

  // a failing testing fetch still rejects (the sidebar keeps its last counts), as before
  await Promise.all([
    stageCounts(),
    requestCounts(),
    pendingTaskCounts(),
    checklistCounts(),
    delegationCounts(),
    orderCounts(),
  ]);
  return counts;
};

/**
 * One entry per delivery (dispatch) that has approved parts. A delivery's Frontend / Backend rows
 * and its sub-tasks' re-deliveries all share one dispatch number, so they are shown as one row:
 * the newest approved part (its link / id / pass is what the customer gets), with every approved
 * part in `informParts`. Pending while any approved part has not been informed yet.
 */
const informDeliveries = (rows) =>
  groupDeliveries(rows)
    .map((d) => {
      // parts are newest-first (fetchTaskTesting order)
      const approved = d.parts.filter((p) => p.approval_status === "Done");
      if (!approved.length) return null;
      const latest = approved[0];
      const pending = approved.some((p) => (p.inform_status || "Pending") === "Pending");
      return {
        ...latest,
        parts: d.parts,
        informParts: approved,
        inform_status: pending ? "Pending" : latest.inform_status,
      };
    })
    .filter(Boolean);

/** Deliveries approved (Approval For Delivery = Done) that await / had informing the customer. */
export const fetchInformRows = async () => informDeliveries(await fetchTaskTesting());

/**
 * Inform to Customer. Done -> history. Pending -> stays pending.
 * Not Done -> history + new pending task for the maker (Pending Tasks and Tasks Table).
 * Saved on the delivery's newest approved part (one rework at most), then copied onto its
 * other approved parts that were still pending.
 */
export const submitInformResult = async (row, opts) => {
  const childId = await submitStageResult("inform", row, opts);
  await copyStageResult("inform", row, row.informParts, opts);
  return childId;
};

/** New System tickets: register the typed system under the company (reuses an existing one with the same name). */
export const createSystemForCompany = async ({ companyId, name, dummy = false, department = null, description = null }) => {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("System name is required.");
  const existing = (await fetchSystems(companyId)).find(
    (s) => (s.name || "").toLowerCase() === clean.toLowerCase()
  );
  if (existing) return existing;
  const { data, error } = await supabase
    .from("systems")
    .insert([
      {
        company_id: Number(companyId),
        name: clean,
        type_of_system: "New System",
        status_of_system: "Development",
        environment: dummy ? "dummy" : "original",
        department_name: department || null,
        description: description || null,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── New system requests (company asks -> superadmin approves -> system joins the company list) ───

const REQUEST_SELECT = "*, company:users!system_requests_company_id_fkey ( id, name, company_name )";

export const createSystemRequest = async ({ companyId, name, department, description, priority, neededBy, requestedBy, attachmentUrl, attachmentName }) => {
  const { error } = await supabase.from("system_requests").insert([
    {
      company_id: Number(companyId),
      system_name: String(name).trim(),
      department: (department || "").trim() || null,
      description: (description || "").trim(),
      priority: priority || "Medium",
      needed_by: neededBy || null,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      requested_by: requestedBy ? Number(requestedBy) : null,
      status: "Pending",
    },
  ]);
  if (error) throw error;
};

export const fetchSystemRequests = async () => {
  const { data, error } = await supabase
    .from("system_requests")
    .select(REQUEST_SELECT)
    .order("id", { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Approve: the system is added to the company's systems list and a build task is opened. */
export const approveSystemRequest = async (req, { approverId, remarks }) => {
  const system = await createSystemForCompany({
    companyId: req.company_id,
    name: req.system_name,
    department: req.department,
    description: req.description,
  });
  const team = await fetchAssignableMembers();
  const takenFrom = team.find((m) => Number(m.id) !== Number(approverId))?.id || 1;
  const now = new Date();
  await createEmplTask({
    given_date: now.toISOString(),
    posted_by: Number(approverId),
    taken_from: Number(takenFrom),
    company_id: Number(req.company_id),
    type_of_work: "System Actual",
    expected_date_to_close: new Date(req.needed_by || now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
    description_of_work: `[Approved new system] ${req.system_name} — ${req.description || ""}`,
    system_id: system.id,
    priority: req.priority || "Medium",
    assigned_member_1: null,
    assigned_member_2: null,
    assigned_by: null,
    assigned_at: null,
    status: "Pending",
  });
  const { error } = await supabase
    .from("system_requests")
    .update({
      status: "Approved",
      system_id: system.id,
      decided_by: Number(approverId),
      decided_at: now.toISOString(),
      decision_remarks: remarks || null,
    })
    .eq("id", req.id);
  if (error) throw error;
};

export const rejectSystemRequest = async (req, { approverId, remarks }) => {
  const { error } = await supabase
    .from("system_requests")
    .update({
      status: "Rejected",
      decided_by: Number(approverId),
      decided_at: new Date().toISOString(),
      decision_remarks: remarks || null,
    })
    .eq("id", req.id);
  if (error) throw error;
};
