export const staffEndpoints = {
  collection: "/staff",
  member: (id: string) => `/staff/${id}`,
  role: (id: string) => `/staff/${id}/role`,
  branches: (id: string) => `/staff/${id}/branches`,
  deactivate: (id: string) => `/staff/${id}/deactivate`,
};
