const DEFAULT_ADMIN_EMAILS = "raia40094@gmail.com";

function normalizeEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAllowedAdminEmails(): string[] {
  const fromEnv = import.meta.env.VITE_ADMIN_EMAILS;
  const configured = typeof fromEnv === "string" && fromEnv.trim().length > 0 ? fromEnv : DEFAULT_ADMIN_EMAILS;
  return normalizeEmails(configured);
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAllowedAdminEmails().includes(normalized);
}

export function getFrontendDashboardUrl(): string {
  const fromEnv = import.meta.env.VITE_FRONTEND_URL;
  if (fromEnv) {
    return `${String(fromEnv).replace(/\/$/, "")}/dashboard`;
  }
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:5173/dashboard`;
  }
  return "/dashboard";
}
