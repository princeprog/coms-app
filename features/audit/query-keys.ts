export const auditKeys = {
  all: ["audit-events"] as const,
  list: (input: object) => ["audit-events", "list", input] as const,
};
