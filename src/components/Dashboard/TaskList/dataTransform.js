import { formatDateTime } from "../../../utils/dateFormatters";

export const TABLE_COLUMNS = [
    // Identity
    { key: "taskNo", label: "Task No" },
    { key: "givenDate", label: "Given Date" },
    { key: "postedBy", label: "Posted By" },
    { key: "takenFrom", label: "Taken From" },
    // Work context
    { key: "typeOfWork", label: "Type of Work" },
    { key: "partyName", label: "Company" },
    { key: "systemName", label: "System" },
    // Details
    { key: "descriptionOfWork", label: "Description" },
    { key: "notes", label: "Notes" },
    { key: "linkOfSystem", label: "Link" },
    { key: "attachmentFile", label: "Attachment" },
    // Meta / deadline
    { key: "priorityInCustomer", label: "Priority" },
    { key: "expectedDateToClose", label: "Expected Date" },
];

/**
 * Transform user_tasks rows (schema v5) into UI task objects.
 * Joined relations: companies, systems, assigned_member, assigned_by_user, posted_by_user
 */
export const transformSupabaseData = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return { tasks: [], teamMembers1: [], teamMembers2: [] };
    }

    const membersX = new Set();
    const membersY = new Set();

    const tasks = rawData
        .map((row, index) => {
            if (!row) return null;

            const statusRaw = (row.status || "Pending").toString();
            const statusLower = statusRaw.toLowerCase();
            let uiStatus = "pending";
            // In Testing = developer's part is done, waiting for Frontend/Backend testing
            if (statusLower === "completed" || statusLower === "in testing") uiStatus = "completed";
            else if (statusLower === "in progress" || row.assigned_member_1)
                uiStatus = "assigned";

            const postedByName =
                row.posted_by_user?.name ||
                row.posted_by_user?.username ||
                (typeof row.posted_by === "string" ? row.posted_by : "") ||
                "";
            const takenFromName =
                row.taken_from_user?.name ||
                row.taken_from_user?.username ||
                (typeof row.taken_from === "string" ? row.taken_from : "") ||
                "";
            const assigneeName =
                row.assigned_member?.name ||
                row.assigned_member?.username ||
                row.assigned_member_1_user?.name ||
                row.assigned_member_1_user?.username ||
                row.team_member_name ||
                "";
            const assignee2Name =
                row.assigned_member_2_user?.name ||
                row.assigned_member_2_user?.username ||
                "";
            const assignedByName =
                row.assigned_by_user?.name ||
                row.assigned_by_user?.username ||
                "";
            const partyName =
                row.company?.company_name ||
                row.company?.name ||
                row.companies?.name ||
                row.party_name ||
                "";
            const systemName = row.systems?.name || row.system_name || "";

            // Check if this task was created as a rework / rejection from testing or other stages
            const isTestingReject =
                row.relation_type === "Testing Issue" ||
                row.is_testing_issue === true ||
                (typeof row.description_of_work === "string" && /\[Testing issue/i.test(row.description_of_work));

            const isApprovalReject =
                row.relation_type === "Approval Not Done" ||
                (typeof row.description_of_work === "string" && /\[Delivery not approved/i.test(row.description_of_work));

            const isInformReject =
                row.relation_type === "Inform Not Done" ||
                (typeof row.description_of_work === "string" && /\[Customer not informed/i.test(row.description_of_work));

            const isRejected = isTestingReject || isApprovalReject || isInformReject;

            let rejectType = null;
            if (isTestingReject) rejectType = "Testing";
            else if (isApprovalReject) rejectType = "Approval";
            else if (isInformReject) rejectType = "Customer Inform";

            let rejectedReason = (row.issue_remarks || "").trim();
            if (!rejectedReason && row.description_of_work) {
                const match = row.description_of_work.match(
                    /^\[(?:Testing issue|Delivery not approved|Customer not informed)[^\]]*\]\s*(.*)$/i
                );
                if (match && match[1]) {
                    rejectedReason = match[1].trim();
                }
            }

            const remarksText =
                row.remarks ||
                (isRejected ? rejectedReason : "") ||
                row.notes ||
                "";
            const timeRequiredText =
                formatDateTime(row.time_required) ||
                formatDateTime(row.expected_date_to_close) ||
                formatDateTime(row.given_date) ||
                "";

            const task = {
                id: row.id,
                rowNumber: index + 2,
                taskNo: row.task_no || `TASK-${row.id}`,
                givenDate: formatDateTime(row.given_date),
                postedBy: postedByName,
                typeOfWork: row.type_of_work || "",
                takenFrom: takenFromName,
                partyName,
                systemName,
                descriptionOfWork: row.description_of_work || "",
                linkOfSystem: row.link_of_system || row.systems?.website_link || "",
                githubLink: row.github_link || "",
                systemLoginId: row.system_login_id || row.systems?.system_username || "",
                systemPassword: row.system_password || row.systems?.system_password || "",
                attachmentFile: row.attachment_file || "",
                priorityInCustomer: row.priority || "Medium",
                notes: row.notes || "",
                expectedDateToClose: formatDateTime(row.expected_date_to_close),
                // Compatibility aliases for older UI
                planned1: formatDateTime(row.assigned_at || row.given_date),
                actual1: formatDateTime(row.assigned_at),
                delay1: "",
                teamMemberName: assigneeName,
                howManyTimeTabs: "",
                remarks: remarksText,
                planned2: formatDateTime(row.assigned_at),
                actual2: formatDateTime(row.completed_at),
                delay2: "",
                // assigned_by = jisne assign kiya; member1 = current owner; member2 = backup / forward target
                assignedBy: assignedByName,
                assignedMember1: assigneeName,
                assignedMember1Id: row.assigned_member_1 ?? null,
                assignedMember2: assignee2Name,
                assignedMember2Id: row.assigned_member_2 ?? null,
                // sub-task: members always follow the main task's
                isSubtask: !!row.is_subtask,
                isRejected: !!isRejected,
                isTestingReject: !!isTestingReject,
                isTestingIssue: !!isTestingReject,
                rejectType,
                rejectedReason,
                relationType: row.relation_type || (isTestingReject ? "Testing Issue" : ""),
                issueRemarks: row.issue_remarks || rejectedReason,
                timeRequired: timeRequiredText,
                remarks2: remarksText,
                planned3: formatDateTime(row.expected_date_to_close),
                actual3: formatDateTime(row.completed_at),
                delay3: "",
                status: statusRaw,
                systemList: systemName,
                uiStatus,
                priority: row.priority || "Medium",
                isReassigned: false,
                originalAssignee: assigneeName,
                companyId: row.company_id || null,
                systemId: row.system_id || null,
                assignedMemberId: row.assigned_member_1 || null,
                expectedDateRaw: row.expected_date_to_close || "",
            };

            if (task.assignedMember1) membersX.add(task.assignedMember1);
            if (task.assignedMember2) membersY.add(task.assignedMember2);

            return task;
        })
        .filter((task) => task !== null && task.taskNo);

    const teamMembers1 = Array.from(membersX).filter(Boolean);
    const teamMembers2 = Array.from(membersY).filter(Boolean);

    const sortedTasks = tasks.sort((a, b) => {
        const aPending = a.uiStatus !== "completed";
        const bPending = b.uiStatus !== "completed";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return (b.id || 0) - (a.id || 0);
    });

    return { tasks: sortedTasks, teamMembers1, teamMembers2 };
};

export const fetchMasterSheetLinkData = async (supabase) => {
    // Legacy name: used to hit Google "Master Sheet". Now loads company users from Supabase.
    try {
        const { data, error } = await supabase
            .from("users")
            .select("id, username, name, role, company_name")
            .eq("role", "company")
            .eq("is_active", true);
        if (error) throw error;
        return data && data.length > 0 ? data : null;
    } catch (error) {
        console.error("Error fetching company users:", error);
        return null;
    }
};

export const getCompanyPartyNames = (companyName, masterSheetData) => {
    if (!companyName || !masterSheetData || !Array.isArray(masterSheetData)) {
        return [];
    }

    const matchingParties = [];

    for (let i = 1; i < masterSheetData.length; i++) {
        const row = masterSheetData[i];
        if (!row || !Array.isArray(row)) continue;

        const companyNameInSheet = row[2] ? row[2].toString().trim() : "";

        if (companyNameInSheet.toLowerCase() === companyName.toLowerCase()) {
            const possiblePartyColumns = [2, 6, 7, 8];
            for (const colIndex of possiblePartyColumns) {
                if (row[colIndex]) {
                    const partyName = row[colIndex].toString().trim();
                    if (partyName && !matchingParties.includes(partyName)) {
                        matchingParties.push(partyName);
                    }
                }
            }

            if (matchingParties.length === 0) {
                matchingParties.push(companyNameInSheet);
            }
        }
    }

    return matchingParties;
};