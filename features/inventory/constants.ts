export const inventoryEndpoints = {
  commissary: "/inventory/commissary",
  commissaryMovements: "/inventory/commissary/movements",
  branch: (branchId: string) => `/inventory/branches/${branchId}`,
  branchMovements: (branchId: string) =>
    `/inventory/branches/${branchId}/movements`,
  commissaryAdjustments: "/inventory/commissary/adjustments",
  branchAdjustments: (branchId: string) =>
    `/inventory/branches/${branchId}/adjustments`,
} as const;
