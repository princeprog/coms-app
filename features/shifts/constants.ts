export const shiftsEndpoint = (branchId: string) =>
  `/branches/${branchId}/shifts`;
export const shiftsRoute = "/shifts";
export const shiftHref = (branchId: string, shiftId: string) =>
  `/shifts/${shiftId}?branch=${branchId}`;
