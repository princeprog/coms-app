export const shiftKeys = {
  all: ["shifts"] as const,
  current: (branchId: string) => ["shifts", "current", branchId] as const,
  list: (branchId: string, query: object) =>
    ["shifts", "list", branchId, query] as const,
  detail: (branchId: string, shiftId: string) =>
    ["shifts", "detail", branchId, shiftId] as const,
};
