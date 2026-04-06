export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "";
}
