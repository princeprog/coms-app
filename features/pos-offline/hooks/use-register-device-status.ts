"use client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  OfflineRequestError,
  offlineBranchPath,
  offlineRequest,
} from "./offline-api";

const ownDeviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REVOKED"]),
});
export type OwnRegisterDevice = z.infer<typeof ownDeviceSchema>;

/** This browser's approval for the branch; null when it has not been registered. */
export function useRegisterDeviceStatus(
  branchId: string,
  deviceId: () => Promise<string | undefined>,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["pos-offline", branchId, "own-device"],
    enabled,
    retry: false,
    refetchOnWindowFocus: true,
    // Pick up a manager's decision without a manual reload.
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 15_000 : false,
    queryFn: async (): Promise<OwnRegisterDevice | null> => {
      const id = await deviceId();
      if (!id) return null;
      try {
        return ownDeviceSchema.parse(
          await offlineRequest(`${offlineBranchPath(branchId)}/devices/${id}`),
        );
      } catch (error) {
        if (error instanceof OfflineRequestError && error.status === 404)
          return null;
        throw error;
      }
    },
  });
}
