"use client";
import { useQueryClient } from "@tanstack/react-query";
import { shiftKeys } from "@/features/shifts/query-keys";
import type { PaymentMethodChoice } from "@/features/payment-methods/schemas/payment-method.schema";
import type { BranchProduct } from "@/features/branch-products/types/branch-product.types";
import { useMenuMutation } from "@/features/menus/hooks/use-menu-mutation";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import type { PosCartLine } from "../components/pos-cart-panel";
import { createSaleSchema } from "../schemas/sale.schema";
import { addSaleDecimals, calculateSaleTotal } from "../services/sale-decimal";
import { refreshCartPricesAction } from "../services/sales-price-actions";
import type {
  Sale,
  SaleCreateAction,
  SalesMenuPage,
} from "../types/sale.types";
export function usePosCheckout({
  branchId,
  branchActive,
  serviceTypes,
  appliedService,
  onServiceChange,
  action,
  paymentMethod,
  paymentUnavailable,
  refreshPaymentMethods,
}: {
  branchId: string;
  branchActive: boolean;
  serviceTypes: ServiceType[];
  appliedService?: ServiceType;
  onServiceChange?: (service: ServiceType) => void;
  action: SaleCreateAction;
  paymentMethod: PaymentMethodChoice | null;
  paymentUnavailable: boolean;
  refreshPaymentMethods: () => unknown;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const saleMutation = useMenuMutation(
    (input: { payload: unknown; key: string }) =>
      action(branchId, input.payload, input.key),
  );
  const [selection, setSelection] = useState({
    applied: appliedService,
    value:
      appliedService && serviceTypes.includes(appliedService)
        ? appliedService
        : serviceTypes.length === 1
          ? serviceTypes[0]
          : (null as ServiceType | null),
  });
  if (selection.applied !== appliedService)
    setSelection({
      applied: appliedService,
      value:
        appliedService && serviceTypes.includes(appliedService)
          ? appliedService
          : serviceTypes.length === 1
            ? serviceTypes[0]
            : null,
    });
  const service = selection.value;
  function setService(value: ServiceType) {
    setSelection({ applied: appliedService, value });
    if (onServiceChange) {
      onServiceChange(value);
      return;
    }
    const next = new URLSearchParams(params.toString());
    next.set("branch_id", branchId);
    next.set("service_type", value);
    next.delete("page");
    router.replace("/pos?" + next.toString(), { scroll: false });
  }
  const [needsPriceReview, setNeedsPriceReview] = useState(false);
  const [updatedPrices, setUpdatedPrices] = useState<BranchProduct[] | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const pricesMutation = useMenuMutation(() =>
    refreshCartPricesAction(
      branchId,
      cart.map((line) => line.product.product_id),
    ),
  );
  const [completedCash, setCompletedCash] = useState(false);
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
    if (
      !service ||
      !(
        product.available_service_types ??
        product.service_types ?? ["DINE_IN", "TAKEAWAY"]
      ).includes(service) ||
      pending ||
      needsPriceReview
    )
      return;
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
    if (cart.length === 1) {
      setNeedsPriceReview(false);
      setUpdatedPrices(null);
    }
  }

  function clearCart() {
    if (pending) return;
    updateCart(() => []);
    setNeedsPriceReview(false);
    setUpdatedPrices(null);
    retry.current = null;
  }

  const payload = createSaleSchema.safeParse({
    service_type: service,
    tender_method: paymentMethod?.name ?? "",
    payment_method_id: paymentMethod?.id,
    items: cart.map(({ product, quantity }) => ({
      product_id: product.product_id,
      price_revision: product.price_revision ?? 0,
      quantity,
    })),
  });
  const estimatedTotal =
    cart.length === 0
      ? "0"
      : cart.every(
            ({ quantity }) =>
              /^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/.test(quantity) &&
              quantity.length <= 60,
          )
        ? calculateSaleTotal(
            cart.map(({ product, quantity }) => ({
              quantity,
              unitPrice: product.price,
            })),
          )
        : null;

  const incompatible = cart.filter(
    (line) =>
      !service ||
      !(
        line.product.available_service_types ??
        line.product.service_types ?? ["DINE_IN", "TAKEAWAY"]
      ).includes(service),
  );
  async function refreshPrices() {
    setRefreshing(true);
    try {
      const result = await pricesMutation.mutateAsync();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUpdatedPrices(result.items);
    } catch {
      setError("Unable to refresh prices. Your cart is preserved.");
    } finally {
      setRefreshing(false);
    }
  }

  async function recordSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      pending ||
      needsPriceReview ||
      incompatible.length ||
      !branchActive ||
      paymentUnavailable
    )
      return;
    setError("");
    if (!payload.success) {
      setError("Select a payment method and enter valid positive quantities.");
      return;
    }

    const items = [...payload.data.items].sort((left, right) =>
      left.product_id.localeCompare(right.product_id),
    );
    const fingerprint = JSON.stringify({
      branchId,
      service_type: payload.data.service_type,
      payment_method_id: payload.data.payment_method_id,
      items,
    });
    const key =
      retry.current?.fingerprint === fingerprint
        ? retry.current.key
        : crypto.randomUUID();
    retry.current = { fingerprint, key };

    setPending(true);
    try {
      const result = await saleMutation.mutateAsync({
        payload: payload.data,
        key,
      });
      if (!result.ok) {
        setError(result.error);
        if (result.code === "PAYMENT_METHOD_UNAVAILABLE")
          await refreshPaymentMethods();
        if (result.code === "PRICE_CHANGED") {
          setNeedsPriceReview(true);
          setUpdatedPrices(null);
          await refreshPrices();
        }
        if (result.code?.startsWith("SHIFT_"))
          await queryClient.invalidateQueries({ queryKey: shiftKeys.all });
        return;
      }
      setCompletedCash(paymentMethod?.kind === "CASH");
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

  function acceptPrices() {
    if (!updatedPrices) return;
    setCart((current) =>
      current.map((line) => ({
        ...line,
        product:
          updatedPrices.find(
            (item) => item.product_id === line.product.product_id,
          ) ?? line.product,
      })),
    );
    setNeedsPriceReview(false);
    setError("");
    retry.current = null;
  }
  return {
    service,
    setService,
    needsPriceReview,
    updatedPrices,
    refreshing,
    cart,
    cash: lastSale ? completedCash : paymentMethod?.kind === "CASH",
    pending,
    error,
    setError,
    lastSale,
    setLastSale,
    addProduct,
    updateQuantity,
    removeProduct,
    clearCart,
    estimatedTotal,
    incompatible,
    refreshPrices,
    recordSale,
    acceptPrices,
  };
}
function addOne(value: string): string {
  if (!/^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/.test(value)) return "1";
  return addSaleDecimals([value, "1"]);
}
