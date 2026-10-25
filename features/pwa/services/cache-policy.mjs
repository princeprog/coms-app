/** Requests carrying application data must never enter the cache/fallback path. */
export function isDataRequest(request) {
  return (
    request.method !== "GET" ||
    [
      "authorization",
      "next-action",
      "rsc",
      "next-router-state-tree",
      "next-router-prefetch",
    ].some((name) => request.headers.has(name)) ||
    (request.headers.get("accept") || "").includes("text/x-component") ||
    new URL(request.url).searchParams.has("_rsc")
  );
}

export function cacheableRequest(request, origin, assets) {
  const url = new URL(request.url);
  return (
    !isDataRequest(request) &&
    url.origin === origin &&
    !url.search &&
    assets.has(url.href)
  );
}

export function offlinePosNavigation(url) {
  return (
    url.pathname === "/pos" ||
    url.pathname === "/offline-pos" ||
    (url.pathname === "/" && url.search === "?source=pwa")
  );
}

export function publicResponse(url, response) {
  if (
    response.status !== 200 ||
    response.redirected ||
    response.headers.has("set-cookie") ||
    /(?:private|no-store)/i.test(response.headers.get("cache-control") || "")
  )
    return false;
  const type = response.headers.get("content-type") || "";
  if (url.pathname === "/pwa/offline-pos.html")
    return type.includes("text/html");
  if (url.pathname.endsWith(".js"))
    return /(?:javascript|ecmascript)/i.test(type);
  if (url.pathname.endsWith(".css")) return type.includes("text/css");
  if (/\.(?:woff2?|ttf|otf)$/.test(url.pathname))
    return /(?:font|octet-stream)/i.test(type);
  if (/\.(?:png|svg|ico|webp)$/.test(url.pathname))
    return type.startsWith("image/");
  return false;
}
