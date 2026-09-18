import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants";

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// One shared client so every part of the app sees the same session and
// benefits from supabase-js's built-in token refresh, instead of each
// service hand-rolling its own auth state (which is how academicsService
// ended up always sending the anon key, signed in or not).
export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Headers for hand-rolled fetch() calls to Supabase's REST/Storage APIs.
 * Sends the signed-in user's session token when there is one, so
 * auth.uid()-based RLS policies see the real user; falls back to the
 * anon key when signed out (which is exactly what lets the `to public`
 * read policies — map_locations, emergency_contacts — keep working for
 * anonymous visitors).
 */
export async function getAuthHeaders() {
  let token = SUPABASE_ANON_KEY;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || SUPABASE_ANON_KEY;
    } catch {
      token = SUPABASE_ANON_KEY;
    }
  }
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}
