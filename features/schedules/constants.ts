export const shiftTemplatesEndpoint = (branchId: string) =>
  `/branches/${branchId}/shift-templates`;
export const scheduleEndpoint = (branchId: string) =>
  `/branches/${branchId}/schedule`;
export const myScheduleEndpoint = "/schedules/mine";

export const schedulesRoute = "/schedules";
export const shiftTemplatesRoute = "/schedules/shifts";
export const myScheduleRoute = "/my-schedule";
