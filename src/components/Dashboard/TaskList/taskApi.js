import supabase from "../../../supabaseClient";
import { asSubtask, forwardUserTask, subtaskSelect, taskTableOf } from "../../../services/schemaApi";

export const PAGE_SIZE = 50;

const TASK_SELECT = `
      *,
      company:users!user_tasks_company_id_fkey ( id, name, company_name ),
      systems ( id, name, website_link, system_username, system_password ),
      posted_by_user:users!user_tasks_posted_by_fkey ( id, name, username ),
      taken_from_user:users!user_tasks_taken_from_fkey ( id, name, username ),
      assigned_member:users!user_tasks_assigned_member_1_fkey ( id, name, username ),
      assigned_member_1_user:users!user_tasks_assigned_member_1_fkey ( id, name, username ),
      assigned_member_2_user:users!user_tasks_assigned_member_2_fkey ( id, name, username ),
      assigned_by_user:users!user_tasks_assigned_by_fkey ( id, name, username )
    `;

const PENDING_STATUSES = ["Pending", "In Progress"];
// In Testing: the developer completed it, Frontend/Backend testing is still running
const COMPLETED_STATUSES = ["Completed", "In Testing"];

/**
 * Fetch tasks (main tasks + sub-tasks) from Supabase with pagination and type filtering.
 * @param {"pending"|"completed"} type
 * @param {number} page - page number (0-indexed)
 * @param {number} [pageSize=PAGE_SIZE]
 * @returns {Promise<{rows: Array, count: number}>}
 */
export const fetchTasksByType = async (type, page, pageSize = PAGE_SIZE) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const statuses = type === "pending" ? PENDING_STATUSES : COMPLETED_STATUSES;

    // Both tables share one id sequence, so the newest `to + 1` rows of the merged list
    // are among the newest `to + 1` rows of each table.
    const query = (table) => {
        let q = supabase
            .from(table)
            .select(table === "task_subtasks" ? subtaskSelect(TASK_SELECT) : TASK_SELECT, { count: "exact" })
            .in("status", statuses);
        if (type === "pending") {
            q = q.not("assigned_member_1", "is", null);
        }
        return q.order("id", { ascending: false }).range(0, to);
    };

    const [main, subs] = await Promise.all([query("user_tasks"), query("task_subtasks")]);
    if (main.error) throw main.error;
    if (subs.error) throw subs.error;

    const rows = [...(main.data || []), ...(subs.data || []).map(asSubtask)]
        .sort((a, b) => b.id - a.id)
        .slice(from, to + 1);

    if (type === "completed") {
        try {
            const { data: testRows } = await supabase
                .from("task_testing")
                .select("id, task_id, subtask_id, system_link, github_link, system_login_id, system_password")
                .order("id", { ascending: false });

            if (Array.isArray(testRows) && testRows.length > 0) {
                const testingMap = {};
                for (const r of testRows) {
                    if (r.task_id && !testingMap[`task_${r.task_id}`]) {
                        testingMap[`task_${r.task_id}`] = r;
                    }
                    if (r.subtask_id && !testingMap[`sub_${r.subtask_id}`]) {
                        testingMap[`sub_${r.subtask_id}`] = r;
                    }
                }

                rows.forEach((r) => {
                    const t = testingMap[r.is_subtask ? `sub_${r.id}` : `task_${r.id}`] || testingMap[`task_${r.id}`];
                    if (t) {
                        if (!r.github_link && t.github_link) r.github_link = t.github_link;
                        if (!r.link_of_system && t.system_link) r.link_of_system = t.system_link;
                        if (!r.system_login_id && t.system_login_id) r.system_login_id = t.system_login_id;
                        if (!r.system_password && t.system_password) r.system_password = t.system_password;
                    }
                });
            }
        } catch {
            /* ignore if task_testing query fails */
        }
    }

    return { rows, count: (main.count || 0) + (subs.count || 0) };
};

/**
 * Submit (complete) selected tasks via Supabase.
 * @param {Set} selectedTaskIds - Set of task IDs to complete
 * @param {Array} filteredTasks - current filtered task list
 * @param {string} currentUser - username of submitting user
 * @param {Function} canUserSubmitTask - permission check function
 * @returns {Promise<{results: Array, currentDate: string}>}
 */
export const submitTasks = async (selectedTaskIds, filteredTasks, currentUser, canUserSubmitTask) => {
    const currentDate = new Date().toISOString();
    const results = [];

    for (const taskId of selectedTaskIds) {
        const task = filteredTasks.find((t) => t.id === taskId);
        if (!task) continue;

        if (!canUserSubmitTask(task)) {
            results.push({
                taskNo: task.taskNo,
                success: false,
                error: "You are not authorized to submit this task",
            });
            continue;
        }

        try {
            const updateData = {
                status: "Completed",
                completed_at: currentDate,
            };

            const { error } = await supabase
                .from(await taskTableOf(task.id))
                .update(updateData)
                .eq("id", task.id || task.taskNo);

            if (error) {
                throw new Error(error.message || "Supabase update failed");
            }

            results.push({
                taskNo: task.taskNo,
                success: true,
                message: "Completed",
            });
        } catch (error) {
            results.push({
                taskNo: task.taskNo,
                success: false,
                error: error.message,
            });
        }
    }

    return { results, currentDate };
};

/**
 * Directly complete a task via Supabase (status -> Completed).
 * @param {object} task - the task to complete
 * @returns {Promise<object>} updated row
 */
export const completeTaskDirectly = async (task) => {
    const { data, error } = await supabase
        .from(await taskTableOf(task.id))
        .update({ status: "Completed", completed_at: new Date().toISOString() })
        .eq("id", task.id)
        .select();

    if (error) throw error;
    return data?.[0];
};


/**
 * Forward active owner (Member 1) → Member 2.
 * - Employees: requireOwner true (must be Member 1)
 * - Admin / HOD / Superadmin: requireOwner false (can force-forward)
 */
export const forwardTaskApi = async (
  taskId,
  { nextMemberId = null, byUserId = null, requireOwner = false, currentUserId = null } = {}
) => {
  return forwardUserTask(taskId, {
    nextMemberId,
    byUserId,
    requireOwner,
    currentUserId,
  });
};
