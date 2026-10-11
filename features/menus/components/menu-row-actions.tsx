"use client";
import { MenuRowForm } from "./menu-row-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  BranchProduct,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";
import {
  CircleCheck,
  CirclePause,
  MoreHorizontal,
  SquarePen,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMenuRowActions } from "./use-menu-row-actions";

export function MenuRowActions({
  offer,
  canEditProduct,
  canAvailability,
  canServices,
  availabilityAction,
}: {
  offer: BranchProduct;
  canEditProduct: boolean;
  canAvailability: boolean;
  canServices: boolean;
  availabilityAction: BranchProductOperationAction;
}) {
  const state = useMenuRowActions({ offer, availabilityAction });
  const { mode, setMode, setServices, setError, status, pending } = state;
  if (!canEditProduct && !canAvailability && !canServices) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon"
              variant="outline"
              aria-label={`Actions for ${offer.product_name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuGroup>
            {canAvailability && (
              <DropdownMenuItem
                onClick={() => {
                  setMode("availability");
                  setError("");
                }}
              >
                {offer.is_available ? (
                  <CirclePause
                    aria-hidden="true"
                    className="size-4 stroke-amber-600 dark:stroke-amber-400"
                  />
                ) : (
                  <CircleCheck
                    aria-hidden="true"
                    className="size-4 stroke-emerald-600 dark:stroke-emerald-400"
                  />
                )}
                {offer.is_available ? "Mark unavailable" : "Make available"}
              </DropdownMenuItem>
            )}
            {canServices && (
              <DropdownMenuItem
                onClick={() => {
                  setServices(offer.service_types ?? ["DINE_IN", "TAKEAWAY"]);
                  setMode("services");
                  setError("");
                }}
              >
                <Utensils
                  aria-hidden="true"
                  className="size-4 stroke-violet-600 dark:stroke-violet-400"
                />
                Change service types
              </DropdownMenuItem>
            )}
            {canEditProduct && (
              <DropdownMenuItem
                render={<Link href={`/products/${offer.product_id}/setup`} />}
              >
                <SquarePen
                  aria-hidden="true"
                  className="size-4 stroke-blue-600 dark:stroke-blue-400"
                />
                Edit product
              </DropdownMenuItem>
            )}{" "}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setMode(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "services"
                ? "Change service types"
                : "Change availability"}
            </DialogTitle>
            <DialogDescription>
              {offer.product_name} · Selling price ₱{offer.price}
            </DialogDescription>
          </DialogHeader>
          <MenuRowForm offer={offer} state={state} />
        </DialogContent>
      </Dialog>
      {status && (
        <span role="status" className="sr-only">
          {status}
        </span>
      )}
    </>
  );
}
