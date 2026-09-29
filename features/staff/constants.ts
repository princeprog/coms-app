export const staffEndpoints = {
  collection: "/staff",
  member: (id: string) => `/staff/${id}`,
  role: (id: string) => `/staff/${id}/role`,
  branches: (id: string) => `/staff/${id}/branches`,
  deactivate: (id: string) => `/staff/${id}/deactivate`,
};

export const UNASSIGNED_ROLE_VALUE = "__unassigned__";
export const MAX_STAFF_BRANCH_ASSIGNMENTS = 100;
