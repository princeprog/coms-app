"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduleKeys } from "../query-keys";
import {
  getMyScheduleAction,
  getScheduleWeekAction,
  listShiftTemplatesAction,
} from "../services/schedule-actions";

async function unwrap<T>(
  promise: Promise<{ ok: true; data: T } | { ok: false; error: string }>,
) {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/** One branch week; keeps the previous week visible while the next loads. */
export function useScheduleWeek(branchId: string, week: string) {
  return useQuery({
    queryKey: scheduleKeys.week(branchId, week || "current"),
    queryFn: () => unwrap(getScheduleWeekAction(branchId, week)),
    placeholderData: (previous) => previous,
    retry: false,
  });
}

export function useShiftTemplates(branchId: string) {
  return useQuery({
    queryKey: scheduleKeys.templates(branchId),
    queryFn: () => unwrap(listShiftTemplatesAction(branchId)),
    retry: false,
  });
}

export function useMySchedule(enabled = true) {
  return useQuery({
    queryKey: scheduleKeys.mine,
    queryFn: () => unwrap(getMyScheduleAction()),
    enabled,
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

/** Refreshes every schedule view after a change. */
export function useRefreshSchedules() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: scheduleKeys.all });
}
