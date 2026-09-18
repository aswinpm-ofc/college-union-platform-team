import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PageHead, Card } from "../../../components/common/PagePrimitives";
import ReviewQueue from "../components/ReviewQueue";
import DepartmentManager from "../components/DepartmentManager";
import { permissionService } from "../../../services/auth/permissionService";
import { Lock, FileText, Building2 } from "lucide-react";

export default function AcademicMaintainerPage() {
  const { notify, user } = useOutletContext();
  const [tab, setTab] = useState("materials");

  const canAccess = permissionService.hasPermission("REVIEW_MATERIAL", user?.role);

  if (!canAccess) {
    return (
      <>
        <PageHead
          eyebrow="ACADEMIC MODERATION"
          title="Maintainer Console"
          desc="Review, approve, reject and unpublish academic materials."
        />
        <Card style={{ textAlign: "center", padding: "60px 20px" }}>
          <Lock size={50} style={{ marginBottom: "15px", opacity: 0.5 }} />
          <h3 style={{ marginBottom: "5px" }}>Access Denied</h3>
          <p style={{ color: "var(--gray)" }}>
            Only academic maintainers and admins can access this console.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="ACADEMIC MODERATION"
        title="Maintainer Console"
        desc="Review, approve, reject and unpublish academic materials."
      />

      {/* ── Tab Switcher ────────────────────────────────────────── */}
      <div className="academic-nav" style={{ marginBottom: "20px" }}>
        <button
          className={tab === "materials" ? "active" : ""}
          onClick={() => setTab("materials")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <FileText size={15} />
          Pending Uploads
        </button>

        <button
          className={tab === "departments" ? "active" : ""}
          onClick={() => setTab("departments")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Building2 size={15} />
          Departments & Requests
        </button>
      </div>

      {/* ── Active View ─────────────────────────────────────────── */}
      {tab === "materials" && (
        <ReviewQueue notify={notify} user={user} />
      )}

      {tab === "departments" && (
        <DepartmentManager notify={notify} />
      )}
    </>
  );
}