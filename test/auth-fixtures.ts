export const authTestUser = {
  id: "f1a414ac-cc31-4aac-9122-ecece5166a84",
  email: "staff@example.com",
  full_name: "Staff Member",
  contact_number: "09170000000",
};

export const authTestAccess = {
  role: {
    id: "1",
    code: "BRANCH_MANAGER",
    name: "Branch Manager",
    isSystem: false,
    isActive: true,
  },
  permissions: ["inventory.read", "branches.read"],
  branch_ids: ["a55ddc60-b891-4860-a96d-20276f4b6864"],
};

export const authTestMeResponse = {
  user: authTestUser,
  ...authTestAccess,
};

export const authTestSessionUser = {
  ...authTestUser,
  ...authTestAccess,
};
