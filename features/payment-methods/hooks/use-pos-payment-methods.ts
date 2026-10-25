"use client";
import { availablePaymentMethodsKey } from "../query-keys";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAvailablePaymentMethodsAction } from "../services/payment-method-actions";
import type { PaymentMethodChoice } from "../schemas/payment-method.schema";
export function usePosPaymentMethods(noncashOnly = false) {
  const query = useQuery({
    queryKey: availablePaymentMethodsKey,
    queryFn: getAvailablePaymentMethodsAction,
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });
  const [selected, setSelected] = useState<
    PaymentMethodChoice | null | undefined
  >(undefined);
  const methods = (query.data ?? []).filter((item) => !noncashOnly || item.kind !== "CASH");
  if (selected === undefined && query.data)
    setSelected(noncashOnly ? methods[0] ?? null : methods.find((item) => item.kind === "CASH") ?? null);
  const current = methods.find((item) => item.id === selected?.id);
  return {
    methods,
    selected: current ?? selected ?? null,
    unavailable: !current || query.isError || query.isPending,
    loading: query.isPending,
    failed: query.isError,
    refresh: query.refetch,
    select: (id: string) =>
      setSelected(methods.find((item) => item.id === id) ?? null),
  };
}
