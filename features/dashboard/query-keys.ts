export const dashboardKeys = {
  all: ["dashboard"] as const,
  today: (branchId?: string) =>
    ["dashboard", "today", branchId ?? "all"] as const,
};
