// Server-side status counts only. Never log the request, response body, URL or credentials.
let outages = 0;
export function recordAuthOutage(status: number): void {
  if (status >= 500)
    console.warn({ event: "auth_outage", status, count: ++outages });
}
