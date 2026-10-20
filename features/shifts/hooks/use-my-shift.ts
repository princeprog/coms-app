"use client";

import { useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { shiftKeys } from "../query-keys";
import { getMyShiftAction } from "../services/shift-actions";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** The signed-in cashier's open shift, shared by the header, POS and shift pages. */
export function useMyShift(enabled = true) {
  const client = useQueryClient();
  // The persistent header can fill the shared cache before a streamed page hydrates,
  // so report loading until hydration to keep server and first client render equal.
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const query = useQuery({
    queryKey: shiftKeys.mine,
    queryFn: async () => {
      const result = await getMyShiftAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled,
    retry: false,
    refetchInterval: 60_000,
  });
  return {
    ...query,
    isPending: !hydrated || query.isPending,
    isError: hydrated && query.isError,
    data: hydrated ? query.data : undefined,
    refresh: () => client.invalidateQueries({ queryKey: shiftKeys.all }),
  };
}
