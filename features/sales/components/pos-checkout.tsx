"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSaleSchema } from "@/features/sales/schemas/sale.schema";
import {
  addSaleDecimals,
  calculateSaleTotal,
} from "@/features/sales/services/sale-decimal";
import type {
  Sale,
  SaleCreateAction,
  SalesMenuPage,
} from "@/features/sales/types/sale.types";
import { PosCartPanel, type PosCartLine } from "./pos-cart-panel";
import { PosProductMenu } from "./pos-product-menu";

export function PosCheckout({
  branchId,
  branchActive,
  menuPage,
  action,
}: {
  branchId: string;
  branchActive: boolean;
  menuPage: SalesMenuPage;
  action: SaleCreateAction;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [tenderMethod, setTenderMethod] = useState("cash");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);

  function updateCart(update: (current: PosCartLine[]) => PosCartLine[]) {
    setCart(update);
    setError("");
    setLastSale(null);
  }

  function addProduct(product: SalesMenuPage["items"][number]) {
    updateCart((current) => {
      const existing = current.find(
        (line) => line.product.product_id === product.product_id,
      );
      if (existing)
        return current.map((line) =>
          line.product.product_id === product.product_id
            ? { ...line, quantity: addOne(line.quantity) }
            : line,
        );
      if (current.length >= 40) return current;
      return [...current, { product, quantity: "1" }];
    });
  }

  function updateQuantity(productId: string, quantity: string) {
    updateCart((current) =>
      current.map((line) =>
        line.product.product_id === productId ? { ...line, quantity } : line,
      ),
    );
  }

  function removeProduct(productId: string) {
    updateCart((current) =>
      current.filter((line) => line.product.product_id !== productId),
    );
  }

  const payload = createSaleSchema.safeParse({
    tender_method: tenderMethod,
    items: cart.map(({ product, quantity }) => ({
      product_id: product.product_id,
      quantity,
    })),
  });
  const estimatedTotal = payload.success
    ? calculateSaleTotal(
        cart.map(({ product, quantity }) => ({
          quantity,
          unitPrice: product.price,
        })),
      )
    : null;

  async function recordSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!payload.success) {
      setError("Enter a tender method and valid positive quantities.");
      return;
    }

    const items = [...payload.data.items].sort((left, right) =>
      left.product_id.localeCompare(right.product_id),
    );
    const fingerprint = JSON.stringify({
      branchId,
      tender_method: payload.data.tender_method,
      items,
    });
    const key =
      retry.current?.fingerprint === fingerprint
        ? retry.current.key
        : crypto.randomUUID();
    retry.current = { fingerprint, key };

    setPending(true);
    try {
      const result = await action(branchId, payload.data, key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLastSale(result.sale);
      setCart([]);
      retry.current = null;
      router.refresh();
    } catch {
      setError(
        "COMS could not complete this sale. Your cart is still available to retry.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
      <PosProductMenu
        products={menuPage.items}
        total={menuPage.total}
        branchActive={branchActive}
        pending={pending}
        cartIsFull={cart.length >= 40}
        onAdd={addProduct}
      />
      <PosCartPanel
        cart={cart}
        tenderMethod={tenderMethod}
        branchActive={branchActive}
        pending={pending}
        error={error}
        lastSale={lastSale}
        estimatedTotal={estimatedTotal}
        onTenderMethodChange={(value) => {
          setTenderMethod(value);
          setError("");
          setLastSale(null);
        }}
        onQuantityChange={updateQuantity}
        onRemove={removeProduct}
        onSubmit={recordSale}
      />
    </div>
  );
}

function addOne(value: string): string {
  if (!/^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/.test(value)) return "1";
  return addSaleDecimals([value, "1"]);
}
