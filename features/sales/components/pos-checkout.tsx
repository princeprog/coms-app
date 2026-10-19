"use client";
import { usePosPaymentMethods } from "@/features/payment-methods/hooks/use-pos-payment-methods";
import { PosPaymentMethodPicker } from "./pos-payment-method-picker";
import { useState, type ReactNode } from "react";
import { calculateCashChange } from "../services/pos-cash";
import { PosServicePicker } from "./pos-service-picker";
import { PosPriceReview } from "./pos-price-review";
import { usePosCheckout } from "../hooks/use-pos-checkout";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

import type {
  SaleCreateAction,
  SalesMenuPage,
} from "@/features/sales/types/sale.types";
import { PosCartPanel } from "./pos-cart-panel";
import { PosMenuPanel } from "./pos-menu-panel";

export function PosCheckout({
  branchId,
  branchActive,
  serviceTypes = ["DINE_IN", "TAKEAWAY"],
  appliedService,
  onServiceChange,
  menuPage,
  action,
  menuControls,
  menuPagination,
  menuRefreshing = false,
  menuFiltered = false,
  menuUnavailable = false,
}: {
  branchId: string;
  branchActive: boolean;
  serviceTypes?: ServiceType[];
  appliedService?: ServiceType;
  onServiceChange?: (service: ServiceType) => void;
  menuPage: SalesMenuPage;
  action: SaleCreateAction;
  menuControls?: ReactNode;
  menuPagination?: ReactNode;
  menuRefreshing?: boolean;
  menuFiltered?: boolean;
  menuUnavailable?: boolean;
}) {
  const payment = usePosPaymentMethods();
  const [amountReceived, setAmountReceived] = useState("");
  const {
    service,
    setService,
    needsPriceReview,
    updatedPrices,
    refreshing,
    cart,
    cash,
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
  } = usePosCheckout({
    branchId,
    branchActive,
    serviceTypes,
    appliedService,
    onServiceChange,
    action,
    paymentMethod: payment.selected,
    paymentUnavailable: payment.unavailable,
    refreshPaymentMethods: payment.refresh,
  });
  return (
    <div className="flex flex-col gap-4">
      {incompatible.length > 0 && (
        <p role="alert" className="rounded-lg border p-4 text-sm">
          Remove incompatible items or change the service type:{" "}
          {incompatible.map((line) => line.product.product_name).join(", ")}.
        </p>
      )}
      {needsPriceReview && (
        <PosPriceReview
          cart={cart}
          updated={updatedPrices}
          pending={refreshing}
          onRefresh={refreshPrices}
          onAccept={acceptPrices}
        />
      )}
      {(!service || cart.length > 0) && (
        <Link
          href="#pos-cart-panel"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-fit xl:hidden",
          )}
        >
          {!service
            ? "Choose service"
            : `View cart (${cart.length} ${cart.length === 1 ? "item" : "items"})`}
        </Link>
      )}
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.7fr)]">
        <PosMenuPanel
          menuPage={menuPage}
          menuControls={menuControls}
          menuPagination={menuPagination}
          refreshing={menuRefreshing}
          filtered={menuFiltered}
          unavailable={menuUnavailable}
          branchActive={branchActive}
          pending={pending || needsPriceReview}
          service={service}
          cart={cart}
          onAdd={(product) => {
            if (lastSale) setAmountReceived("");
            addProduct(product);
          }}
        />
        <PosCartPanel
          cart={cart}
          cash={cash}
          paymentPicker={
            <PosPaymentMethodPicker
              methods={payment.methods}
              selected={payment.selected}
              loading={payment.loading}
              failed={payment.failed}
              disabled={pending || Boolean(lastSale && !cart.length)}
              onSelect={(id) => {
                payment.select(id);
                setError("");
                setLastSale(null);
                setAmountReceived("");
              }}
              onRefresh={() => void payment.refresh()}
            />
          }
          branchActive={branchActive}
          blocked={
            !service ||
            menuUnavailable ||
            needsPriceReview ||
            incompatible.length > 0 ||
            payment.unavailable
          }
          pending={pending}
          error={error}
          lastSale={lastSale}
          estimatedTotal={estimatedTotal}
          amountReceived={amountReceived}
          onAmountChange={(value) => {
            setAmountReceived(value);
            setError("");
          }}
          servicePicker={
            <PosServicePicker
              value={service}
              options={serviceTypes}
              disabled={pending}
              onChange={(value) => {
                setService(value);
                setError("");
              }}
            />
          }
          onClear={() => {
            clearCart();
            setAmountReceived("");
          }}
          onQuantityChange={updateQuantity}
          onRemove={(id) => {
            removeProduct(id);
            if (cart.length === 1) setAmountReceived("");
          }}
          onSubmit={(event) => {
            if (
              cash &&
              calculateCashChange(amountReceived, estimatedTotal).change ===
                null
            ) {
              event.preventDefault();
              setError("Enter enough cash to cover the order total.");
              return;
            }
            return recordSale(event);
          }}
        />
      </div>
    </div>
  );
}
