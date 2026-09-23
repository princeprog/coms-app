"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Branch } from "@/features/branches/types/branch.types";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import { createStockRequestSchema } from "@/features/stock-requests/schemas/stock-request.schema";
import type {
  StockRequestCreateAction,
  StockRequestMutationResult,
} from "@/features/stock-requests/types/stock-request.types";
import {
  StockRequestLineFields,
  type StockRequestLineValue,
} from "./stock-request-line-fields";

export function StockRequestCreateForm({
  branches,
  stockItems,
  selectedBranchId,
  action,
  onPendingChange,
  onCreated,
}: {
  branches: Branch[];
  stockItems: StockItem[];
  selectedBranchId?: string;
  action: StockRequestCreateAction;
  onPendingChange: (pending: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState(
    branches.some((branch) => branch.id === selectedBranchId)
      ? selectedBranchId!
      : (branches[0]?.id ?? ""),
  );
  const [lines, setLines] = useState<StockRequestLineValue[]>([
    {
      key: 1,
      stock_item_id: stockItems[0]?.id ?? "",
      quantity_requested: "",
    },
  ]);
  const nextLineKey = useRef(2);
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);

  function updateLine(
    key: number,
    field: "stock_item_id" | "quantity_requested",
    value: string,
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = createStockRequestSchema.safeParse({
      branch_id: branchId,
      items: lines.map(({ stock_item_id, quantity_requested }) => ({
        stock_item_id,
        quantity_requested: quantity_requested.trim(),
      })),
    });
    if (!parsed.success) {
      setError(
        "Choose a branch and unique stock items, then enter positive quantities.",
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
        setError("This browser cannot safely submit a stock request.");
        return;
      }
    }

    setPending(true);
    onPendingChange(true);
    let result: StockRequestMutationResult;
    try {
      result = await action(parsed.data, keyForRetry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not submit this stock request. Try again.",
      };
    }
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    keyForRetry.current = null;
    onCreated(result.request_id);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="request-branch" className="text-sm font-medium">
          Branch
        </label>
        <select
          id="request-branch"
          value={branchId}
          disabled={pending || branches.length === 1}
          onChange={(event) => setBranchId(event.target.value)}
          className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branch_name}
            </option>
          ))}
        </select>
      </div>
      <StockRequestLineFields
        lines={lines}
        stockItems={stockItems}
        disabled={pending}
        onChange={updateLine}
        onRemove={(key) =>
          setLines((current) => current.filter((line) => line.key !== key))
        }
      />
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={
            pending || lines.length >= 100 || stockItems.length <= lines.length
          }
          onClick={() => {
            const usedIds = new Set(lines.map((line) => line.stock_item_id));
            const nextItem = stockItems.find((item) => !usedIds.has(item.id));
            setLines((current) => [
              ...current,
              {
                key: nextLineKey.current++,
                stock_item_id: nextItem?.id ?? "",
                quantity_requested: "",
              },
            ]);
          }}
        >
          Add stock item
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button
          type="submit"
          disabled={pending || !branches.length || !stockItems.length}
        >
          {pending ? "Submitting…" : "Submit request"}
        </Button>
      </DialogFooter>
    </form>
  );
}
