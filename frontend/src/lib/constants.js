const env = import.meta.env;

export const APP_NAME = env.VITE_APP_NAME || "UnionHub";
export const DEMO_MODE = env.VITE_DEMO_MODE !== "false";
export const API_BASE_URL = env.VITE_API_BASE_URL || "";
export const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";
