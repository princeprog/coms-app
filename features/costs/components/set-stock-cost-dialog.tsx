"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { costKeys } from "../query-keys";
import { setStockCostSchema, type StockCostRow } from "../schemas/cost.schema";
import { setStockCostAction } from "../services/cost-actions";

export function SetStockCostDialog({
  item,
  onOpenChange,
}: {
  item: StockCostRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [unitCost, setUnitCost] = useState(item?.average_unit_cost ?? "");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = setStockCostSchema.safeParse({
        unit_cost: unitCost,
        reason,
      });
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              String(issue.path[0]),
              issue.message,
            ]),
          ),
        );
        throw new Error("Check the highlighted fields.");
      }
      const result = await setStockCostAction(item!.stock_item_id, parsed.data);
      if (!result.ok) throw new Error(result.error);
    },
    onMutate: () => setErrors({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: costKeys.all });
      toast.add({
        type: "success",
        title: `Cost updated for ${item!.stock_item_name}.`,
      });
      onOpenChange(false);
    },
  });
  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => !mutation.isPending && onOpenChange(open)}
    >
      <DialogContent data-coms-ui="operational" className="sm:max-w-md">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!mutation.isPending) mutation.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Set cost</DialogTitle>
            <DialogDescription>
              {item?.stock_item_name}. Future sales use this cost; recorded
              sales keep theirs.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(errors.unit_cost)}>
              <FieldLabel htmlFor="stock-cost-value">
                Cost per {item?.unit}
              </FieldLabel>
              <InputGroup className="h-11">
                <InputGroupAddon>₱</InputGroupAddon>
                <InputGroupInput
                  id="stock-cost-value"
                  inputMode="decimal"
                  autoComplete="off"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  aria-invalid={Boolean(errors.unit_cost)}
                  aria-describedby={
                    errors.unit_cost ? "stock-cost-value-error" : undefined
                  }
                />
              </InputGroup>
              {errors.unit_cost && (
                <FieldError id="stock-cost-value-error" role={undefined}>
                  {errors.unit_cost}
                </FieldError>
              )}
            </Field>
            <Field data-invalid={Boolean(errors.reason)}>
              <FieldLabel htmlFor="stock-cost-reason">Reason</FieldLabel>
              <Textarea
                id="stock-cost-reason"
                placeholder="e.g. Supplier price list, October"
                value={reason}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={
                  errors.reason ? "stock-cost-reason-error" : undefined
                }
              />
              {errors.reason && (
                <FieldError id="stock-cost-reason-error" role={undefined}>
                  {errors.reason}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
          {mutation.error && !Object.keys(errors).length && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              )}
              Save cost
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
