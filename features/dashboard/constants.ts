export const dashboardTodayEndpoint = "/dashboard/today";
export const dashboardExceptionsEndpoint = "/dashboard/exceptions";
/** The Dashboard refreshes itself while the tab is visible. */
export const dashboardRefreshMs = 60_000;
/** Four weeks of completed days change slowly; refresh less often. */
export const dashboardExceptionsRefreshMs = 300_000;
