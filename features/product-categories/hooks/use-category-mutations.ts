"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  saveProductCategoryAction,
  setProductCategoryActiveAction,
} from "../services/product-category-actions";
import { categoryQueryKeys } from "../query-keys";

export function useCategorySave(onComplete: () => void) {
  const router = useRouter();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id?: string; name: string }) => {
      const result = await saveProductCategoryAction(id, { name });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: categoryQueryKeys.all });
      onComplete();
      router.refresh();
    },
  });
}

export function useCategoryStatus(onComplete: () => void) {
  const router = useRouter();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const result = await setProductCategoryActiveAction(id, active);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: categoryQueryKeys.all });
      onComplete();
      router.refresh();
    },
  });
}
