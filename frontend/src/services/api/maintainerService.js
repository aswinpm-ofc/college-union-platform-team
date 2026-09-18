import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";

const DEMO_PENDING_MATERIALS = [
  {
    id: "pnd-001",
    title: "Advanced Algorithm Design",
    description: "Comprehensive guide to algorithm design patterns",
    subject: "Algorithms",
    semester: 4,
    uploadedBy: "Student User",
    uploadedAt: "2026-08-28",
    type: "notes",
    size: "4.2 MB",
    status: "pending",
    reportCount: 0,
    review: null,
  },
  {
    id: "pnd-002",
    title: "Cloud Computing Basics",
    description: "Introduction to cloud platforms and services",
    subject: "Cloud Computing",
    semester: 6,
    uploadedBy: "Another Student",
    uploadedAt: "2026-08-27",
    type: "slides",
    size: "3.8 MB",
    status: "pending",
    reportCount: 0,
    review: null,
  },
];

const DEMO_REPORTS = [
  {
    id: "rpt-001",
    materialId: "mat-001",
    reportedBy: "Anonymous",
    reason: "Copyright violation",
    timestamp: "2026-08-25",
    status: "pending",
    material: {
      title: "Data Structures Fundamentals",
      uploadedBy: "Aswin P.",
    },
  },
];

export const maintainerService = {
  async getPendingMaterials() {
    if (DEMO_MODE) {
      return { ok: true, data: DEMO_PENDING_MATERIALS };
    }
    return apiRequest("/api/maintainer/academics/pending", { method: "GET" });
  },

  async getPendingReports() {
    if (DEMO_MODE) {
      return { ok: true, data: DEMO_REPORTS };
    }
    return apiRequest("/api/maintainer/academics/reports", { method: "GET" });
  },

  async approveMaterial(materialId, feedback = "") {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: materialId,
          status: "approved",
          approvedAt: new Date().toISOString().split("T")[0],
          feedback,
        },
      };
    }
    return apiRequest(`/api/maintainer/academics/${materialId}/approve`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    });
  },

  async rejectMaterial(materialId, reason = "") {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: materialId,
          status: "rejected",
          rejectedAt: new Date().toISOString().split("T")[0],
          reason,
        },
      };
    }
    return apiRequest(`/api/maintainer/academics/${materialId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async unpublishMaterial(materialId, reason = "") {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: materialId,
          status: "unpublished",
          unpublishedAt: new Date().toISOString().split("T")[0],
          reason,
        },
      };
    }
    return apiRequest(`/api/maintainer/academics/${materialId}/unpublish`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async resolveReport(reportId, action, notes = "") {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: reportId,
          resolved: true,
          action,
          resolvedAt: new Date().toISOString().split("T")[0],
          notes,
        },
      };
    }
    return apiRequest(`/api/maintainer/academics/reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    });
  },

  async getModerationStats() {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          totalPending: DEMO_PENDING_MATERIALS.length,
          totalReports: DEMO_REPORTS.length,
          approvedToday: 5,
          rejectedToday: 1,
          averageReviewTime: "2 hours",
        },
      };
    }
    return apiRequest("/api/maintainer/academics/stats", { method: "GET" });
  },

  getReportReasons() {
    return [
      { id: "copyright", label: "Copyright Violation" },
      { id: "inappropriate", label: "Inappropriate Content" },
      { id: "incorrect", label: "Incorrect Information" },
      { id: "spam", label: "Spam/Duplicate" },
      { id: "plagiarism", label: "Plagiarism" },
      { id: "other", label: "Other" },
    ];
  },

  getRejectionReasons() {
    return [
      { id: "quality", label: "Poor Quality" },
      { id: "incomplete", label: "Incomplete" },
      { id: "off-topic", label: "Off Topic" },
      { id: "copyright", label: "Copyright Issues" },
      { id: "format", label: "Invalid Format" },
      { id: "other", label: "Other" },
    ];
  },
};
