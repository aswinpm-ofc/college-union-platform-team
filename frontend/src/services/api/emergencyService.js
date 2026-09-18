import { apiRequest } from "./http";
import { DEMO_MODE } from "../../lib/constants";

const DEMO_EMERGENCY_CONTACTS = [
  {
    id: "emg-001",
    name: "Campus Medical Center",
    type: "medical",
    phone: "+91 XXXX XXXXX",
    email: "medical@college.edu",
    location: "Building A, Ground Floor",
    available24h: true,
  },
  {
    id: "emg-002",
    name: "Campus Security",
    type: "security",
    phone: "+91 XXXX XXXXX",
    email: "security@college.edu",
    location: "Main Gate",
    available24h: true,
  },
  {
    id: "emg-003",
    name: "Counseling Center",
    type: "counseling",
    phone: "+91 XXXX XXXXX",
    email: "counseling@college.edu",
    location: "Student Affairs Building",
    available24h: false,
  },
  {
    id: "emg-004",
    name: "Admin Office",
    type: "administrative",
    phone: "+91 XXXX XXXXX",
    email: "admin@college.edu",
    location: "Main Administrative Block",
    available24h: false,
  },
];

export const emergencyService = {
  async getEmergencyContacts() {
    if (DEMO_MODE) {
      return { ok: true, data: DEMO_EMERGENCY_CONTACTS };
    }
    return apiRequest("/api/emergency/contacts", { method: "GET" });
  },

  async getContactsByType(type) {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: DEMO_EMERGENCY_CONTACTS.filter((c) => c.type === type),
      };
    }
    return apiRequest(`/api/emergency/contacts?type=${type}`, { method: "GET" });
  },

  async raiseEmergency(emergencyData) {
    if (DEMO_MODE) {
      return {
        ok: true,
        data: {
          id: `emg-${Date.now()}`,
          status: "received",
          ...emergencyData,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return apiRequest("/api/emergency/raise", {
      method: "POST",
      body: JSON.stringify(emergencyData),
    });
  },

  getEmergencyTypes() {
    return [
      { id: "medical", label: "Medical Emergency", icon: "alert" },
      { id: "security", label: "Security Issue", icon: "shield" },
      { id: "mental-health", label: "Mental Health", icon: "heart" },
      { id: "other", label: "Other", icon: "help" },
    ];
  },

  getQuickActions() {
    return [
      { id: "call-medical", label: "Call Medical Center", action: "tel" },
      { id: "call-security", label: "Call Security", action: "tel" },
      { id: "sos", label: "SOS Alert", action: "alert" },
    ];
  },
};
