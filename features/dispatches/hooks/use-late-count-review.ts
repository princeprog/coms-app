"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { reviewLateCountAction } from "../services/dispatch-actions";
export function useLateCountReview(dispatchId: string, caseId: string) {
  const router = useRouter();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      action: "POST" | "RETURN";
      reason?: string;
    }) => {
      const result = await reviewLateCountAction(dispatchId, caseId, input);
      if (!result.ok) throw new Error(result.error);
      return input.action;
    },
    onSuccess: async (action) => {
      toast.add({
        title:
          action === "POST"
            ? "Delivery count posted"
            : "Count returned for correction",
      });
      await client.invalidateQueries({ queryKey: ["pending-receiving"] });
      router.refresh();
    },
  });
}
