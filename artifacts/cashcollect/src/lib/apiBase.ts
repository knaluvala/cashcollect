export function getApiBase(): string {
  if (typeof window === "undefined") return "/api";

  const { protocol, hostname, port } = window.location;
  const isReplitDevelopmentDomain =
    hostname.endsWith(".replit.dev") ||
    hostname.endsWith(".replit.local") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  if (isReplitDevelopmentDomain && port !== "5173") {
    return `${protocol}//${hostname}:5173/api`;
  }

  return "/api";
}

export const API_BASE = getApiBase();
