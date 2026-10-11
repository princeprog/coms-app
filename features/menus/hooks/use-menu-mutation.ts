"use client";
import { useMutation } from "@tanstack/react-query";
export function useMenuMutation<T, R>(operation: (input: T) => Promise<R>) {
  return useMutation({ mutationFn: operation, retry: false });
}
