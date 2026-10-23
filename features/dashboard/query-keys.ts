export const dashboardKeys = {
  all: ["dashboard"] as const,
  today: (branchId?: string) =>
    ["dashboard", "today", branchId ?? "all"] as const,
  exceptions: (branchId?: string) =>
    ["dashboard", "exceptions", branchId ?? "all"] as const,
};
