"use client";

import { useMutation } from "@tanstack/react-query";
import { setStaffDefaultPasswordAction } from "../services/staff-actions";

export function useDefaultPassword(onSuccess: () => void) {
  return useMutation({
    mutationFn: async (password: string) => {
      const result = await setStaffDefaultPasswordAction({ password });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess,
    gcTime: 0,
    retry: false,
  });
}
