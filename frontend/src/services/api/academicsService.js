import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";

// ── Supabase REST & Storage Client Configuration ─────────────────────────────
const SUPABASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !DEMO_MODE);
}

const supabaseRest = {
  async get(table, query = "") {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase GET ${table} error: ${res.statusText}`);
    return res.json();
  },

  async post(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase POST ${table} error: ${res.statusText}`);
    return res.json();
  },

  async patch(table, query, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Supabase PATCH ${table} error: ${res.statusText}`);
    return res.json();
  },

  async delete(table, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase DELETE ${table} error: ${res.statusText}`);
    return res.json();
  },
};

const storageService = {
  async upload(file, { bucket, folder, fileName }) {
    try {
      const path = folder ? `${folder}/${fileName}` : fileName;
      const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: err.message || res.statusText };
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      return { ok: true, data: { path, url: publicUrl, fileUrl: publicUrl } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async getDownloadUrl(storagePath, { bucket }) {
    if (!storagePath) return { ok: false, error: "Path required" };
    if (storagePath.startsWith("http")) return { ok: true, data: { url: storagePath } };
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
    return { ok: true, data: { url: publicUrl } };
  },
};

function getAuthUser() {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthUserId() {
  return getAuthUser()?.id || "demo-user";
}

// ── Demo Fallback Datasets ───────────────────────────────────────────────────
const DEMO_DEPARTMENTS = [
  { id: "dept-cse", name: "Computer Science & Engineering", code: "CSE", active: true },
  { id: "dept-ece", name: "Electronics & Communication", code: "ECE", active: true },
  { id: "dept-me",  name: "Mechanical Engineering", code: "ME", active: true },
  { id: "dept-ce",  name: "Civil Engineering", code: "CE", active: true },
];

const DEMO_SEMESTERS = [
  { id: "sem-1", semester_number: 1, name: "Semester 1 (S1)" },
  { id: "sem-2", semester_number: 2, name: "Semester 2 (S2)" },
  { id: "sem-3", semester_number: 3, name: "Semester 3 (S3)" },
  { id: "sem-4", semester_number: 4, name: "Semester 4 (S4)" },
  { id: "sem-5", semester_number: 5, name: "Semester 5 (S5)" },
  { id: "sem-6", semester_number: 6, name: "Semester 6 (S6)" },
  { id: "sem-7", semester_number: 7, name: "Semester 7 (S7)" },
  { id: "sem-8", semester_number: 8, name: "Semester 8 (S8)" },
];

const DEMO_MATERIALS = [
  {
    id: "mat-001",
    title: "Data Structures Fundamentals",
    description: "Complete notes on arrays, linked lists, and binary trees",
    subject: "Data Structures",
    semester: 3,
    semesterName: "Semester 3",
    department: "Computer Science & Engineering",
    department_id: "dept-cse",
    uploadedBy: "Student",
    uploadedAt: "2026-08-28",
    type: "notes",
    material_type: "notes",
    size: "2.4 MB",
    views: 342,
    downloads: 89,
    status: "approved",
  },
  {
    id: "mat-002",
    title: "DBMS Query Optimization",
    description: "Advanced SQL indexing and execution strategies",
    subject: "Database Management",
    semester: 5,
    semesterName: "Semester 5",
    department: "Computer Science & Engineering",
    department_id: "dept-cse",
    uploadedBy: "Prof. Sharma",
    uploadedAt: "2026-08-27",
    type: "slides",
    material_type: "slides",
    size: "5.1 MB",
    views: 612,
    downloads: 178,
    status: "approved",
  },
];

let demoDeptStore = [...DEMO_DEPARTMENTS];
let demoMaterialsStore = [...DEMO_MATERIALS];
let demoDeptRequestsStore = [];

// ── Academics Service API ────────────────────────────────────────────────────
export const academicsService = {
  /**
   * 1. GET /departments (Approved & Active only, for students)
   */
  async getDepartments() {
    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseRest.get("departments", "active=eq.true&order=name.asc");
        if (rows && rows.length > 0) return { ok: true, data: rows };
      } catch (err) {
        console.warn("Supabase getDepartments failed, using fallback:", err.message);
      }
    }
    return { ok: true, data: demoDeptStore.filter((d) => d.active !== false) };
  },

  async getApprovedDepartments() {
    return this.getDepartments();
  },

  /**
   * Admin: GET all departments (Both active and inactive)
   */
  async adminGetAllDepartments() {
    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseRest.get("departments", "order=name.asc");
        if (rows && Array.isArray(rows)) return { ok: true, data: rows };
      } catch (err) {
        console.warn("Supabase adminGetAllDepartments failed, using fallback:", err.message);
      }
    }
    return { ok: true, data: demoDeptStore };
  },

  /**
   * 2. GET /semesters
   */
  async getSemesters(departmentId) {
    if (!departmentId) return { ok: true, data: [] };

    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseRest.get("semesters", `department_id=eq.${departmentId}&order=semester_number.asc`);
        if (rows && rows.length > 0) return { ok: true, data: rows };
      } catch (err) {
        console.warn("Supabase getSemesters failed, using fallback:", err.message);
      }
    }

    return {
      ok: true,
      data: DEMO_SEMESTERS.map((s) => ({ ...s, department_id: departmentId })),
    };
  },

  /**
   * 3. GET /subjects
   */
  async getSubjects(semesterId, departmentId) {
    return {
      ok: true,
      data: [
        { id: "subj-1", name: "Core Module 1", code: "MOD101" },
        { id: "subj-2", name: "Core Module 2", code: "MOD102" },
        { id: "subj-3", name: "Elective Module", code: "MOD103" },
      ],
    };
  },

  /**
   * 4. GET /materials (Browse tab)
   */
  async getMaterials(filters = {}) {
    const status = filters.status || "approved";
    const deptFilter = filters.department_id || filters.department || "";
    const semFilter = filters.semester_id || filters.semester || "";
    const subjFilter = filters.subject_id || filters.subject || "";
    const typeFilter = filters.material_type || filters.type || "";
    const searchFilter = filters.search || "";

    if (isSupabaseConfigured()) {
      try {
        const queryParts = [
          "select=*,departments(id,name,code),semesters(id,semester_number,name)",
          status === "all" ? "" : `status=eq.${status}`,
        ].filter(Boolean);

        if (deptFilter) queryParts.push(`department_id=eq.${deptFilter}`);
        if (semFilter) queryParts.push(`semester_id=eq.${semFilter}`);
        if (subjFilter) queryParts.push(`subject=ilike.*${subjFilter}*`);
        if (typeFilter) queryParts.push(`material_type=eq.${typeFilter}`);
        if (searchFilter) queryParts.push(`title=ilike.*${searchFilter}*`);
        queryParts.push("order=created_at.desc");

        let rows;
        try {
          rows = await supabaseRest.get("academic_materials", queryParts.join("&"));
        } catch {
          const fallbackQuery = [
            "select=*",
            status === "all" ? "" : `status=eq.${status}`,
            "order=created_at.desc",
          ].filter(Boolean).join("&");
          rows = await supabaseRest.get("academic_materials", fallbackQuery);
        }

        const normalized = (rows || []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || "",
          department_id: r.department_id,
          department: r.departments?.name || r.department || "Department",
          departmentCode: r.departments?.code || r.departmentCode || "",
          semester_id: r.semester_id,
          semester: r.semesters?.semester_number || r.semester || 1,
          semesterName: r.semesters?.name || (r.semester ? `Semester ${r.semester}` : "Semester 1"),
          subject_id: r.subject_id || r.subject,
          subject: r.subject || "General",
          material_type: r.material_type,
          type: r.material_type,
          academic_year: r.academic_year || "2025-2026",
          storage_path: r.storage_path,
          file_url: r.file_url || r.storage_path,
          url: r.file_url || r.storage_path,
          original_filename: r.original_filename,
          mime_type: r.mime_type,
          file_size: r.file_size,
          size: `${(Number(r.file_size || 0) / (1024 * 1024)).toFixed(1)} MB`,
          uploaded_by: r.uploaded_by,
          uploadedBy: r.uploaded_by === "demo-user" ? "Student" : (r.uploaded_by || "Student"),
          uploadedAt: r.created_at ? r.created_at.split("T")[0] : "Recent",
          status: r.status || "pending_review",
          downloads_count: r.downloads_count || 0,
          downloads: r.downloads_count || 0,
          views_count: r.views_count || 0,
          views: r.views_count || 0,
          created_at: r.created_at,
        }));

        return { ok: true, data: normalized };
      } catch (err) {
        console.warn("Supabase getMaterials failed, falling back:", err.message);
      }
    }

    const filtered = demoMaterialsStore.filter((mat) => {
      if (status && status !== "all" && mat.status !== status) return false;
      if (deptFilter && mat.department_id !== deptFilter && mat.department !== deptFilter) return false;
      if (semFilter && mat.semester_id !== semFilter && String(mat.semester) !== String(semFilter)) return false;
      if (subjFilter && !mat.subject?.toLowerCase().includes(subjFilter.toLowerCase())) return false;
      if (typeFilter && mat.material_type !== typeFilter && mat.type !== typeFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesTitle = mat.title?.toLowerCase().includes(q);
        const matchesDesc = mat.description?.toLowerCase().includes(q);
        const matchesSubj = mat.subject?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSubj) return false;
      }
      return true;
    });

    return { ok: true, data: filtered };
  },

  /**
   * 5. POST /materials (Upload material)
   */
  async uploadMaterial(payload) {
    let file = null;
    let title = "";
    let description = "";
    let departmentId = "";
    let semesterId = "";
    let subjectName = "";
    let materialType = "notes";
    let academicYear = "2025-2026";
    const user = getAuthUser();
    let uploadedBy = user?.id || getAuthUserId() || "student";

    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      file = payload.get("file");
      title = payload.get("title") || file?.name || "Untitled Material";
      description = payload.get("description") || "";
      departmentId = payload.get("department_id") || payload.get("department") || "";
      semesterId = payload.get("semester_id") || payload.get("semester") || "";
      subjectName = payload.get("subject") || payload.get("subject_id") || "General";
      materialType = payload.get("material_type") || payload.get("type") || "notes";
      academicYear = payload.get("academic_year") || "2025-2026";
      if (payload.get("uploaded_by")) uploadedBy = payload.get("uploaded_by");
    } else if (payload && typeof payload === "object") {
      file = payload.file;
      title = payload.title || file?.name || "Untitled Material";
      description = payload.description || "";
      departmentId = payload.department_id || payload.department || "";
      semesterId = payload.semester_id || payload.semester || "";
      subjectName = payload.subject || payload.subject_id || "General";
      materialType = payload.material_type || payload.type || "notes";
      academicYear = payload.academic_year || "2025-2026";
      if (payload.uploaded_by) uploadedBy = payload.uploaded_by;
    }

    if (!file) return { ok: false, error: "Please select a file to upload" };

    const sanitizedName = `${Date.now()}_${(file.name || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const storageRes = await storageService.upload(file, {
      bucket: "academic_materials",
      folder: "materials",
      fileName: sanitizedName,
    });

    if (!storageRes.ok) {
      return { ok: false, error: storageRes.error || "Failed to upload file to storage" };
    }

    const finalStoragePath = storageRes.data?.path || `materials/${sanitizedName}`;
    const finalUrl = storageRes.data?.url || storageRes.data?.fileUrl || "";
    const originalFilename = file.name || "material.pdf";
    const mimeType = file.type || "application/pdf";
    const fileSize = file.size || 0;

    if (isSupabaseConfigured()) {
      try {
        const newRecord = {
          title,
          description,
          department_id: departmentId || null,
          semester_id: semesterId || null,
          subject: subjectName,
          material_type: materialType,
          academic_year: academicYear,
          storage_path: finalStoragePath,
          file_url: finalUrl,
          original_filename: originalFilename,
          mime_type: mimeType,
          file_size: fileSize,
          uploaded_by: uploadedBy,
          status: "pending_review",
        };

        const inserted = await supabaseRest.post("academic_materials", newRecord);
        return {
          ok: true,
          data: Array.isArray(inserted) ? inserted[0] : inserted,
          message: "Material submitted for maintainer review",
        };
      } catch (err) {
        console.warn("Supabase record creation failed, falling back:", err.message);
      }
    }

    const demoRecord = {
      id: `mat-${Date.now()}`,
      title,
      description,
      department_id: departmentId,
      semester_id: semesterId,
      subject: subjectName,
      material_type: materialType,
      type: materialType,
      academic_year: academicYear,
      storage_path: finalStoragePath,
      file_url: finalUrl,
      original_filename: originalFilename,
      mime_type: mimeType,
      file_size: fileSize,
      size: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`,
      uploaded_by: uploadedBy,
      uploadedBy: user?.name || "Current Student",
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "pending_review",
      downloads_count: 0,
      downloads: 0,
      views_count: 1,
      views: 1,
      created_at: new Date().toISOString(),
    };

    demoMaterialsStore.unshift(demoRecord);
    return {
      ok: true,
      data: demoRecord,
      message: "Material submitted for maintainer review",
    };
  },

  /**
   * 6. GET /my-uploads
   */
  async getMyUploads(userId = "") {
    const user = getAuthUser();
    const activeUserId = userId || user?.id || getAuthUserId() || "student";

    if (isSupabaseConfigured()) {
      try {
        let rows = await supabaseRest.get("academic_materials", "order=created_at.desc&limit=50");
        const normalized = (rows || []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || "",
          department: r.department || "Department",
          semester: r.semester || 1,
          semesterName: r.semester ? `Sem ${r.semester}` : "Sem 1",
          subject: r.subject || "General",
          type: r.material_type,
          material_type: r.material_type,
          original_filename: r.original_filename,
          file_url: r.file_url || r.storage_path,
          url: r.file_url || r.storage_path,
          size: `${(Number(r.file_size || 0) / (1024 * 1024)).toFixed(1)} MB`,
          status: r.status || "pending_review",
          rejection_reason: r.rejection_reason || "",
          downloads: r.downloads_count || 0,
          views: r.views_count || 0,
          uploadedAt: r.created_at ? r.created_at.split("T")[0] : "Recent",
        }));
        return { ok: true, data: normalized };
      } catch (err) {
        console.warn("Supabase getMyUploads failed:", err.message);
      }
    }

    return { ok: true, data: demoMaterialsStore };
  },

  /**
   * 7. GET /download
   */
  async downloadMaterial(materialId) {
    if (!materialId) return { ok: false, error: "Material ID is required" };

    this.incrementDownloadCount(materialId).catch(() => {});

    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseRest.get("academic_materials", `id=eq.${materialId}&select=*`);
        if (rows && rows.length > 0) {
          const material = rows[0];
          const storageUrlRes = await storageService.getDownloadUrl(material.storage_path || material.file_url, {
            bucket: "academic_materials",
          });

          return {
            ok: true,
            data: {
              url: storageUrlRes.data?.url || material.file_url || "#",
              fileName: material.original_filename || `${material.title}.pdf`,
              materialId,
            },
          };
        }
      } catch (err) {
        console.warn("Supabase downloadMaterial failed:", err.message);
      }
    }

    const item = demoMaterialsStore.find((m) => m.id === materialId);
    return {
      ok: true,
      data: {
        url: item?.file_url || item?.storage_path || "#",
        fileName: item?.original_filename || "material.pdf",
        materialId,
      },
    };
  },

  /**
   * 8. Maintainer: Approve Material
   */
  async approveMaterial(materialId) {
    if (!materialId) return { ok: false, error: "Material ID is required" };

    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.patch("academic_materials", `id=eq.${materialId}`, { status: "approved" });
        return { ok: true, message: "Material approved successfully" };
      } catch (err) {
        console.warn("Supabase approveMaterial failed:", err.message);
      }
    }

    const item = demoMaterialsStore.find((m) => m.id === materialId);
    if (item) item.status = "approved";
    return { ok: true, message: "Material approved successfully" };
  },

  /**
   * 9. Maintainer: Reject Material
   */
  async rejectMaterial(materialId, rejectionReason = "") {
    if (!materialId) return { ok: false, error: "Material ID is required" };

    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.patch("academic_materials", `id=eq.${materialId}`, {
          status: "rejected",
          rejection_reason: rejectionReason,
        });
        return { ok: true, message: "Material rejected" };
      } catch (err) {
        console.warn("Supabase rejectMaterial failed:", err.message);
      }
    }

    const item = demoMaterialsStore.find((m) => m.id === materialId);
    if (item) {
      item.status = "rejected";
      item.rejection_reason = rejectionReason;
    }
    return { ok: true, message: "Material rejected" };
  },

  /**
   * 10. Increment download count
   */
  async incrementDownloadCount(materialId) {
    if (!materialId) return { ok: false, error: "Material ID is required" };

    if (isSupabaseConfigured()) {
      try {
        const current = await supabaseRest.get("academic_materials", `id=eq.${materialId}&select=downloads_count`);
        const currentCount = current?.[0]?.downloads_count || 0;
        await supabaseRest.patch("academic_materials", `id=eq.${materialId}`, {
          downloads_count: currentCount + 1,
        });
        return { ok: true, count: currentCount + 1 };
      } catch (err) {
        console.warn("Could not increment count in Supabase:", err.message);
      }
    }

    const item = demoMaterialsStore.find((m) => m.id === materialId);
    if (item) {
      item.downloads_count = (item.downloads_count || 0) + 1;
      item.downloads = item.downloads_count;
      return { ok: true, count: item.downloads_count };
    }
    return { ok: true };
  },

  /**
   * 11. Report material
   */
  async reportMaterial(materialId, reportData) {
    return { ok: true, message: "Report submitted successfully" };
  },

  /**
   * 12. Get single material by ID
   */
  async getMaterialById(materialId) {
    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseRest.get("academic_materials", `id=eq.${materialId}&select=*`);
        if (rows && rows.length > 0) return { ok: true, data: rows[0] };
      } catch (err) {
        console.warn("Supabase getMaterialById failed:", err.message);
      }
    }
    const item = demoMaterialsStore.find((m) => m.id === materialId);
    return item ? { ok: true, data: item } : { ok: false, error: "Material not found" };
  },

  getMaterialTypes() {
    return [
      { id: "notes",          label: "Lecture Notes" },
      { id: "question_paper", label: "Previous Question Paper" },
      { id: "lab_manual",     label: "Lab Manual" },
      { id: "slides",         label: "Presentation Slides" },
      { id: "syllabus",       label: "Syllabus Copy" },
      { id: "textbook",       label: "Textbook / Reference" },
      { id: "problems",       label: "Practice Problems" },
    ];
  },

  // ── Department Requests & Admin Flows ──────────────────────────────────────
  async requestNewDepartment(requestData = {}) {
    const { name = "", code = "", reason = "" } = requestData;
    if (!name.trim()) return { ok: false, error: "Department name is required." };
    if (!code.trim()) return { ok: false, error: "Department code is required." };

    const user = getAuthUser();
    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      reason: reason.trim(),
      requested_by: user?.id || getAuthUserId() || "student",
      requester_name: user?.name || "Student",
      status: "pending",
    };

    if (isSupabaseConfigured()) {
      try {
        const res = await supabaseRest.post("department_requests", payload);
        return {
          ok: true,
          data: Array.isArray(res) ? res[0] : res,
          message: "Department request submitted. It will appear once approved.",
        };
      } catch (err) {
        console.warn("Supabase requestNewDepartment failed:", err.message);
      }
    }

    const newRequest = { id: `dreq-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
    demoDeptRequestsStore.unshift(newRequest);
    return { ok: true, data: newRequest, message: "Department request submitted." };
  },

  async getMyDepartmentRequests(userId = "") {
    const activeUserId = userId || getAuthUserId() || "student";
    if (isSupabaseConfigured()) {
      try {
        const data = await supabaseRest.get("department_requests", `requested_by=eq.${activeUserId}&order=created_at.desc`);
        return { ok: true, data: data || [] };
      } catch (err) {
        console.warn("Supabase getMyDepartmentRequests failed:", err.message);
      }
    }
    return { ok: true, data: demoDeptRequestsStore.filter((r) => r.requested_by === activeUserId) };
  },

  async adminGetDepartmentRequests(status = "") {
    if (isSupabaseConfigured()) {
      try {
        const query = status ? `status=eq.${status}&order=created_at.desc` : "order=created_at.desc";
        const data = await supabaseRest.get("department_requests", query);
        return { ok: true, data: data || [] };
      } catch (err) {
        console.warn("Supabase adminGetDepartmentRequests failed:", err.message);
      }
    }
    const filtered = status ? demoDeptRequestsStore.filter((r) => r.status === status) : demoDeptRequestsStore;
    return { ok: true, data: filtered };
  },

  async adminApproveDepartmentRequest(requestId, adminNote = "") {
    if (!requestId) return { ok: false, error: "Request ID is required." };

    if (isSupabaseConfigured()) {
      try {
        const requests = await supabaseRest.get("department_requests", `id=eq.${requestId}&select=*`);
        const req = requests?.[0];

        if (req) {
          const deptId = `dept-${req.code.toLowerCase()}`;

          await supabaseRest.post("departments", {
            id: deptId,
            name: req.name,
            code: req.code,
            active: true,
          });

          const semestersPayload = [1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({
            department_id: deptId,
            semester_number: num,
            name: `Semester ${num} (S${num})`,
          }));
          await supabaseRest.post("semesters", semestersPayload);

          await supabaseRest.patch("department_requests", `id=eq.${requestId}`, {
            status: "approved",
            admin_note: adminNote,
            reviewed_at: new Date().toISOString(),
          });

          return { ok: true, message: `Department "${req.name}" approved and live!` };
        }
      } catch (err) {
        console.warn("Supabase adminApproveDepartmentRequest failed:", err.message);
        return { ok: false, error: err.message };
      }
    }

    const req = demoDeptRequestsStore.find((r) => r.id === requestId);
    if (req) {
      req.status = "approved";
      req.admin_note = adminNote;
      demoDeptStore.push({
        id: `dept-${req.code.toLowerCase()}`,
        name: req.name,
        code: req.code,
        active: true,
      });
      return { ok: true, message: `Department "${req.name}" approved!` };
    }
    return { ok: false, error: "Request not found" };
  },

  async adminRejectDepartmentRequest(requestId, adminNote = "") {
    if (!requestId) return { ok: false, error: "Request ID is required." };

    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.patch("department_requests", `id=eq.${requestId}`, {
          status: "rejected",
          admin_note: adminNote,
          reviewed_at: new Date().toISOString(),
        });
        return { ok: true, message: "Department request rejected." };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    const req = demoDeptRequestsStore.find((r) => r.id === requestId);
    if (req) {
      req.status = "rejected";
      req.admin_note = adminNote;
    }
    return { ok: true, message: "Department request rejected." };
  },

  async adminAddDepartment(deptData = {}) {
    const { name = "", code = "" } = deptData;
    if (!name.trim()) return { ok: false, error: "Department name is required." };
    if (!code.trim()) return { ok: false, error: "Department code is required." };

    const deptId = `dept-${code.trim().toLowerCase()}`;

    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.post("departments", {
          id: deptId,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          active: true,
        });

        const semestersPayload = [1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({
          department_id: deptId,
          semester_number: num,
          name: `Semester ${num} (S${num})`,
        }));
        await supabaseRest.post("semesters", semestersPayload);

        return { ok: true, message: `Department "${name}" created with Semesters 1–8!` };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    demoDeptStore.push({
      id: deptId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      active: true,
    });
    return { ok: true, message: `Department "${name}" created!` };
  },

  async adminCreateDepartment(deptData) {
    return this.adminAddDepartment(deptData);
  },

  async adminToggleDepartment(deptId, currentActive = true) {
    return this.adminSetDepartmentStatus(deptId, !currentActive);
  },

  async adminSetDepartmentStatus(deptId, active) {
    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.patch("departments", `id=eq.${deptId}`, { active });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    const dept = demoDeptStore.find((d) => d.id === deptId);
    if (dept) dept.active = active;
    return { ok: true };
  },

  async adminRenameDepartment(deptId, { name, code }) {
    if (isSupabaseConfigured()) {
      try {
        await supabaseRest.patch("departments", `id=eq.${deptId}`, { name, code });
        return { ok: true, message: "Department updated." };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    const dept = demoDeptStore.find((d) => d.id === deptId);
    if (dept) {
      if (name) dept.name = name;
      if (code) dept.code = code;
    }
    return { ok: true, message: "Department updated." };
  },

async adminDeleteDepartment(departmentId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/departments?id=eq.${departmentId}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=representation", // 👈 Tells Supabase to return JSON instead of empty 204
      },
    });

    if (res.status === 204) {
      return { ok: true, message: "Department deleted successfully" };
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      return { ok: false, error: data?.message || "Failed to delete department" };
    }

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
},
};