import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Download,
  FileText,
  Upload,
  AlertCircle,
  Lock,
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Filter,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import UploadDemo from "../components/UploadDemo";
import ReviewQueue from "../../academic-maintainer/components/ReviewQueue";
import RequestDepartmentModal from "../components/RequestDepartmentModal";
import { academicsService } from "../../../services/api/academicsService";
import { permissionService } from "../../../services/auth/permissionService";

// ── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved:       { label: "Approved",       className: "status green"  },
    pending_review: { label: "Pending Review", className: "status amber"  },
    pending:        { label: "Pending Review", className: "status amber"  },
    rejected:       { label: "Rejected",       className: "status red"    },
    unpublished:    { label: "Unpublished",    className: "status"        },
    archived:       { label: "Archived",       className: "status"        },
  };
  const cfg = map[status] || { label: status, className: "status" };
  return <span className={cfg.className}>{cfg.label}</span>;
}

// ── Material type label helper ───────────────────────────────────────────────
const TYPE_LABELS = {
  notes:          "Notes",
  question_paper: "Question Paper",
  lab_manual:     "Lab Manual",
  slides:         "Slides",
  syllabus:       "Syllabus",
  textbook:       "Textbook",
  problems:       "Practice Problems",
};

// ── Department card data ─────────────────────────────────────────────────────
const DEPT_COLORS = [
  "linear-gradient(135deg,#6557e8,#4e43c9)",
  "linear-gradient(135deg,#17845b,#0e5c3d)",
  "linear-gradient(135deg,#b96b0b,#8a4e08)",
  "linear-gradient(135deg,#c93636,#962828)",
  "linear-gradient(135deg,#2563eb,#1d4ed8)",
  "linear-gradient(135deg,#7c3aed,#5b21b6)",
];

/**
 * Universal browser file opener and downloader
 */
function downloadFile(url, fileName) {
  if (!url || url === "#") return;

  if (url.startsWith("data:")) {
    try {
      const arr = url.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      return;
    } catch (err) {
      console.warn("Base64 blob conversion fallback:", err);
    }
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noreferrer noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 300);
}

export default function AcademicsPage() {
  const { notify, user } = useOutletContext();
  const navigate = useNavigate();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("browse");

  // ── Browse: filter state ───────────────────────────────────────────────────
  const [departments, setDepartments]   = useState([]);
  const [semesters,   setSemesters]     = useState([]);
  const [filterDept,  setFilterDept]    = useState("");
  const [filterSem,   setFilterSem]     = useState("");
  const [filterType,  setFilterType]    = useState("");
  const [searchQuery, setSearchQuery]   = useState("");

  // ── Browse: materials state ────────────────────────────────────────────────
  const [materials, setMaterials]   = useState([]);
  const [matLoading, setMatLoading] = useState(false);
  const [matError, setMatError]     = useState(null);

  // ── My Uploads state ──────────────────────────────────────────────────────
  const [myUploads,       setMyUploads]       = useState([]);
  const [uploadsLoading,  setUploadsLoading]  = useState(false);
  const [uploadsError,    setUploadsError]    = useState(null);

  // ── Department request modal ───────────────────────────────────────────────
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  // ── Boot: load approved departments ───────────────────────────────────────
  useEffect(() => {
    academicsService.getApprovedDepartments().then((res) => {
      if (res.ok) setDepartments(res.data || []);
    });
  }, []);

  // ── Cascade: semesters when dept changes ───────────────────────────────────
  useEffect(() => {
    if (!filterDept) {
      setSemesters([]);
      setFilterSem("");
      return;
    }
    academicsService.getSemesters(filterDept).then((res) => {
      if (res.ok) setSemesters(res.data || []);
    });
  }, [filterDept]);

  // ── Load materials on browse tab or filter change ──────────────────────────
  const loadMaterials = useCallback(async () => {
    setMatLoading(true);
    setMatError(null);
    try {
      const filters = {};

      if (filterDept) {
        filters.department_id = filterDept;
        if (filterSem) filters.semester_id = filterSem;
      }

      if (filterType)   filters.material_type = filterType;
      if (searchQuery)  filters.search        = searchQuery;

      const res = await academicsService.getMaterials(filters);
      if (res.ok) {
        setMaterials(res.data || []);
      } else {
        setMatError("Failed to load materials. Please try again.");
      }
    } catch (err) {
      setMatError(err.message || "An unexpected error occurred.");
    } finally {
      setMatLoading(false);
    }
  }, [filterDept, filterSem, filterType, searchQuery]);

  useEffect(() => {
    if (tab === "browse") loadMaterials();
  }, [tab, loadMaterials]);

  // ── Load my uploads on tab switch ─────────────────────────────────────────
  const loadMyUploads = useCallback(async () => {
    setUploadsLoading(true);
    setUploadsError(null);
    try {
      const res = await academicsService.getMyUploads();
      if (res.ok) {
        setMyUploads(res.data || []);
      } else {
        setUploadsError("Failed to load your uploads.");
      }
    } catch (err) {
      setUploadsError(err.message || "An unexpected error occurred.");
    } finally {
      setUploadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "myuploads") loadMyUploads();
  }, [tab, loadMyUploads]);

  // ── File download / view handler ───────────────────────────────────────────
  const handleDownload = async (material) => {
    notify(`Opening document: ${material.title}`);
    try {
      const res = await academicsService.downloadMaterial(material.id);
      if (res.ok && res.data?.url && res.data.url !== "#") {
        const targetUrl = res.data.url;
        const targetName = res.data.fileName || material.original_filename || `${material.title}.pdf`;
        downloadFile(targetUrl, targetName);
      } else {
        notify("Unable to retrieve file.");
      }

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === material.id
            ? { ...m, downloads: (m.downloads || 0) + 1, downloads_count: (m.downloads_count || 0) + 1 }
            : m
        )
      );
    } catch (err) {
      console.warn("Download failed:", err);
      notify("Download failed. Please try again.");
    }
  };

  const handleUploadTab = () => {
    const check = permissionService.canPerformAction("UPLOAD_MATERIAL", user);
    if (!check.allowed) {
      if (check.reason === "LOGIN_REQUIRED") {
        notify("Please login to upload materials");
        navigate("/login");
      }
      return;
    }
    setTab("myuploads");
  };

  const handleReviewTab = () => {
    const check = permissionService.canPerformAction("REVIEW_MATERIAL", user);
    if (!check.allowed) {
      notify("Only maintainers and admins can review materials");
      return;
    }
    setTab("review");
  };

  const handleDeptFilter = (deptId) => {
    setFilterDept(deptId);
    setFilterSem("");
    setFilterType("");
    setSearchQuery("");
    setTab("browse");
  };

  // ── Breadcrumb label helpers ───────────────────────────────────────────────
  const activeDeptName = departments.find((d) => d.id === filterDept)?.name || "";
  const activeSemName  = semesters.find((s) => s.id === filterSem)?.name || "";

  const materialTypes = academicsService.getMaterialTypes();

  return (
    <>
      <PageHead
        eyebrow="ACADEMIC RESOURCE HUB"
        title="Academics"
        desc="Department → Semester → Study Materials"
        action={
          permissionService.hasPermission("UPLOAD_MATERIAL", user?.role) ? (
            <button className="primary" onClick={handleUploadTab}>
              <Upload size={16} /> Upload material
            </button>
          ) : permissionService.hasPermission("REVIEW_MATERIAL", user?.role) ? (
            <button className="primary" onClick={handleReviewTab}>
              Review queue
            </button>
          ) : null
        }
      />

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="academic-nav">
        <button
          className={tab === "browse" ? "active" : ""}
          onClick={() => setTab("browse")}
        >
          Browse materials
        </button>

        {permissionService.hasPermission("UPLOAD_MATERIAL", user?.role) && (
          <button
            className={tab === "myuploads" ? "active" : ""}
            onClick={handleUploadTab}
          >
            My uploads
          </button>
        )}

        <button
          className={tab === "departments" ? "active" : ""}
          onClick={() => setTab("departments")}
        >
          Departments
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 1 — Browse Materials                                           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === "browse" && (
        <>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
              alignItems: "center",
            }}
          >
            <div
              className="searchbox"
              style={{ flex: 1, maxWidth: "360px" }}
            >
              <Search size={14} />
              <input
                placeholder="Search by title, subject…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadMaterials()}
              />
            </div>
            <button className="outline small" onClick={loadMaterials}>
              <Filter size={13} /> Search
            </button>
          </div>

          {/* Filter dropdowns */}
          <div className="filterbar" style={{ flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            {/* Department */}
            <select
              className="filter"
              value={filterDept}
              onChange={(e) => {
                const nextDept = e.target.value;
                setFilterDept(nextDept);
                setFilterSem("");
                if (!nextDept) {
                  setSemesters([]);
                }
              }}
              style={{ borderRadius: "8px", padding: "8px 10px", fontSize: "11px" }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} – {d.name}
                </option>
              ))}
            </select>

            {/* Add missing department */}
            <button
              type="button"
              className="textbtn"
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "6px 8px" }}
              onClick={() => setDeptModalOpen(true)}
              title="Request a department that's not listed"
            >
              <PlusCircle size={13} />
              Add department
            </button>

            {/* Semester */}
            {filterDept && semesters.length > 0 && (
              <select
                className="filter"
                value={filterSem}
                onChange={(e) => {
                  const nextSem = e.target.value;
                  setFilterSem(nextSem);
                }}
                style={{ borderRadius: "8px", padding: "8px 10px", fontSize: "11px" }}
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Material type */}
            <select
              className="filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ borderRadius: "8px", padding: "8px 10px", fontSize: "11px" }}
            >
              <option value="">All Types</option>
              {materialTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {(filterDept || filterSem || filterType || searchQuery) && (
              <button
                className="textbtn"
                style={{ fontSize: "11px" }}
                onClick={() => {
                  setFilterDept("");
                  setFilterSem("");
                  setFilterType("");
                  setSearchQuery("");
                  setSemesters([]);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Breadcrumb path */}
          {(activeDeptName || activeSemName) && (
            <div className="academic-path">
              {activeDeptName && <span>{activeDeptName}</span>}
              {activeSemName  && <><ChevronRight /><b>{activeSemName}</b></>}
            </div>
          )}

          {/* Loading */}
          {matLoading && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)", fontSize: "13px" }}>
              Loading materials…
            </div>
          )}

          {/* Error */}
          {matError && !matLoading && (
            <div
              className="card"
              style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--red)", padding: "18px 20px" }}
            >
              <AlertCircle size={18} />
              <p style={{ margin: 0, fontSize: "13px" }}>{matError}</p>
            </div>
          )}

          {/* Empty state */}
          {!matLoading && !matError && materials.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <FileText size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "13px" }}>No approved materials found for this selection.</p>
              {(filterDept || filterSem || filterType || searchQuery) && (
                <button
                  className="textbtn"
                  style={{ marginTop: "10px", fontSize: "12px" }}
                  onClick={() => {
                    setFilterDept("");
                    setFilterSem("");
                    setFilterType("");
                    setSearchQuery("");
                    setSemesters([]);
                  }}
                >
                  Clear filters and show all
                </button>
              )}
            </div>
          )}

          {/* Material grid */}
          {!matLoading && materials.length > 0 && (
            <div className="material-grid">
              {materials.map((m) => (
                <Card key={m.id}>
                  <div className="file-icon">
                    <FileText />
                  </div>
                  <span className="pill" style={{ marginBottom: "8px" }}>
                    {TYPE_LABELS[m.type] || TYPE_LABELS[m.material_type] || m.type || "Material"}
                  </span>
                  <h3>{m.title}</h3>
                  
                  <p style={{ margin: "4px 0 8px", color: "var(--muted)", fontSize: "11px", fontWeight: 500 }}>
                    {[
                      m.subject,
                      m.semesterName || (m.semester ? `Semester ${m.semester}` : "")
                    ].filter(Boolean).join(" · ")}
                  </p>

                  {m.description && (
                    <p style={{ margin: "0 0 12px", fontSize: "11px", color: "var(--ink)", opacity: 0.85, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {m.description}
                    </p>
                  )}

                  <div className="material-meta" style={{ marginTop: "auto", paddingTop: "8px" }}>
                    <small>
                      {m.views || m.views_count || 0} views · {m.downloads || m.downloads_count || 0} downloads
                    </small>
                  </div>
                  <div className="material-foot">
                    <StatusBadge status={m.status} />
                    <button className="outline small" onClick={() => handleDownload(m)}>
                      <Download size={14} /> Download
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 2 — My Uploads                                                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === "myuploads" && (
        <>
          {permissionService.hasPermission("UPLOAD_MATERIAL", user?.role) ? (
            <>
              <UploadDemo
                notify={(msg) => {
                  notify(msg);
                  setTimeout(() => loadMyUploads(), 600);
                }}
                onRequestDept={() => setDeptModalOpen(true)}
              />

              <div style={{ margin: "28px 0 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--line)" }} />
                <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em" }}>
                  YOUR SUBMITTED MATERIALS
                </span>
                <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--line)" }} />
              </div>

              {uploadsLoading && (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)", fontSize: "13px" }}>
                  Loading your uploads…
                </div>
              )}

              {uploadsError && !uploadsLoading && (
                <div
                  className="card"
                  style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--red)", padding: "16px 18px" }}
                >
                  <AlertCircle size={16} />
                  <p style={{ margin: 0, fontSize: "12px" }}>{uploadsError}</p>
                </div>
              )}

              {!uploadsLoading && !uploadsError && myUploads.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <BookOpen size={36} style={{ marginBottom: "10px", opacity: 0.35 }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>You haven't uploaded any materials yet.</p>
                </div>
              )}

              {!uploadsLoading && myUploads.length > 0 && (
                <div style={{ display: "grid", gap: "10px" }}>
                  {myUploads.map((m) => (
                    <div
                      key={m.id}
                      className="card"
                      style={{ display: "flex", alignItems: "center", gap: "13px", padding: "14px 18px" }}
                    >
                      <div className="file-icon sm">
                        <FileText size={16} />
                      </div>
                      <div className="row-main" style={{ flex: 1 }}>
                        <b>{m.title}</b>
                        <span style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                          {[
                            m.subject,
                            m.semesterName || (m.semester ? `Sem ${m.semester}` : ""),
                            m.type ? (TYPE_LABELS[m.type] || m.type) : "",
                            m.size,
                          ].filter(Boolean).join(" · ")}
                        </span>
                        {m.status === "rejected" && m.rejection_reason && (
                          <span style={{ color: "var(--red)", fontSize: "9px", marginTop: "3px", display: "block" }}>
                            Reason: {m.rejection_reason}
                          </span>
                        )}
                      </div>
                      <small style={{ color: "var(--muted)", fontSize: "9px", whiteSpace: "nowrap" }}>
                        {m.uploadedAt || ""}
                      </small>
                      <StatusBadge status={m.status} />

                      <button
                        className="outline small"
                        onClick={() => handleDownload(m)}
                        title="View / Test your uploaded document"
                        style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <ExternalLink size={12} /> View File
                      </button>

                      {m.status === "approved" && <CheckCircle size={15} color="var(--green)" />}
                      {(m.status === "pending_review" || m.status === "pending") && (
                        <Clock size={15} color="var(--amber)" />
                      )}
                      {m.status === "rejected" && <XCircle size={15} color="var(--red)" />}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card style={{ textAlign: "center", padding: "60px 20px" }}>
              <Lock size={40} style={{ marginBottom: "10px", opacity: 0.4 }} />
              <p>You don't have permission to upload materials.</p>
            </Card>
          )}
        </>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* TAB 3 — Departments                                                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {tab === "departments" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>
              Click a department to filter Browse Materials.
            </p>
            <button
              className="primary small"
              onClick={() => setDeptModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <PlusCircle size={14} /> Request Department
            </button>
          </div>

          {departments.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
              <Building2 size={36} style={{ marginBottom: "12px", opacity: 0.35 }} />
              <p style={{ margin: 0, fontSize: "13px" }}>No departments found.</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {departments.map((dept, idx) => (
              <button
                key={dept.id}
                onClick={() => handleDeptFilter(dept.id)}
                style={{
                  border: filterDept === dept.id ? "2px solid var(--brand)" : "1px solid var(--line)",
                  borderRadius: "14px",
                  background: "#fff",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  overflow: "hidden",
                  transition: "transform .2s ease, box-shadow .2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px #6557e820"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div
                  style={{
                    height: "90px",
                    background: DEPT_COLORS[idx % DEPT_COLORS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={36} color="rgba(255,255,255,0.75)" />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        letterSpacing: ".1em",
                        background: "var(--soft)",
                        color: "var(--brand)",
                        padding: "3px 7px",
                        borderRadius: "20px",
                      }}
                    >
                      {dept.code}
                    </span>
                    {filterDept === dept.id && (
                      <span style={{ fontSize: "8px", color: "var(--brand)", fontWeight: 700 }}>ACTIVE</span>
                    )}
                  </div>
                  <b style={{ display: "block", fontSize: "12px", color: "var(--ink)", lineHeight: 1.4 }}>
                    {dept.name}
                  </b>
                  <p style={{ margin: "5px 0 0", fontSize: "10px", color: "var(--muted)" }}>
                    Browse study materials →
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Global Modal ───────────────────────────────────────────────────── */}
      {deptModalOpen && (
        <RequestDepartmentModal
          notify={notify}
          onClose={() => setDeptModalOpen(false)}
          onSuccess={() => {
            setDeptModalOpen(false);
            academicsService.getApprovedDepartments().then((res) => {
              if (res.ok) setDepartments(res.data || []);
            });
          }}
        />
      )}
    </>
  );
}