/* Single source of truth for every backend path the frontend calls.
   tests/test_api_parity.py fails if a path here has no backend route (or the
   reverse). Cron endpoints (/api/cron/*) are platform-called and excluded. */
const BASE = process.env.REACT_APP_BACKEND_URL;

export const apiPath = {
  health: "/api/",
  workshops: "/api/workshops",
  registrations: (id) => `/api/workshops/${id}/registrations`,
  leads: "/api/leads",
  applications: "/api/applications",
  scenarios: "/api/scenarios",
  concierge: "/api/concierge",
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  adminLeads: "/api/admin/leads",
  adminRegistrations: "/api/admin/registrations",
  adminApplications: "/api/admin/applications",
  adminScenarios: "/api/admin/scenarios",
  adminScenariosPurge: "/api/admin/scenarios/purge",
  adminDeliveries: "/api/admin/deliveries",
  adminDeliveryResend: (id) => `/api/admin/deliveries/${id}/resend`,
  adminConciergeStats: "/api/admin/concierge/stats",
  adminSettings: "/api/admin/settings",
  adminExport: "/api/admin/export.csv",
};

export function apiUrl(path) {
  return `${BASE}${path}`;
}

export function resolvePath(path, ...args) {
  return typeof path === "function" ? path(...args) : path;
}

export async function apiFetch(path, options = {}, ...args) {
  return fetch(apiUrl(resolvePath(path, ...args)), options);
}

/* Consistent error bodies: {"error": {"code", "message"}}. */
export async function apiErrorCode(res) {
  try {
    const body = await res.json();
    return body?.error?.code || `http_${res.status}`;
  } catch (e) {
    return `http_${res.status}`;
  }
}
