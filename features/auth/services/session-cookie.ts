const ACCESS_COOKIE_NAMES = new Set(["coms_access", "__Host-coms_access"]);
const REFRESH_COOKIE_NAMES = new Set(["coms_refresh", "__Host-coms_refresh"]);

function selectCookies(cookieHeader: string | null, names: Set<string>) {
  if (!cookieHeader) return undefined;
  const selected = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => names.has(part.split("=", 1)[0] ?? ""));
  return selected.length > 0 ? selected.join("; ") : undefined;
}

export function getAccessCookieHeader(cookieHeader: string | null) {
  return selectCookies(cookieHeader, ACCESS_COOKIE_NAMES);
}

export function hasRefreshCookie(cookieHeader: string | null) {
  return Boolean(selectCookies(cookieHeader, REFRESH_COOKIE_NAMES));
}
