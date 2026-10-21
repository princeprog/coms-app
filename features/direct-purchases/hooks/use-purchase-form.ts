"use client";
import { purchaseKeys } from "../query-keys";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import {
  purchaseInputSchema,
  type PurchaseInput,
  type PurchaseStock,
} from "../schemas/purchase.schema";
import { purchaseToday } from "../services/purchase-date";
import { createPurchaseAction } from "../services/purchase-actions";
export type PurchaseLine = {
  key: number;
  stock: PurchaseStock | null;
  quantity_received: string;
  unit_cost: string;
};
export function usePurchaseForm(
  onComplete: () => void,
  initialStock: PurchaseStock | null = null,
) {
  const initialQuantity = initialStock?.suggested_quantity ?? "";
  const [initialDate] = useState(purchaseToday);
  const [purchase_date, setDate] = useState(initialDate);
  const [store_name, setStore] = useState("");
  const [receipt_number, setReceipt] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      key: 1,
      stock: initialStock,
      quantity_received: initialQuantity,
      unit_cost: "",
    },
  ]);
  const next = useRef(2);
  const [review, setReview] = useState<PurchaseInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ input, key }: { input: PurchaseInput; key: string }) =>
      createPurchaseAction(input, key),
    retry: false,
  });
  const dirty = !!(
    store_name ||
    receipt_number ||
    notes ||
    purchase_date !== initialDate ||
    lines.length > 1 ||
    lines.some(
      (line) =>
        line.stock?.id !== initialStock?.id ||
        line.quantity_received !== (line.key === 1 ? initialQuantity : "") ||
        line.unit_cost,
    )
  );
  function changeLine(key: number, patch: Partial<PurchaseLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
    setErrors({});
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = purchaseInputSchema.safeParse({
      purchase_date,
      store_name,
      receipt_number,
      notes,
      items: lines.map((line) => ({
        stock_item_id: line.stock?.id ?? "",
        quantity_received: line.quantity_received,
        unit_cost: line.unit_cost,
      })),
    });
    if (!parsed.success) {
      const result: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        result[issue.path.join(".")] ??= issue.message;
      setErrors(result);
      const form = event.currentTarget;
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setErrors({});
    setReview(parsed.data);
  }
  async function confirm() {
    if (!review || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const fingerprint = JSON.stringify(review);
      if (retry.current?.fingerprint !== fingerprint)
        retry.current = { fingerprint, key: crypto.randomUUID() };
      const result = await mutation.mutateAsync({
        input: review,
        key: retry.current.key,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await client.invalidateQueries({ queryKey: purchaseKeys.all });
      toast.add({
        type: "success",
        title: "Purchase recorded. Commissary stock updated.",
      });
      onComplete();
      router.refresh();
    } catch {
      setError("Purchase could not be recorded. Try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return {
    purchase_date,
    setDate,
    store_name,
    setStore,
    receipt_number,
    setReceipt,
    notes,
    setNotes,
    lines,
    changeLine,
    addLine: () => {
      const key = next.current++;
      setLines((current) => [
        ...current,
        {
          key,
          stock: null,
          quantity_received: "",
          unit_cost: "",
        },
      ]);
      setErrors({});
      requestAnimationFrame(() =>
        document.getElementById(`purchase-line-${key}-stock`)?.focus(),
      );
    },
    removeLine: (key: number) => {
      setLines((current) => current.filter((line) => line.key !== key));
      setErrors({});
    },
    review,
    setReview,
    errors,
    setErrors,
    error,
    pending,
    dirty,
    submit,
    confirm,
  };
}
