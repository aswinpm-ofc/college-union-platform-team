import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";

const STORAGE_KEY = "unionhub-notifications";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-001",
    type: "event",
    title: "Tech Symposium Registration Open",
    message: "Registration is now open for the Annual Tech Symposium on Sep 15",
    timestamp: "Today · 2:30 PM",
    read: false,
    actionUrl: "/events",
    icon: "calendar",
  },
  {
    id: "notif-002",
    type: "welfare",
    title: "Merit Scholarship Application Deadline",
    message: "Reminder: Merit Scholarship applications close on Sep 30, 2026",
    timestamp: "Today · 10:15 AM",
    read: false,
    actionUrl: "/welfare",
    icon: "award",
  },
  {
    id: "notif-003",
    type: "academics",
    title: "New Study Materials Available",
    message: "Operating Systems notes have been uploaded to the academics section",
    timestamp: "Yesterday · 4:45 PM",
    read: true,
    actionUrl: "/academics",
    icon: "book",
  },
];

function getStoredNotifications() {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

function saveStoredNotifications(notifs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent("notifications-changed"));
  } catch (e) {
    console.error("Failed to save notifications in localStorage", e);
  }
}

export const notificationsService = {
  async getNotifications(filters = {}) {
    if (DEMO_MODE) {
      const all = getStoredNotifications();
      const unread = filters.unreadOnly ? all.filter((n) => !n.read) : all;
      return { ok: true, data: unread };
    }
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/notifications?${params}`, { method: "GET" });
  },

  async createNotification(data) {
    if (DEMO_MODE) {
      const all = getStoredNotifications();
      const newNotif = {
        id: `notif-${Date.now().toString().slice(-4)}`,
        type: data.type || "announcement",
        title: data.title,
        message: data.message || "",
        timestamp: "Just now",
        read: false,
        actionUrl: data.actionUrl || "/",
        icon: data.icon || "megaphone",
      };
      const updated = [newNotif, ...all];
      saveStoredNotifications(updated);
      return { ok: true, data: newNotif };
    }

    return apiRequest("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async markAsRead(notificationId) {
    if (DEMO_MODE) {
      const all = getStoredNotifications();
      const updated = all.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      saveStoredNotifications(updated);
      return {
        ok: true,
        data: { id: notificationId, read: true },
      };
    }
    return apiRequest(`/api/notifications/${notificationId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async markAllAsRead() {
    if (DEMO_MODE) {
      const all = getStoredNotifications();
      const updated = all.map((n) => ({ ...n, read: true }));
      saveStoredNotifications(updated);
      return {
        ok: true,
        data: { markedCount: all.filter((n) => !n.read).length },
      };
    }
    return apiRequest("/api/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async getNotificationPreferences() {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          emailNotifications: true,
          pushNotifications: true,
          eventNotifications: true,
          welfareNotifications: true,
          academicNotifications: true,
          announcementNotifications: true,
        },
      };
    }
    return apiRequest("/api/notification-preferences", { method: "GET" });
  },

  async updateNotificationPreferences(preferences) {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: preferences,
      };
    }
    return apiRequest("/api/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });
  },

  async registerDevice(deviceData) {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          deviceId: `device-${Date.now()}`,
          registered: true,
        },
      };
    }
    return apiRequest("/api/devices/register", {
      method: "POST",
      body: JSON.stringify(deviceData),
    });
  },

  getUnreadCount() {
    if (DEMO_MODE) {
      const all = getStoredNotifications();
      return all.filter((n) => !n.read).length;
    }
    return 0;
  },

  onNotificationsChange(listener) {
    if (typeof window === "undefined") return () => {};
    const handler = () => listener(this.getUnreadCount());
    window.addEventListener("notifications-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("notifications-changed", handler);
      window.removeEventListener("storage", handler);
    };
  },

  getNotificationTypes() {
    return [
      { id: "event", label: "Events", icon: "calendar" },
      { id: "welfare", label: "Welfare", icon: "award" },
      { id: "academics", label: "Academics", icon: "book" },
      { id: "grievance", label: "Grievance Updates", icon: "alert" },
      { id: "announcement", label: "Announcements", icon: "megaphone" },
    ];
  },
};
