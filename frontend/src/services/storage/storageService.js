import { DEMO_MODE, SUPABASE_URL } from "../../lib/constants";

export const storageService = {
  async upload(file) {
    if (DEMO_MODE || !SUPABASE_URL) {
      return {
        id: "demo-upload",
        name: file?.name || "demo-file",
        url: "https://placehold.co/600x400?text=Demo+Upload",
      };
    }

    return { id: "supabase-upload", name: file?.name || "file", url: "" };
  },

  async getDownloadUrl(fileName = "demo-file") {
    if (DEMO_MODE || !SUPABASE_URL) {
      return `https://placehold.co/600x400?text=${encodeURIComponent(fileName)}`;
    }

    return "";
  },
};
