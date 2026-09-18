import { DEMO_MODE } from "../../lib/constants";
import { supabase, isSupabaseEnabled } from "../../lib/supabaseClient";

const STORAGE_KEY = "unionhub-user";
const useRealAuth = isSupabaseEnabled;

const normalizeUser = (user = null) => {
  if (!user) return null;

  const email = String(user.email || "demo@college.local");
  const role = user.role || "student";
  const name = user.name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
  const initials = (user.initials || name).split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "U";

  return {
    id: user.id || "demo-user",
    email,
    role,
    dbRole: user.dbRole || role,
    name,
    initials,
  };
};

// The database's app_role enum (student, academic_maintainer,
// academic_coordinator, grievance_officer, content_editor, super_admin)
// is more granular than the roles the UI was built around. RLS is the
// real security boundary and already uses the full enum (see
// backend/supabase/migrations/002+); this is purely a display/UX
// convenience so existing components that check role === "admin" /
// "maintainer" keep working unchanged for real accounts too.
function toUiRole(dbRole) {
  if (dbRole === "academic_maintainer" || dbRole === "academic_coordinator") return "maintainer";
  if (dbRole === "grievance_officer" || dbRole === "content_editor" || dbRole === "super_admin") return "admin";
  return "student";
}

function fromAuthUserAndProfile(authUser, profile) {
  const dbRole = profile?.role || "student";
  return normalizeUser({
    id: authUser.id,
    email: authUser.email,
    role: toUiRole(dbRole),
    dbRole,
    name: profile?.full_name || authUser.email?.split("@")[0] || "Student",
  });
}

async function fetchProfile(userId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Could not load profile:", err.message);
    return null;
  }
}

export const authService = {
  getCurrentUserSync() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return null;
      }

      return normalizeUser(JSON.parse(saved));
    } catch {
      return null;
    }
  },

  /**
   * Create a real Supabase Auth account (or, in demo mode, a local fake
   * one). Returns { ok, user, needsEmailConfirmation, error }.
   * needsEmailConfirmation is true when Supabase's project settings
   * require confirming the email before a session is issued — there's no
   * user to log in yet in that case, just a pending signup.
   */
  async signUp({ email, password, fullName, studentId = "", departmentId = "", semester = "", role = "student" } = {}) {
    const trimmedEmail = String(email || "").trim();
    const trimmedName = String(fullName || "").trim();

    if (!trimmedEmail) return { ok: false, error: "Email is required." };
    if (!trimmedName) return { ok: false, error: "Full name is required." };
    if (!password || password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    // Public signup can only create student accounts. Privileged roles are assigned server-side.
    const selectedRole = "student";
    if (!useRealAuth) {
      const user = normalizeUser({
        id: `demo-${Date.now()}`,
        email: trimmedEmail,
        name: trimmedName,
        role: toUiRole(selectedRole),
        dbRole: selectedRole,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return { ok: true, user, needsEmailConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          student_id: studentId.trim(),
          department_id: departmentId || "",
          semester: semester || "",
          role: selectedRole,
        },
      },
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Sign-up did not return a user. Please try again." };

    if (!data.session) {
      // Project requires email confirmation — no session yet.
      return { ok: true, user: null, needsEmailConfirmation: true };
    }

    // The database trigger creates the profile even when email confirmation is enabled.
    // When a session is available, also verify it immediately and surface a real error
    // instead of silently continuing with a missing profile.
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      return { ok: false, error: "Account was created, but your profile could not be saved. Apply the latest Supabase migration and try again." };
    }
    const user = fromAuthUserAndProfile(data.user, profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { ok: true, user, needsEmailConfirmation: false };
  },

  async login(email = "demo@college.local", password = "") {
    const normalizedEmail = String(email || "demo@college.local").trim() || "demo@college.local";

    if (!useRealAuth) {
      if (/admin|maintainer|coordinator|officer|editor/i.test(normalizedEmail)) {
        throw new Error("Staff accounts must sign in through the management portal.");
      }
      const role = normalizedEmail.toLowerCase().includes("admin") ? "admin" : normalizedEmail.toLowerCase().includes("maintainer") ? "maintainer" : "student";
      const user = normalizeUser({
        id: `demo-${Date.now()}`,
        email: normalizedEmail,
        role,
        name: role === "admin" ? "Super Admin" : role === "maintainer" ? "Academic Maintainer" : "Aswin P.",
        initials: role === "admin" ? "SA" : role === "maintainer" ? "AM" : "AP",
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return { user, token: "demo-token" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw new Error(error.message);

    const profile = await fetchProfile(data.user.id);
    const user = fromAuthUserAndProfile(data.user, profile);
    if (user.dbRole !== "student") {
      await supabase.auth.signOut();
      throw new Error("Staff accounts must sign in through the management portal.");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { user, token: data.session?.access_token };
  },

  async requestPasswordReset(email = "") {
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) return { ok: false, error: "Email is required." };
    if (!useRealAuth) return { ok: true };

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async logout() {
    localStorage.removeItem(STORAGE_KEY);
    if (useRealAuth) {
      await supabase.auth.signOut();
    }
    return true;
  },

  async getCurrentUser() {
    if (useRealAuth) {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      const profile = await fetchProfile(data.user.id);
      const user = fromAuthUserAndProfile(data.user, profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return this.getCurrentUserSync();
  },

  onAuthStateChange(listener) {
    if (useRealAuth) {
      listener(this.getCurrentUserSync());

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          localStorage.removeItem(STORAGE_KEY);
          listener(null);
          return;
        }
        const profile = await fetchProfile(session.user.id);
        const user = fromAuthUserAndProfile(session.user, profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        listener(user);
      });

      return () => sub.subscription.unsubscribe();
    }

    const callback = () => listener(this.getCurrentUserSync());
    callback();
    return () => {};
  },
};
