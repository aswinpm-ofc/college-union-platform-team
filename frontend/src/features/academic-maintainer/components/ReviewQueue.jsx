import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Flag,
  Clock3,
  AlertCircle,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Card } from "../../../components/common/PagePrimitives";
import { maintainerService } from "../../../services/api/maintainerService";
import { academicsService } from "../../../services/api/academicsService";
import { permissionService } from "../../../services/auth/permissionService";

export default function ReviewQueue({ notify, user }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPendingMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];

      // 1. Try maintainerService first
      if (maintainerService?.getPendingMaterials) {
        try {
          const response = await maintainerService.getPendingMaterials();
          if (response?.ok && Array.isArray(response.data)) {
            list = response.data;
          } else if (Array.isArray(response?.data?.materials)) {
            list = response.data.materials;
          } else if (Array.isArray(response)) {
            list = response;
          }
        } catch {
          // Fall through to academicsService
        }
      }

      // 2. Fallback to academicsService directly (connected to Supabase academic_materials)
      if (list.length === 0 && academicsService?.getMaterials) {
        try {
          const acadRes = await academicsService.getMaterials({ status: "pending_review" });
          if (acadRes?.ok && Array.isArray(acadRes.data)) {
            list = acadRes.data;
          }
        } catch {
          // Fall through
        }
      }

      setPending(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load pending materials");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingMaterials();
  }, [loadPendingMaterials]);

  const handleApprove = async (materialId) => {
    const canApprove = permissionService.canPerformAction("APPROVE_MATERIAL", user);
    if (!canApprove.allowed) {
      notify("Only maintainers and admins can approve materials");
      return;
    }

    try {
      let res = null;
      if (academicsService?.approveMaterial) {
        res = await academicsService.approveMaterial(materialId);
      } else if (maintainerService?.approveMaterial) {
        res = await maintainerService.approveMaterial(materialId);
      }

      if (res?.ok) {
        notify("Material approved ✓");
        setPending((prev) => (Array.isArray(prev) ? prev.filter((m) => m.id !== materialId) : []));
      } else {
        notify(res?.error || "Error approving material");
      }
    } catch {
      notify("Error approving material");
    }
  };

  const handleReject = async (materialId) => {
    const canReject = permissionService.canPerformAction("REJECT_MATERIAL", user);
    if (!canReject.allowed) {
      notify("Only maintainers and admins can reject materials");
      return;
    }

    const reason = window.prompt("Reason for rejection (optional):") || "";

    try {
      let res = null;
      if (academicsService?.rejectMaterial) {
        res = await academicsService.rejectMaterial(materialId, reason);
      } else if (maintainerService?.rejectMaterial) {
        res = await maintainerService.rejectMaterial(materialId, reason);
      }

      if (res?.ok) {
        notify("Material rejected ✗");
        setPending((prev) => (Array.isArray(prev) ? prev.filter((m) => m.id !== materialId) : []));
      } else {
        notify(res?.error || "Error rejecting material");
      }
    } catch {
      notify("Error rejecting material");
    }
  };

  const handlePreview = async (m) => {
    if (m.file_url && m.file_url !== "#") {
      window.open(m.file_url, "_blank");
    } else if (academicsService?.downloadMaterial) {
      const res = await academicsService.downloadMaterial(m.id);
      if (res?.ok && res.data?.url && res.data.url !== "#") {
        window.open(res.data.url, "_blank");
      } else {
        notify(`Previewing: ${m.title}`);
      }
    } else {
      notify(`Previewing: ${m.title}`);
    }
  };

  const canReview = permissionService.hasPermission("REVIEW_MATERIAL", user?.role);

  if (!canReview) {
    return (
      <Card style={{ textAlign: "center", padding: "40px" }}>
        <Lock size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
        <p>You don't have permission to review materials</p>
        <small>Only maintainers and admins can access this feature</small>
      </Card>
    );
  }

  const pendingList = Array.isArray(pending) ? pending : [];

  return (
    <div className="review-layout">
      <Card>
        <div className="card-head" style={{ marginBottom: "16px" }}>
          <div>
            <h3>Pending academic uploads</h3>
            <p>Review and moderate student study material submissions.</p>
          </div>
          <span className="pill">{pendingList.length} pending</span>
        </div>

        {loading && (
          <p style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
            Loading pending materials…
          </p>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && pendingList.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            All pending materials have been reviewed.
          </p>
        )}

        {!loading &&
          pendingList.map((m) => (
            <div
              className="review-row"
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderBottom: "1px solid var(--line, #e5e7eb)",
              }}
            >
              <div className="file-icon sm">
                <FileText size={18} />
              </div>
              <div className="row-main" style={{ flex: 1 }}>
                <b style={{ fontSize: "12px" }}>{m.title}</b>
                <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  {[
                    m.department,
                    m.subject,
                    m.semesterName || (m.semester ? `Sem ${m.semester}` : ""),
                    m.uploadedBy || "Student",
                    m.uploadedAt || "Recent",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <button
                className="iconbtn"
                title="Preview document"
                onClick={() => handlePreview(m)}
                style={{ padding: "6px" }}
              >
                <ExternalLink size={16} />
              </button>
              <button
                className="approve small"
                onClick={() => handleApprove(m.id)}
              >
                Approve
              </button>
              <button
                className="reject small"
                onClick={() => handleReject(m.id)}
              >
                Reject
              </button>
            </div>
          ))}
      </Card>

      <Card>
        <h3>Maintainer rules</h3>
        <ul className="rule-list">
          <li>
            <CheckCircle2 /> You can only moderate assigned departments/semesters.
          </li>
          <li>
            <ShieldCheck /> Your own uploads cannot be approved by you.
          </li>
          <li>
            <Flag /> Reports create a separate review case.
          </li>
          <li>
            <Clock3 /> Every action is recorded in moderation history.
          </li>
        </ul>
      </Card>
    </div>
  );
}