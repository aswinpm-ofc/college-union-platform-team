import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/constants";
import { getAuthHeaders } from "../../lib/supabaseClient";

const DEMO_WELFARE = [
  {
    id: "wlf-001",
    title: "Merit Scholarship 2026-27",
    description: "For students with outstanding academic performance",
    category: "scholarship",
    opportunityType: "financial",
    deadline: "2026-09-30",
    amount: "₹1,00,000",
    eligibility: "CGPA >= 8.5",
    applicants: 234,
    status: "active",
    publishedAt: "2026-08-01",
  },
  {
    id: "wlf-002",
    title: "Financial Aid for Economically Weaker Students",
    description: "Support for students from low-income backgrounds",
    category: "financial-aid",
    opportunityType: "financial",
    deadline: "2026-10-15",
    amount: "₹50,000",
    eligibility: "Annual family income < ₹3 lakhs",
    applicants: 156,
    status: "active",
    publishedAt: "2026-08-05",
  },
  {
    id: "wlf-003",
    title: "Hostel Accommodation Priority",
    description: "Priority allocation of hostel beds",
    category: "hostel",
    opportunityType: "accommodation",
    deadline: "2026-09-20",
    eligibility: "Final year students",
    applicants: 89,
    status: "active",
    publishedAt: "2026-08-10",
  },
  {
    id: "wlf-004",
    title: "Sports Training Program",
    description: "Intensive training for university sports teams",
    category: "sports",
    opportunityType: "development",
    deadline: "2026-09-05",
    eligibility: "Trials required",
    applicants: 45,
    status: "active",
    publishedAt: "2026-08-15",
  },
];

export const welfareService = {
  async getWelfarePlatforms() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/welfare_items?select=*&status=eq.published&order=deadline.asc`, { headers: await getAuthHeaders() });
        if (!response.ok) throw new Error(`Supabase welfare request failed: ${response.status}`);
        const rows = await response.json();
        return { ok: true, data: rows.map((item) => ({ ...item, category: item.type, source_url: item.source_url || "", applicants: 0 })) };
      } catch (error) {
        return { ok: false, error: error.message, data: [] };
      }
    }
    if (DEMO_MODE) {
      return { ok: true, data: DEMO_WELFARE };
    }
    return apiRequest("/api/welfare", { method: "GET" });
  },

  async getWelfareDetails(welfareId) {
    if (DEMO_MODE) {
      const welfare = DEMO_WELFARE.find((w) => w.id === welfareId);
      return welfare
        ? {
            ok: true,
            data: {
              ...welfare,
              fullDescription:
                welfare.description + "\n\nDetailed information and application process available here.",
              applicationRequirements: [
                "Valid college ID",
                "Income certificate",
                "Academic transcripts",
              ],
              applicationSteps: [
                "Fill application form",
                "Submit documents",
                "Verification",
                "Selection",
              ],
            },
          }
        : { ok: false, status: 404, data: { error: "Welfare opportunity not found" } };
    }
    return apiRequest(`/api/welfare/${welfareId}`, { method: "GET" });
  },

  async applyForWelfare(welfareId, applicationData) {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: `app-${Date.now()}`,
          welfareId,
          status: "submitted",
          appliedAt: new Date().toISOString().split("T")[0],
          ...applicationData,
        },
      };
    }
    return apiRequest(`/api/welfare/${welfareId}/apply`, {
      method: "POST",
      body: JSON.stringify(applicationData),
    });
  },

  async getMyApplications() {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: [
          {
            id: "app-001",
            welfareId: "wlf-001",
            title: "Merit Scholarship 2026-27",
            status: "submitted",
            appliedAt: "2026-08-28",
            lastUpdate: "2026-08-29",
          },
        ],
      };
    }
    return apiRequest("/api/welfare/my-applications", { method: "GET" });
  },

  getCategories() {
    return [
      { id: "scholarship", label: "Scholarships" },
      { id: "financial-aid", label: "Financial Aid" },
      { id: "hostel", label: "Hostel" },
      { id: "sports", label: "Sports" },
      { id: "career", label: "Career Development" },
    ];
  },

  getStatusBadges() {
    return {
      submitted: { label: "Submitted", color: "blue" },
      under_review: { label: "Under Review", color: "yellow" },
      approved: { label: "Approved", color: "green" },
      rejected: { label: "Rejected", color: "red" },
      completed: { label: "Completed", color: "gray" },
    };
  },
};
