import React, { useState, useEffect, useRef } from "react";
import { Upload, AlertCircle, Loader, Info, Clock3 } from "lucide-react";
import { Card } from "../../../components/common/PagePrimitives";
import { academicsService } from "../../../services/api/academicsService";

export default function UploadDemo({ notify, onRequestDept }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subject, setSubject] = useState("");
  const [materialType, setMaterialType] = useState("notes");

  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    academicsService.getApprovedDepartments().then((res) => {
      if (res?.ok && Array.isArray(res.data)) {
        setDepartments(res.data);
        if (res.data.length > 0 && !departmentId) {
          setDepartmentId(res.data[0].id);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setSemesters([]);
      return;
    }
    academicsService.getSemesters(departmentId).then((res) => {
      if (res?.ok && Array.isArray(res.data)) {
        setSemesters(res.data);
        if (res.data.length > 0) {
          setSemesterId(res.data[0].id || res.data[0].semester_number || "1");
        }
      }
    });
  }, [departmentId]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Material title is required.");
      return;
    }
    if (!departmentId) {
      setError("Please select a department.");
      return;
    }
    if (!semesterId) {
      setError("Please select a semester.");
      return;
    }
    if (!subject.trim()) {
      setError("Subject name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("department_id", departmentId);
      formData.append("semester_id", semesterId);
      formData.append("subject", subject.trim());
      formData.append("material_type", materialType);

      const res = await academicsService.uploadMaterial(formData);

      if (res?.ok) {
        if (typeof notify === "function") {
          notify("Material submitted for maintainer review ✓");
        }
        setFile(null);
        setTitle("");
        setDescription("");
        setSubject("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError(res?.error || "Failed to submit material.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const INPUT_STYLE = {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--line, #e2e8f0)",
    fontSize: "12px",
    color: "var(--ink, #1e293b)",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  };

  const LABEL_STYLE = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--muted, #64748b)",
    marginBottom: "6px",
  };

  return (
    <Card className="upload-card">
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Dropzone Box ────────────────────────────────────────── */}
        <div
          className="upload-zone"
          style={{
            border: "1px dashed var(--line, #cbd5e1)",
            borderRadius: "12px",
            padding: "36px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: "#fcfdff",
            marginBottom: "20px",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.ppt,.docx,.doc"
            style={{ display: "none" }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          <Upload size={28} color="var(--brand, #6557e8)" style={{ margin: "0 auto 10px", display: "block" }} />
          <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--ink, #1e293b)" }}>
            {file ? file.name : "Upload study material"}
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: "11px", color: "var(--muted, #64748b)" }}>
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Selected`
              : "PDF, PPTX, DOCX · Max 25 MB · Drag or click"}
          </p>
          <button
            type="button"
            className="primary small"
            style={{ pointerEvents: "none" }}
          >
            {file ? "Change file" : "Choose file"}
          </button>
        </div>

        {/* ── Material Title ──────────────────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          <label style={LABEL_STYLE}>Material Title *</label>
          <input
            type="text"
            placeholder="e.g. Data Structures Module 1 — Handwritten Notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            style={INPUT_STYLE}
          />
        </div>

        {/* ── Description ─────────────────────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          <label style={LABEL_STYLE}>Description</label>
          <input
            type="text"
            placeholder="Brief summary, chapters covered, or exam year..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            style={INPUT_STYLE}
          />
        </div>

        {/* ── Department & Semester ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "6px" }}>
          <div>
            <label style={LABEL_STYLE}>Department *</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={submitting}
              style={INPUT_STYLE}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>Semester *</label>
            <select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              disabled={submitting}
              style={INPUT_STYLE}
            >
              {semesters.length > 0 ? (
                semesters.map((s) => (
                  <option key={s.id} value={s.id || s.semester_number}>
                    {s.name || `Semester ${s.semester_number}`}
                  </option>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Semester {n} (S{n})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* ── Request Department Link ─────────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="textbtn"
            onClick={onRequestDept}
            style={{
              fontSize: "11px",
              color: "var(--brand, #6557e8)",
              padding: 0,
              cursor: "pointer",
              background: "none",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Info size={12} /> Can't find your department? Request it
          </button>
        </div>

        {/* ── Subject & Material Type ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={LABEL_STYLE}>Subject *</label>
            <input
              type="text"
              placeholder="e.g. Machine Learning, DBMS, Mechanics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Material Type *</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              disabled={submitting}
              style={INPUT_STYLE}
            >
              <option value="notes">Lecture Notes</option>
              <option value="question_paper">Previous Question Paper</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="slides">Presentation Slides</option>
              <option value="syllabus">Syllabus Copy</option>
              <option value="textbook">Textbook / Reference</option>
              <option value="problems">Practice Problems</option>
            </select>
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              background: "var(--redbg, #fee2e2)",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              color: "var(--red, #b91c1c)",
              fontSize: "11px",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Submit Action & Disclaimer ──────────────────────────── */}
        <button
          type="submit"
          className="primary"
          disabled={submitting}
          style={{ minWidth: "150px", marginBottom: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {submitting ? (
            <>
              <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Submitting…
            </>
          ) : (
            "Submit for review"
          )}
        </button>

        <p className="hint" style={{ margin: 0, fontSize: "11px", color: "var(--muted, #64748b)", display: "flex", alignItems: "center", gap: "5px" }}>
          <Clock3 size={13} />
          New uploads stay <strong>Pending Review</strong> until an Academic Maintainer approves them.
        </p>
      </form>
    </Card>
  );
}