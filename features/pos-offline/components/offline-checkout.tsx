"use client";
import { useEffect, useMemo, useState } from "react";
import { PosCartPanel } from "@/features/sales/components/pos-cart-panel";
import { PosMenuPanel } from "@/features/sales/components/pos-menu-panel";
import { PosServicePicker } from "@/features/sales/components/pos-service-picker";
import {
  calculateSaleTotal,
  addSaleDecimals,
} from "@/features/sales/services/sale-decimal";
import { calculateCashChange } from "@/features/sales/services/pos-cash";
import { formatProductPrice } from "@/lib/format-currency";
import { toast } from "@/components/ui/toast";
import type { OfflineRegister } from "../hooks/use-offline-register";
import {
  snapshotProducts,
  snapshotServices,
} from "../hooks/offline-presentation";
import type {
  OfflineLocalState,
  OfflineRecord,
} from "../services/offline-types";
import { OfflineMenuControls } from "./offline-menu-controls";

export function OfflineCheckout({
  register,
  state,
}: {
  register: OfflineRegister;
  state: OfflineLocalState;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [amount, setAmount] = useState("");
  const [completed, setCompleted] = useState<OfflineRecord | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const products = useMemo(() => snapshotProducts(state), [state]);
  const cart = state.cart.items.flatMap((line) => {
    const product = products.find(
      (item) => item.product_id === line.product_id,
    );
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const filtered = products.filter(
    (product) =>
      (category === "all" || category === product.category_id) &&
      product.product_name
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const total = calculateSaleTotal(
    cart.map((line) => ({
      unitPrice: line.product.price,
      quantity: line.quantity,
    })),
  );
  const dayEnded =
    now + state.clock.offset_ms >= Date.parse(state.session.cutoff_at);
  const blocked = dayEnded || state.clock.rollback_detected || state.sealed;
  const disabled = register.pending || register.readOnly;
  const receipt = completed
    ? (state.records.find(
        (record) => record.envelope.id === completed.envelope.id,
      ) ?? completed)
    : null;
  const saveItems = (items: typeof state.cart.items) => {
    setCompleted(null);
    void register.saveCart({ service_type: state.cart.service_type, items });
  };
  return (
    <div className="space-y-4">
      {blocked && (
        <p
          role="alert"
          className="rounded-lg border border-destructive p-3 text-sm"
        >
          {state.sealed
            ? "This register has stopped selling for finalization or recovery. Sync and finalize its saved sales."
            : dayEnded
              ? "The business day has ended. Sync and finalize this register online before closing your shift."
              : "The device clock changed. Selling is paused. Saved sales remain available for recovery."}
        </p>
      )}
      {receipt && (
        <p role="status" className="rounded-lg border bg-muted p-4">
          {receipt.status === "ACKNOWLEDGED"
            ? `Sale ${receipt.result?.sale_reference ?? "confirmed"}`
            : `Local sale ${receipt.envelope.sequence} · ${receipt.envelope.id.slice(0, 8)}`}{" "}
          · {formatProductPrice(receipt.envelope.total_amount)} · Change{" "}
          {formatProductPrice(
            calculateCashChange(
              receipt.envelope.cash_tendered,
              receipt.envelope.total_amount,
            ).change ?? "0",
          )}
          .{" "}
          {receipt.status === "ACKNOWLEDGED"
            ? "Confirmed by COMS."
            : receipt.status === "NEEDS_REVIEW"
              ? "Saved; needs manager review."
              : "Saved on this device; waiting for server confirmation."}
        </p>
      )}
      <a
        href="#pos-cart-panel"
        className="inline-block text-sm underline xl:hidden"
      >
        View current order ({cart.length})
      </a>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.7fr)]">
        <PosMenuPanel
          menuPage={{
            items: filtered,
            total: filtered.length,
            page: 1,
            page_size: Math.max(1, filtered.length),
          }}
          menuControls={
            <OfflineMenuControls
              snapshot={state.snapshot}
              search={search}
              category={category}
              onSearch={setSearch}
              onCategory={setCategory}
            />
          }
          refreshing={false}
          filtered={Boolean(search || category !== "all")}
          unavailable={false}
          branchActive
          pending={disabled || blocked}
          service={state.cart.service_type}
          cart={cart}
          onAdd={(product) => {
            const existing = state.cart.items.find(
              (line) => line.product_id === product.product_id,
            );
            saveItems(
              existing
                ? state.cart.items.map((line) =>
                    line === existing
                      ? {
                          ...line,
                          quantity: addSaleDecimals([line.quantity, "1"]),
                        }
                      : line,
                  )
                : [
                    ...state.cart.items,
                    { product_id: product.product_id, quantity: "1" },
                  ],
            );
          }}
        />
        <PosCartPanel
          cart={cart}
          cash
          paymentPicker={
            <p className="text-sm font-medium">
              Payment: {state.snapshot.cash_payment_method.name} · Cash only
            </p>
          }
          branchActive
          blocked={blocked || register.readOnly}
          pending={disabled}
          error={register.error}
          lastSale={null}
          estimatedTotal={total}
          amountReceived={amount}
          onAmountChange={setAmount}
          onQuantityChange={(id, quantity) =>
            saveItems(
              state.cart.items.map((line) =>
                line.product_id === id ? { ...line, quantity } : line,
              ),
            )
          }
          onRemove={(id) =>
            saveItems(state.cart.items.filter((line) => line.product_id !== id))
          }
          onClear={() => {
            saveItems([]);
            setAmount("");
          }}
          servicePicker={
            <PosServicePicker
              value={state.cart.service_type}
              options={snapshotServices(state.snapshot.branch)}
              disabled={disabled || blocked}
              onChange={(service_type) =>
                void register.saveCart({
                  service_type,
                  items: state.cart.items,
                })
              }
            />
          }
          onSubmit={async (event) => {
            event.preventDefault();
            if (blocked || disabled) return;
            const record = await register.checkout(amount);
            if (record) {
              setCompleted(record);
              setAmount("");
              toast.add({
                type: "success",
                title: "Cash sale saved on this device",
              });
              void register.sync();
            }
          }}
        />
      </div>
    </div>
  );
}
