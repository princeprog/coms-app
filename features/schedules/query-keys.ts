export const scheduleKeys = {
  all: ["schedules"] as const,
  week: (branchId: string, week: string) =>
    ["schedules", "week", branchId, week] as const,
  templates: (branchId: string) =>
    ["schedules", "templates", branchId] as const,
  mine: ["schedules", "mine"] as const,
};
