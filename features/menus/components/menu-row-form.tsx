"use client";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { BranchProduct } from "@/features/branch-products/types/branch-product.types";
import { ServiceTypeField } from "./service-type-field";
import { useMenuRowActions } from "./use-menu-row-actions";
export function MenuRowForm({
  offer,
  state,
}: {
  offer: BranchProduct;
  state: ReturnType<typeof useMenuRowActions>;
}) {
  const { mode, setMode, services, setServices, error, pending, save } = state;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {mode === "availability" && (
        <p className="text-sm">
          {offer.is_available
            ? "This product will stop appearing as available for sale. Existing sales are preserved."
            : "This product will be available for sale for its supported services."}
        </p>
      )}
      {mode === "services" && (
        <ServiceTypeField
          value={services}
          onChange={setServices}
          allowed={offer.eligible_service_types ?? offer.service_types}
          disabled={pending}
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setMode(null)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || (mode === "services" && !services.length)}
        >
          {pending ? "Saving…" : "Confirm change"}
        </Button>
      </DialogFooter>
    </form>
  );
}
