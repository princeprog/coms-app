"use client";
import {
  CheckCircle2,
  CircleDashed,
  Ban,
  CreditCard,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { useDirectoryQuery } from "@/hooks/use-directory-query";
import type { SalesPageFilters } from "../services/sales-page-params";
import type { SalePage } from "../types/sale.types";
import { SalesHistoryDateFilter } from "./sales-history-date-filter";
export function SalesHistoryControls({
  page,
  filters,
  query,
}: {
  page: SalePage | null;
  filters: SalesPageFilters;
  query: ReturnType<typeof useDirectoryQuery<SalesPageFilters>>;
}) {
  const methods = Array.from(
    new Set([
      ...(page?.payment_methods ?? []),
      ...(filters.historyTender ? [filters.historyTender] : []),
    ]),
  );
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <form
          className="relative min-w-48 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            query.flushSearch();
          }}
        >
          <label htmlFor="sales-history-search" className="sr-only">
            Search sales
          </label>
          <Search
            aria-hidden="true"
            className="absolute top-3.5 left-3 size-4 text-muted-foreground"
          />
          <Input
            id="sales-history-search"
            className="h-11 pl-10"
            type="search"
            placeholder="Search reference or cashier…"
            maxLength={100}
            value={query.search}
            onChange={(event) => query.changeSearch(event.target.value)}
          />
        </form>
        <SalesHistoryDateFilter filters={filters} onChange={query.apply} />
        <DirectorySelect
          id="history-payment"
          label="Payment method"
          hideLabel
          alignItemWithTrigger={false}
          className="w-full sm:w-44 [&_[data-slot=select-trigger]]:h-11"
          value={
            filters.historyTender ? `method:${filters.historyTender}` : "all"
          }
          onChange={(value) =>
            query.apply({
              historyTender: value === "all" ? undefined : value.slice(7),
            })
          }
          options={[
            {
              value: "all",
              label: "All payments",
              icon: <CreditCard className="text-slate-500" />,
            },
            ...methods.map((name) => ({
              value: `method:${name}`,
              label: name,
              icon: <CreditCard className="text-blue-600" />,
            })),
          ]}
        />
        <DirectorySelect
          id="history-status"
          label="Sale status"
          hideLabel
          alignItemWithTrigger={false}
          className="w-full sm:w-40 [&_[data-slot=select-trigger]]:h-11"
          value={filters.historyStatus ?? "all"}
          onChange={(value) =>
            query.apply({
              historyStatus:
                value === "all" ? undefined : (value as "COMPLETED" | "VOIDED"),
            })
          }
          options={[
            {
              value: "all",
              label: "All statuses",
              icon: <CircleDashed className="text-slate-500" />,
            },
            {
              value: "COMPLETED",
              label: "Completed",
              icon: <CheckCircle2 className="text-emerald-600" />,
            },
            {
              value: "VOIDED",
              label: "Voided",
              icon: <Ban className="text-red-600" />,
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Filtered sales · Philippine time</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            query.changeSearch("");
            query.apply({
              search: "",
              historyStatus: undefined,
              historyTender: undefined,
              historyPeriod: "today",
              historyFrom: undefined,
              historyTo: undefined,
            });
          }}
        >
          Reset filters
        </Button>
      </div>
    </>
  );
}
