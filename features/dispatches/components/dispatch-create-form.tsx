"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetFooter } from "@/components/ui/sheet";
import { createDispatchSchema } from "@/features/dispatches/schemas/dispatch.schema";
import type {
  DispatchCreateAction,
  DispatchCreateOptions,
  DispatchMutationResult,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchCreateLineFields, type DispatchCreateLine } from "./dispatch-create-line-fields";

export function DispatchCreateForm({
  options,
  action,
  onPendingChange,
  onDirtyChange,
  onCancel,
  onCreated,
}: {
  options: DispatchCreateOptions;
  action: DispatchCreateAction;
  onPendingChange: (pending: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState("");
  const [lines, setLines] = useState<DispatchCreateLine[]>([
    { key: 1, stock_item_id: "", quantity_dispatched: "" },
  ]);
  const nextLineKey = useRef(2);
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);

  function updateLine(
    key: number,
    field: "stock_item_id" | "quantity_dispatched",
    value: string,
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
    onDirtyChange(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = createDispatchSchema.safeParse({
      branch_id: branchId,
      items: lines.map(({ stock_item_id, quantity_dispatched }) => ({
        stock_item_id,
        quantity_dispatched: quantity_dispatched.trim(),
      })),
    });
    if (!parsed.success) {
      setError(
        "Choose a branch, add unique stock items, and enter a positive decimal quantity for each line.",
      );
      return;
    }

    const fingerprint = JSON.stringify(parsed.data);
    if (keyForRetry.current?.fingerprint !== fingerprint) {
      try {
        keyForRetry.current = {
          fingerprint,
          key: globalThis.crypto.randomUUID(),
        };
      } catch {
        setError("This browser cannot safely submit a dispatch.");
        return;
      }
    }

    setPending(true);
    onPendingChange(true);
    let result: DispatchMutationResult;
    try {
      result = await action(parsed.data, keyForRetry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not create this dispatch. Try again.",
      };
    }
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    keyForRetry.current = null;
    onCreated(result.dispatch_id);
  }

  return (
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Create dispatch"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <Field>
          <FieldLabel htmlFor="dispatch-branch">Branch</FieldLabel>
          <Select
            value={branchId}
            disabled={pending}
            onValueChange={(value) => {
              setBranchId(value ?? "");
              onDirtyChange(true);
            }}
          >
            <SelectTrigger id="dispatch-branch" className="w-full rounded-md">
              <SelectValue>
                {(value: unknown) =>
                  options.branches.find((branch) => branch.id === value)
                    ?.branch_name ?? "Select a branch"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              {options.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            Dispatches can only be sent to active branches available to your
            account.
          </FieldDescription>
        </Field>
        <DispatchCreateLineFields
          lines={lines}
          stockItems={options.stockItems}
          disabled={pending}
          onChange={updateLine}
          onRemove={(key) => {
            setLines((current) => current.filter((line) => line.key !== key));
            onDirtyChange(true);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || lines.length >= 100}
          onClick={() => {
            setLines((current) => [
              ...current,
              {
                key: nextLineKey.current++,
                stock_item_id: "",
                quantity_dispatched: "",
              },
            ]);
            onDirtyChange(true);
          }}
        >
          Add stock item
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Saving creates a dispatch draft and does not change inventory. Review
          the quantities, then use Post dispatch to deduct stock and send it to
          the selected branch.
        </p>
      </div>
      <SheetFooter className="flex-row justify-end border-t bg-background p-4 sm:p-6">
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating draft…" : "Create dispatch"}
        </Button>
      </SheetFooter>
    </form>
  );
}
