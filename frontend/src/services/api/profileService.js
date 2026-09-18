import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/constants";
import { getAuthHeaders } from "../../lib/supabaseClient";

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !DEMO_MODE);
}

// UI labels shown on the Profile page <-> notification_preferences columns
// (plain snake_case booleans — see migration 004).
const NOTIFICATION_KEY_MAP = {
  Announcements: "announcements",
  Events: "events",
  "Grievance updates": "grievances",
  "Welfare opportunities": "welfare",
  "Academic materials": "academics",
  Magazine: "magazine",
};

const LOCAL_KEY = "unionhub-profile-details";

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocal(details) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(details));
  } catch {
    // Storage full or unavailable — nothing more we can do client-side.
  }
}

export const profileService = {
  notificationKeyMap: NOTIFICATION_KEY_MAP,

  /**
   * full_name, student_id, department_id, semester and phone live on
   * profiles; email comes from auth and is read-only here (see
   * updateMyProfile below).
   */
  async getMyProfile(userId) {
    if (isSupabaseConfigured() && userId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Supabase GET profiles error: ${res.statusText}`);
        const rows = await res.json();
        if (rows?.[0]) return { ok: true, data: rows[0] };
      } catch (err) {
        console.warn("Supabase getMyProfile failed, using local fallback:", err.message);
      }
    }
    return { ok: true, data: readLocal() };
  },

  /**
   * Only sends columns the DB actually grants an authenticated user
   * update on: full_name, student_id, department_id, semester, phone
   * (migrations 004 and 007). Email is deliberately excluded — it isn't
   * in that grant, so a raw PATCH would just 403. Changing email needs
   * supabase.auth.updateUser({ email }), which re-confirms it; that's a
   * separate flow from this form.
   */
  async updateMyProfile(userId, patch) {
      const { full_name, student_id, department_id, semester, phone, willing_to_donate, blood_group, last_donation_date } = patch;
      const payload = { full_name, student_id, department_id, semester, phone, willing_to_donate, blood_group, last_donation_date };

    if (isSupabaseConfigured() && userId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: "PATCH",
          headers: {
            ...(await getAuthHeaders()),
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Supabase PATCH profiles error: ${res.statusText}`);
        const rows = await res.json();
        return { ok: true, data: rows?.[0] || payload };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    const merged = { ...readLocal(), ...payload };
    writeLocal(merged);
    return { ok: true, data: merged };
  },

  async getMyNotificationPreferences(userId) {
    if (isSupabaseConfigured() && userId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/notification_preferences?user_id=eq.${userId}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) throw new Error(`Supabase GET notification_preferences error: ${res.statusText}`);
        const rows = await res.json();
        if (rows?.[0]) return { ok: true, data: rows[0] };
      } catch (err) {
        console.warn("Supabase getMyNotificationPreferences failed, using local fallback:", err.message);
      }
    }
    return { ok: true, data: readLocal().notifications || null };
  },

  /**
   * Upserts on user_id (the table's primary key) because handle_new_user()
   * only creates a profiles row at signup — a first-time save here has no
   * notification_preferences row to PATCH yet.
   */
  async updateMyNotificationPreferences(userId, uiPrefs) {
    const dbPrefs = { user_id: userId };
    for (const [uiKey, dbKey] of Object.entries(NOTIFICATION_KEY_MAP)) {
      if (uiKey in uiPrefs) dbPrefs[dbKey] = Boolean(uiPrefs[uiKey]);
    }

    if (isSupabaseConfigured() && userId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/notification_preferences?on_conflict=user_id`, {
          method: "POST",
          headers: {
            ...(await getAuthHeaders()),
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify(dbPrefs),
        });
        if (!res.ok) throw new Error(`Supabase upsert notification_preferences error: ${res.statusText}`);
        return { ok: true, data: uiPrefs };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    const local = readLocal();
    writeLocal({ ...local, notifications: uiPrefs });
    return { ok: true, data: uiPrefs };
  },
};
