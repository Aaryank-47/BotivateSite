"use client";
import { useState, useEffect } from "react";
import { useDropdownData } from "./useDropdownData";
import AdminForm from "./AdminForm";
import CompanyForm from "./CompanyForm";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  createEmplTask,
  createSystemForCompany,
  uploadAttachment,
} from "../../../services/schemaApi";

const emptyFormData = {
  date: new Date().toISOString().split("T")[0],
  companyId: "",
  companyName: "",
  takenFrom: "",
  typeOfWork: "",
  systemId: "",
  systemName: "",
  description: "",
  link: "",
  attachment: null,
  priority: "Medium",
  notes: "",
  expectedDate: "",
  assignedMemberId: "",
  taskName: "",
};

export default function AssignTaskForm({
  onTaskCreated,
  compact = false,
  onCancel,
  userRole = "admin",
  user,
  userFilterData,
  companyData,
}) {
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [additionalTasks, setAdditionalTasks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [popup, setPopup] = useState({ show: false, type: "", message: "" });

  // Resolve logged-in user id from props OR session (cookie restore can drop nested fields).
  const resolveCurrentUserId = () => {
    const fromProps =
      userFilterData?.userId ||
      userFilterData?.id ||
      companyData?.userId ||
      user?.id ||
      user?.userId ||
      null;
    if (fromProps != null && fromProps !== "") return Number(fromProps);

    try {
      const raw =
        sessionStorage.getItem("userSession") ||
        localStorage.getItem("userData");
      if (raw) {
        const parsed = JSON.parse(raw);
        const id =
          parsed?.filterData?.userId ||
          parsed?.filterData?.id ||
          parsed?.companyData?.userId ||
          parsed?.userId ||
          parsed?.id ||
          null;
        if (id != null && id !== "") return Number(id);
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  const currentUserId = resolveCurrentUserId();
  const currentUserName =
    userFilterData?.name || userFilterData?.username || user?.username || "";

  const {
    companies,
    assignableMembers,
    takenFromUsers,
    workTypes,
    isLoadingDropdowns,
    systems,
    setSystems,
    isLoadingSystems,
    fetchSystemsForCompany,
  } = useDropdownData(userRole, currentUserId);

  // Company users always post against their own company/system list.
  useEffect(() => {
    if (userRole === "company" && companyData?.companyId) {
      fetchSystemsForCompany(companyData.companyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, companyData?.companyId]);

  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem("assignTaskPrefill");
      if (prefill) {
        const parsed = JSON.parse(prefill);
        setFormData((prev) => ({
          ...prev,
          companyId: parsed.companyId || prev.companyId,
          companyName: parsed.companyName || prev.companyName,
          systemId: parsed.systemId || prev.systemId,
          systemName: parsed.systemName || prev.systemName,
          typeOfWork: parsed.typeOfWork || prev.typeOfWork,
          description: parsed.description || prev.description,
          link: parsed.link || prev.link,
        }));
        if (parsed.companyId) {
          fetchSystemsForCompany(parsed.companyId);
        }
        sessionStorage.removeItem("assignTaskPrefill");
      }
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Company: writable combobox — match typed/selected name (or optionValue id)
    if (name === "companyName") {
      const optionValue = e.target.optionValue;
      const match =
        (optionValue != null &&
          companies.find((c) => String(c.id) === String(optionValue))) ||
        companies.find(
          (c) =>
            (c.name || "").toLowerCase() === String(value).trim().toLowerCase() ||
            String(c.id) === String(value)
        );
      const companyId = match ? String(match.id) : "";
      const companyName = match ? match.name : value;
      setFormData((prev) => ({
        ...prev,
        companyName,
        companyId,
        systemId: "",
        systemName: "",
      }));
      setSystems([]);
      if (companyId) fetchSystemsForCompany(companyId);
      return;
    }

    // System: writable combobox — match to system id when possible
    if (name === "systemName") {
      const optionValue = e.target.optionValue;
      const match =
        (optionValue != null &&
          systems.find((s) => String(s.id) === String(optionValue))) ||
        systems.find(
          (s) =>
            (s.name || "").toLowerCase() === String(value).trim().toLowerCase() ||
            String(s.id) === String(value)
        );
      setFormData((prev) => ({
        ...prev,
        systemName: match ? match.name : value,
        systemId: match ? String(match.id) : "",
      }));
      return;
    }

    // Legacy select still supported
    if (name === "companyId") {
      const match = companies.find((c) => String(c.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        companyId: value,
        companyName: match ? match.name || "" : "",
        systemId: "",
        systemName: "",
      }));
      setSystems([]);
      if (value) fetchSystemsForCompany(value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        e.target.value = "";
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("File type not supported. Please upload images, PDF, Word, Excel, or text files.");
        e.target.value = "";
        return;
      }
    }

    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  const addAdditionalTask = () => {
    setAdditionalTasks([
      ...additionalTasks,
      {
        id: Date.now(),
        typeOfWork: "",
        systemId: "",
        systemName: "",
        description: "",
        link: "",
        priority: "Medium",
        notes: "",
        date: new Date().toISOString().split("T")[0],
        expectedDate: "",
        taskName: "",
      },
    ]);
  };

  const removeAdditionalTask = (id) => {
    setAdditionalTasks(additionalTasks.filter((task) => task.id !== id));
  };

  const updateAdditionalTask = (id, field, value) => {
    setAdditionalTasks(
      additionalTasks.map((task) => {
        if (task.id !== id) return task;
        if (field === "systemName") {
          const match = systems.find(
            (s) =>
              (s.name || "").toLowerCase() === value.trim().toLowerCase() ||
              String(s.id) === value
          );
          return {
            ...task,
            systemName: value,
            systemId: match ? String(match.id) : "",
          };
        }
        return { ...task, [field]: value };
      })
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (userRole === "admin" || userRole === "employee" || userRole === "hod" || userRole === "superadmin") {
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.takenFrom) newErrors.takenFrom = "Taken From is required";
      if (!formData.companyId && !formData.companyName?.trim()) {
        newErrors.companyId = "Company is required";
      } else if (!formData.companyId && formData.companyName?.trim()) {
        newErrors.companyId = "Please select a company from the list (typed name must match)";
      }
      if (!formData.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
      if (!formData.description) newErrors.description = "Description is required";
      if (!formData.expectedDate) newErrors.expectedDate = "Expected Date is required";
    } else {
      if (!formData.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
      if (!formData.description) newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ ...emptyFormData, date: new Date().toISOString().split("T")[0] });
    setAdditionalTasks([]);
    setSystems([]);
  };

  // New System tickets: the typed system is added to the company's systems table
  const resolveNewSystem = async (typeOfWork, companyId, systemId, systemName) => {
    if (systemId || !String(typeOfWork || "").startsWith("New System")) return systemId;
    const name = String(systemName || "").trim();
    if (!name) throw new Error("Enter the new system name.");
    const sys = await createSystemForCompany({
      companyId,
      name,
      dummy: /dummy/i.test(typeOfWork),
    });
    return sys.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Re-resolve at submit time (props may have been stale / null on first render)
    let postedBy = resolveCurrentUserId();

    // Last resort: look up users table by username so NOT NULL never fails silently
    if (!postedBy) {
      const username =
        userFilterData?.username || user?.username || currentUserName || "";
      if (username) {
        try {
          const { default: supabase } = await import("../../../supabaseClient");
          const { data: uRow } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .maybeSingle();
          if (uRow?.id) postedBy = Number(uRow.id);
        } catch (lookupErr) {
          console.error("posted_by lookup failed:", lookupErr);
        }
      }
    }

    if (!postedBy) {
      setPopup({
        show: true,
        type: "error",
        message: "Could not identify the logged-in user (posted_by). Please log out and log in again, then retry.",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress("Preparing submission...");

    try {
      let attachmentUrl = "";
      if (formData.attachment) {
        setUploadProgress("Uploading file...");
        attachmentUrl = await uploadAttachment(formData.attachment);
      }

      const allTasks = [formData, ...additionalTasks];
      const submittedTasks = [];

      const toId = (v) => {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      for (const [index, task] of allTasks.entries()) {
        setUploadProgress(`Submitting task ${index + 1}...`);

        if (userRole === "admin" || userRole === "employee") {
          const companyId = toId(formData.companyId);
          if (!companyId) {
            throw new Error("Company is required.");
          }

          const assignedMemberId = toId(formData.assignedMemberId);
          const givenDate = formData.date
            ? new Date(formData.date).toISOString()
            : new Date().toISOString();
          const expectedRaw = task.expectedDate || formData.expectedDate;
          if (!expectedRaw) {
            throw new Error("Expected date to close is required.");
          }
          // Raw expected date — createEmplTask auto-extends past Sundays + holidays
          const expectedDate = new Date(expectedRaw).toISOString();

          const resolvedSystemId = await resolveNewSystem(
            task.typeOfWork || formData.typeOfWork,
            companyId,
            toId(task.systemId || formData.systemId),
            task.systemName || formData.systemName
          );
          const freeSystemName =
            !resolvedSystemId
              ? (task.systemName || formData.systemName || "").trim()
              : "";
          const baseNotes = task.notes || formData.notes || "";
          const notesWithSystem =
            freeSystemName
              ? [baseNotes, `System: ${freeSystemName}`].filter(Boolean).join(" | ")
              : baseNotes || null;

          const payload = {
            given_date: givenDate,
            posted_by: postedBy,
            taken_from: (() => {
              const id = toId(formData.takenFrom);
              if (!id) throw new Error("Taken From (person) is required.");
              return id;
            })(),
            company_id: companyId,
            type_of_work: task.typeOfWork || formData.typeOfWork,
            expected_date_to_close: expectedDate,
            description_of_work: task.description || formData.description || "",
            system_id: resolvedSystemId,
            link_of_system: task.link || formData.link || null,
            attachment_file: attachmentUrl || null,
            priority: task.priority || formData.priority || "Medium",
            notes: notesWithSystem,
            // No member assignment on create — done later in Task Table / Developer Stage.
            assigned_member_1: null,
            assigned_member_2: null,
            assigned_by: null,
            assigned_at: null,
            status: "Pending",
          };

          const inserted = await createEmplTask(payload);
          submittedTasks.push(inserted);
        } else {
          // Company role -> user_tasks directly (no developer-stage conversion)
          const companyId = toId(companyData?.companyId || formData.companyId);
          if (!companyId) {
            throw new Error("Company is required for this ticket.");
          }

          const taskDate = task.date || formData.date || null;
          const expectedRaw = task.expectedDate || formData.expectedDate || null;
          const givenDate = taskDate
            ? new Date(taskDate).toISOString()
            : new Date().toISOString();
          // Raw expected — createEmplTask auto-extends past Sundays + holidays
          const expectedDate = expectedRaw
            ? new Date(expectedRaw + "T18:00:00").toISOString()
            : null;

          const taskName = task.taskName || formData.taskName || "";
          const typeOfWork = task.typeOfWork || formData.typeOfWork;
          if (!typeOfWork) throw new Error("Type of work is required.");
          
          const description =
            task.description || formData.description || "";
          const companySystemId = await resolveNewSystem(
            typeOfWork,
            companyId,
            toId(task.systemId || formData.systemId),
            task.systemName || formData.systemName
          );

          const payload = {
            given_date: givenDate,
            posted_by: postedBy,
            // Company tickets: taken_from must differ from posted_by due to DB constraint.
            // Assigning to the first available employee as a placeholder.
            taken_from: takenFromUsers?.[0]?.id || (postedBy === 1 ? 2 : 1),
            company_id: companyId,
            type_of_work: typeOfWork,
            expected_date_to_close: expectedDate,
            description_of_work: description
              ? taskName
                ? `${taskName} — ${description}`
                : description
              : taskName || "Support request",
            system_id: companySystemId,
            link_of_system: task.link || formData.link || null,
            attachment_file: attachmentUrl || null,
            priority: task.priority || formData.priority || "Medium",
            notes: task.notes || formData.notes || null,
            assigned_member_1: null,
            assigned_member_2: null,
            assigned_by: null,
            assigned_at: null,
            status: "Pending",
          };

          const inserted = await createEmplTask(payload);
          submittedTasks.push(inserted);
        }
      }

      if (onTaskCreated) onTaskCreated(submittedTasks);

      setPopup({
        show: true,
        type: "success",
        message: `${submittedTasks.length} task(s) created successfully.`,
      });
      resetForm();
    } catch (error) {
      console.error("❌ Submission error:", error.message || error);
      setPopup({
        show: true,
        type: "error",
        message: "Submission failed: " + (error.message || String(error)),
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  const commonProps = {
    formData,
    setFormData,
    handleInputChange,
    errors,
    companies,
    assignableMembers,
    takenFromUsers,
    workTypes,
    systems,
    isLoadingDropdowns,
    isLoadingSystems,
    handleFileChange,
    handleSubmit,
    isSubmitting,
    uploadProgress,
    additionalTasks,
    addAdditionalTask,
    removeAdditionalTask,
    updateAdditionalTask,
    handleShowAdditionalSection: addAdditionalTask,
    currentUserName,
    onCancel,
  };

  return (
    <div className={compact ? "compact-form" : undefined}>
      {userRole === "company" ? (
        <CompanyForm
          {...commonProps}
          currentCompanyName={companyData?.companyName || ""}
        />
      ) : (
        <AdminForm {...commonProps} userRole={userRole} />
      )}

      {/* Success / Error Popup Modal */}
      {popup.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all animate-in fade-in zoom-in duration-200">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-5 shadow-inner ${popup.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
              {popup.type === "success" ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {popup.type === "success" ? "Success!" : "Error"}
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed px-2">
              {popup.message}
            </p>
            <button
              onClick={() => setPopup({ show: false, type: "", message: "" })}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all focus:ring-2 focus:ring-offset-2 ${
                popup.type === "success" 
                  ? "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500" 
                  : "bg-rose-500 hover:bg-rose-600 focus:ring-rose-500"
              }`}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
