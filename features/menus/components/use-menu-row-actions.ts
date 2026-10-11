"use client";
import { useMenuMutation } from "../hooks/use-menu-mutation";
import type {
  BranchProduct,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ServiceType } from "../schemas/menu.schema";
import { updateMenuServicesAction } from "../services/menu-actions";
export function useMenuRowActions({
  offer,
  availabilityAction,
}: {
  offer: BranchProduct;
  availabilityAction: BranchProductOperationAction;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"availability" | "services" | null>(null);
  const [services, setServices] = useState<ServiceType[]>(
    offer.service_types ?? ["DINE_IN", "TAKEAWAY"],
  );
  const [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const mutation = useMenuMutation(async () =>
    mode === "availability"
      ? availabilityAction(offer.branch_id, offer.product_id, {
          is_available: !offer.is_available,
        })
      : updateMenuServicesAction(offer.branch_id, offer.product_id, {
          service_types: services,
        }),
  );
  function save() {
    if (pending) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await mutation.mutateAsync();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMode(null);
        setStatus("Menu updated.");
        router.refresh();
      } catch {
        setError("The change could not be saved. Your draft is preserved.");
      }
    });
  }
  return {
    mode,
    setMode,
    services,
    setServices,
    error,
    setError,
    status,
    pending,
    save,
  };
}
