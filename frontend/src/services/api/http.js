import { API_BASE_URL, DEMO_MODE } from "../../lib/constants";

export async function apiRequest(endpoint = "", options = {}) {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");

  if (DEMO_MODE) {
    return {
      ok: true,
      status: 200,
      data: {
        message: "Demo mode active",
        endpoint,
        baseUrl,
      },
    };
  }

  if (!baseUrl) {
    const method = (options.method || "GET").toUpperCase();
    return { ok: true, status: 200, data: method === "GET" ? [] : {} };
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return { ok: true, status: response.status, data: await response.text() };
}
