import "server-only";
import { adminConfigured, isAdmin } from "./auth";
import { jsonError } from "./http";

// Call at the top of every /api/admin route. Returns an error response to send
// back, or null when the caller is a signed-in admin.
export async function adminOnly() {
  if (!adminConfigured()) {
    return jsonError(503, "admin_not_configured", "Set ADMIN_PASSWORD in .env.local and restart the server.");
  }
  if (!(await isAdmin())) return jsonError(401, "unauthorized", "Please sign in to the admin dashboard.");
  return null;
}

export function datasetIsDemo(value: unknown): boolean | null {
  return value === "demo" ? true : value === "real" ? false : null;
}
