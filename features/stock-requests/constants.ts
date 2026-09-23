export const stockRequestsEndpoint = "/stock-requests";
export const stockRequestsRoute = "/replenishment";

export const stockRequestStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
