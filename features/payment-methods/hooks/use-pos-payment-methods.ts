"use client";
import { availablePaymentMethodsKey } from "../query-keys";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAvailablePaymentMethodsAction } from "../services/payment-method-actions";
import type { PaymentMethodChoice } from "../schemas/payment-method.schema";
export function usePosPaymentMethods() {
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
  if (selected === undefined && query.data)
    setSelected(query.data.find((item) => item.kind === "CASH") ?? null);
  const current = query.data?.find((item) => item.id === selected?.id);
  return {
    methods: query.data ?? [],
    selected: current ?? selected ?? null,
    unavailable: !current || query.isError || query.isPending,
    loading: query.isPending,
    failed: query.isError,
    refresh: query.refetch,
    select: (id: string) =>
      setSelected(query.data?.find((item) => item.id === id) ?? null),
  };
}
