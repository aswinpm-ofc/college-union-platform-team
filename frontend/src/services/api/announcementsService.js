import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/constants";
import { getAuthHeaders } from "../../lib/supabaseClient";

const DEMO_ANNOUNCEMENTS = [
  {
    id: "ann-001",
    title: "Library extended hours",
    content: "The main library will remain open until 11 PM during exam season",
    category: "library",
    publishedAt: "2026-08-28",
    author: "Library Administration",
    priority: "high",
  },
  {
    id: "ann-002",
    title: "Sports festival registration open",
    content: "Register for the annual sports festival by September 10, 2026",
    category: "sports",
    publishedAt: "2026-08-27",
    author: "Sports Committee",
    priority: "normal",
  },
  {
    id: "ann-003",
    title: "Campus WiFi upgrade",
    content: "WiFi infrastructure will be upgraded on weekends with possible downtime",
    category: "infrastructure",
    publishedAt: "2026-08-25",
    author: "IT Department",
    priority: "normal",
  },
];

export const announcementsService = {
  async getAnnouncements(filters = {}) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const params = new URLSearchParams({ select: "*", status: "eq.published", order: "publish_at.desc" });
      if (filters.category && filters.category !== "all") params.set("category", `eq.${filters.category}`);
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/announcements?${params}`, { headers: await getAuthHeaders() });
        if (!response.ok) throw new Error(`Supabase announcements request failed: ${response.status}`);
        const rows = await response.json();
        return { ok: true, data: rows.map((item) => ({ ...item, content: item.body, publishedAt: item.publish_at?.split("T")[0] || "", attachmentUrl: item.attachment_url, attachmentType: item.attachment_type, attachmentName: item.attachment_name })) };
      } catch (error) {
        return { ok: false, error: error.message, data: [] };
      }
    }
    if (DEMO_MODE) {
      const filtered = DEMO_ANNOUNCEMENTS.filter((ann) => {
        if (filters.category && ann.category !== filters.category) return false;
        if (filters.priority && ann.priority !== filters.priority) return false;
        return true;
      });
      return { ok: true, data: filtered };
    }
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/announcements?${params}`, { method: "GET" });
  },

  async getAnnouncementDetails(announcementId) {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/announcements?id=eq.${announcementId}&select=*`, { headers: await getAuthHeaders() });
      const rows = response.ok ? await response.json() : [];
      const item = rows[0];
      return item ? { ok: true, data: { ...item, content: item.body, fullContent: item.body, attachmentUrl: item.attachment_url, attachmentType: item.attachment_type, attachmentName: item.attachment_name } } : { ok: false, status: 404, data: { error: "Announcement not found" } };
    }
    if (DEMO_MODE) {
      const announcement = DEMO_ANNOUNCEMENTS.find((a) => a.id === announcementId);
      return announcement
        ? {
            ok: true,
            data: {
              ...announcement,
              fullContent: announcement.content + "\n\nFor more information, contact the relevant department.",
              attachments: [],
            },
          }
        : { ok: false, status: 404, data: { error: "Announcement not found" } };
    }
    return apiRequest(`/api/announcements/${announcementId}`, { method: "GET" });
  },

  getCategories() {
    return [
      { id: "general", label: "General" },
      { id: "library", label: "Library" },
      { id: "infrastructure", label: "Infrastructure" },
      { id: "sports", label: "Sports" },
      { id: "academic", label: "Academic" },
    ];
  },

  getPriorities() {
    return [
      { id: "low", label: "Low" },
      { id: "normal", label: "Normal" },
      { id: "high", label: "High" },
      { id: "urgent", label: "Urgent" },
    ];
  },
};
