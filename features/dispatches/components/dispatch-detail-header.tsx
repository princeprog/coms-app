import { Badge } from "@/components/ui/badge";
import { isDispatchComplete } from "../services/dispatch-completion-summary";
import { ArrowLeft, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import type { Dispatch } from "../types/dispatch.types";
import { ReceivingStatusBadge } from "./receiving-status-badge";
import { DispatchStatusBadge } from "./dispatch-status-badge";

// A pill with a leading dot and a "Status" label, so the header status
// reads as information beside the page's buttons rather than as one of them.
const statusPill =
  "[&_[data-slot=badge]]:min-h-7 [&_[data-slot=badge]]:gap-2 [&_[data-slot=badge]]:rounded-full [&_[data-slot=badge]]:px-3 [&_[data-slot=badge]]:py-0.5 [&_[data-slot=badge]]:text-sm [&_[data-slot=badge]]:transition-none [&_[data-slot=badge]]:before:size-1.5 [&_[data-slot=badge]]:before:shrink-0 [&_[data-slot=badge]]:before:rounded-full [&_[data-slot=badge]]:before:bg-white/85 [&_[data-slot=badge]]:before:content-['']";

export function DispatchDetailHeader({ dispatch }: { dispatch: Dispatch }) {
  const completed = isDispatchComplete(dispatch);
  const Icon = completed ? PackageCheck : Truck;
  return (
    <header className="flex min-w-0 flex-col gap-5">
      <Link
        href="/dispatches"
        className="dispatch-press inline-flex min-h-9 w-fit items-center gap-2 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to dispatches
      </Link>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-card text-foreground shadow-sm ring-1 ring-foreground/10">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance wrap-anywhere sm:text-3xl">
              Dispatch to {dispatch.branch_name}
            </h1>
            <p className="text-sm text-muted-foreground">From Commissary</p>
          </div>
        </div>
        <div
          className={`flex max-w-full shrink-0 items-center gap-2 self-start sm:self-center ${statusPill}`}
        >
          <span className="text-sm text-muted-foreground">Status</span>
          {completed ? (
            <Badge
              className={`h-auto max-w-full whitespace-normal text-white ${dispatch.status === "RECEIVED" ? "bg-emerald-700" : "bg-slate-600"}`}
            >
              {dispatch.status === "RECEIVED"
                ? "Completed"
                : "Completed with resolved discrepancies"}
            </Badge>
          ) : dispatch.receiving_status === "REVIEW" ? (
            <ReceivingStatusBadge status="REVIEW" />
          ) : (
            <DispatchStatusBadge status={dispatch.status} />
          )}
        </div>
      </div>
    </header>
  );
}
