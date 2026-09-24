"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Branch } from "@/features/branches/types/branch.types";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import { createStockRequestSchema } from "@/features/stock-requests/schemas/stock-request.schema";
import type {
  StockRequestCreateAction,
  StockRequestMutationResult,
} from "@/features/stock-requests/types/stock-request.types";
import { StockRequestCreateFields } from "./stock-request-create-fields";
import type { StockRequestLineValue } from "./stock-request-line-fields";

export function StockRequestCreateForm({
  branches,
  stockItems,
  selectedBranchId,
  action,
  onPendingChange,
  onDirtyChange,
  onCancel,
  onCreated,
}: {
  branches: Branch[];
  stockItems: StockItem[];
  selectedBranchId?: string;
  action: StockRequestCreateAction;
  onPendingChange: (pending: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
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
    onDirtyChange(true);
  }

  function addLine() {
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
    onDirtyChange(true);
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
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Create stock request"
    >
      <StockRequestCreateFields
        branches={branches}
        stockItems={stockItems}
        branchId={branchId}
        lines={lines}
        pending={pending}
        error={error}
        onBranchChange={(value) => {
          setBranchId(value);
          onDirtyChange(true);
        }}
        onLineChange={updateLine}
        onLineRemove={(key) => {
          setLines((current) => current.filter((line) => line.key !== key));
          onDirtyChange(true);
        }}
        onAddLine={addLine}
      />
      <SheetFooter className="flex-row justify-end border-t bg-background p-4 sm:p-6">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || !branches.length || !stockItems.length}
        >
          {pending ? "Submitting…" : "Submit request"}
        </Button>
      </SheetFooter>
    </form>
  );
}
