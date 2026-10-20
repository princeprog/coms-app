"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  createDispatchHref,
  type DispatchPageFilters,
} from "../services/dispatch-page-params";
const views = [
  { value: undefined, label: "All dispatches" },
  { value: "pending", label: "Pending receiving" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "REVIEW", label: "Count review" },
];
export function DispatchViews({
  filters,
  onChange,
}: {
  filters: DispatchPageFilters;
  onChange: (value: string | undefined) => void;
}) {
  const active =
    filters.receivingStatus === "AWAITING_COUNT"
      ? "pending"
      : filters.receivingStatus;
  return (
    <nav
      aria-label="Dispatch views"
      className="flex flex-wrap gap-x-5 sm:gap-x-7"
    >
      {views.map((view) => (
        <Link
          key={view.label}
          href={createDispatchHref({
            ...filters,
            page: 1,
            receivingStatus: view.value,
            status: "all",
            discrepancyStatus: "all",
          })}
          aria-current={active === view.value ? "page" : undefined}
          className={cn(
            "inline-flex min-h-12 items-center border-b-2 px-0.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            active === view.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          onClick={(event) => {
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            onChange(view.value);
          }}
        >
          {view.label}
        </Link>
      ))}
    </nav>
  );
}
