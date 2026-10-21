"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Store } from "lucide-react";
import { DirectorySelect } from "@/components/shared/directory-select";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import type { SetStockLevelsAction } from "../services/stock-level-actions";
import type { InventoryItem } from "../types/inventory.types";
import { InventoryDiscardConfirmation } from "./inventory-discard-confirmation";

const LEVEL_PATTERN = /^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/;

export type StockLevelsLocation =
  | { scope: "COMMISSARY" }
  | {
      scope: "BRANCH";
      branchId: string;
      branchName: string;
      /** Active branches the user may set levels for, for "All branches". */
      activeBranchIds: string[];
    };

function levelErrors(reorder: string, target: string) {
  const errors: { reorder?: string; target?: string } = {};
  if (!LEVEL_PATTERN.test(reorder.trim()))
    errors.reorder = "Enter zero or more, up to 3 decimals.";
  if (!LEVEL_PATTERN.test(target.trim()))
    errors.target = "Enter an amount, up to 3 decimals.";
  else if (!errors.reorder && Number(target) <= Number(reorder))
    errors.target = "Must be more than the reorder level.";
  return errors;
}

export function StockLevelsDialog({
  item,
  location,
  action,
  open,
  onOpenChange,
  onComplete,
}: {
  item: InventoryItem;
  location: StockLevelsLocation;
  action: SetStockLevelsAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (message: string) => void;
}) {
  const router = useRouter();
  const [reorder, setReorder] = useState(item.reorder_level ?? "");
  const [target, setTarget] = useState(item.target_level ?? "");
  const [applyTo, setApplyTo] = useState<"one" | "all">("one");
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const hasLevels = item.reorder_level !== null;
  const dirty =
    reorder !== (item.reorder_level ?? "") ||
    target !== (item.target_level ?? "") ||
    applyTo !== "one";
  const errors = showErrors ? levelErrors(reorder, target) : {};
  const branchCount =
    location.scope === "BRANCH" ? location.activeBranchIds.length : 0;
  const prefix = "stock-levels-" + item.id;

  function close() {
    setDiscardOpen(false);
    setShowErrors(false);
    setError("");
    setReorder(item.reorder_level ?? "");
    setTarget(item.target_level ?? "");
    setApplyTo("one");
    onOpenChange(false);
  }

  function requestClose() {
    if (pending) return;
    if (dirty) setDiscardOpen(true);
    else close();
  }

  async function save(levels: { reorder: string; target: string } | null) {
    setError("");
    const branchIds =
      location.scope === "BRANCH"
        ? applyTo === "all"
          ? location.activeBranchIds
          : [location.branchId]
        : undefined;
    setPending(true);
    let result;
    try {
      result = await action({
        stock_item_id: item.id,
        scope: location.scope,
        ...(branchIds ? { branch_ids: branchIds } : {}),
        reorder_level: levels ? levels.reorder.trim() : null,
        target_level: levels ? levels.target.trim() : null,
      });
    } catch {
      result = {
        ok: false as const,
        error: "COMS could not save these levels.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const where =
      location.scope === "COMMISSARY"
        ? "the commissary"
        : applyTo === "all"
          ? branchCount + " branches"
          : location.branchName;
    onComplete(
      levels
        ? "Levels saved for " + item.stock_item_name + " at " + where + "."
        : "Levels cleared for " + item.stock_item_name + " at " + where + ".",
    );
    onOpenChange(false);
    router.refresh();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    const found = levelErrors(reorder, target);
    if (found.reorder || found.target) {
      document
        .getElementById(prefix + (found.reorder ? "-reorder" : "-target"))
        ?.focus();
      return;
    }
    void save({ reorder, target });
  }

  const usage = Number(item.avg_daily_use);
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}
      >
        <DialogContent data-coms-ui="operational" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set levels for {item.stock_item_name}</DialogTitle>
            <DialogDescription>
              {location.scope === "COMMISSARY"
                ? "Commissary"
                : location.branchName}{" "}
              · On hand {item.quantity_on_hand} {item.unit}
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            aria-label="Stock levels"
            className="flex flex-col gap-5"
            onSubmit={submit}
          >
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.reorder}>
                  <FieldLabel htmlFor={prefix + "-reorder"}>
                    Reorder at
                  </FieldLabel>
                  <InputGroup className="h-10">
                    <InputGroupInput
                      id={prefix + "-reorder"}
                      inputMode="decimal"
                      autoComplete="off"
                      className="h-full px-3 tabular-nums"
                      value={reorder}
                      disabled={pending}
                      aria-invalid={!!errors.reorder}
                      aria-describedby={prefix + "-reorder-help"}
                      onChange={(event) => setReorder(event.target.value)}
                    />
                    <InputGroupAddon align="inline-end" aria-hidden="true">
                      <InputGroupText>{item.unit}</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {errors.reorder ? (
                    <FieldError id={prefix + "-reorder-help"}>
                      {errors.reorder}
                    </FieldError>
                  ) : (
                    <FieldDescription id={prefix + "-reorder-help"}>
                      Marked low at or below this.
                    </FieldDescription>
                  )}
                </Field>
                <Field data-invalid={!!errors.target}>
                  <FieldLabel htmlFor={prefix + "-target"}>
                    Target level
                  </FieldLabel>
                  <InputGroup className="h-10">
                    <InputGroupInput
                      id={prefix + "-target"}
                      inputMode="decimal"
                      autoComplete="off"
                      className="h-full px-3 tabular-nums"
                      value={target}
                      disabled={pending}
                      aria-invalid={!!errors.target}
                      aria-describedby={prefix + "-target-help"}
                      onChange={(event) => setTarget(event.target.value)}
                    />
                    <InputGroupAddon align="inline-end" aria-hidden="true">
                      <InputGroupText>{item.unit}</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {errors.target ? (
                    <FieldError id={prefix + "-target-help"}>
                      {errors.target}
                    </FieldError>
                  ) : (
                    <FieldDescription id={prefix + "-target-help"}>
                      Restocks fill up to this.
                    </FieldDescription>
                  )}
                </Field>
              </div>
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {usage > 0
                  ? "Used about " +
                    item.avg_daily_use +
                    " " +
                    item.unit +
                    " a day over the last 14 days."
                  : "No usage recorded here in the last 14 days."}
              </p>
              {location.scope === "BRANCH" && branchCount > 1 && (
                <DirectorySelect
                  id={prefix + "-apply"}
                  label="Apply to"
                  value={applyTo}
                  alignItemWithTrigger={false}
                  className="sm:w-full [&_[data-slot=select-trigger]]:h-10"
                  options={[
                    {
                      value: "one",
                      label: location.branchName + " only",
                      icon: <Store className="text-primary!" />,
                    },
                    {
                      value: "all",
                      label: "All " + branchCount + " active branches",
                      icon: (
                        <Building2 className="text-violet-600! dark:text-violet-400!" />
                      ),
                    },
                  ]}
                  onChange={(value) =>
                    setApplyTo(value === "all" ? "all" : "one")
                  }
                />
              )}
            </FieldGroup>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter className="border-t pt-4 sm:justify-between">
              {hasLevels ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive sm:mr-auto"
                  disabled={pending}
                  onClick={() => void save(null)}
                >
                  Clear levels
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={requestClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save levels"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <InventoryDiscardConfirmation
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={close}
        title="Discard level changes?"
        description="The levels you entered will not be saved."
      />
    </>
  );
}
