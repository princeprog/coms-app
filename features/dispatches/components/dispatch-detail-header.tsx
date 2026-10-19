import { Badge } from "@/components/ui/badge";
import { isDispatchComplete } from "../services/dispatch-completion-summary";
import { ArrowLeft, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import type { Dispatch } from "../types/dispatch.types";
import { DispatchStatusBadge } from "./dispatch-status-badge";

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
        {completed ? (
          <Badge
            className={`h-auto min-h-8 max-w-full shrink-0 self-start rounded-md px-2.5 py-1 text-sm whitespace-normal text-white transition-none sm:self-center ${dispatch.status === "RECEIVED" ? "bg-emerald-700" : "bg-slate-600"}`}
          >
            {dispatch.status === "RECEIVED"
              ? "Completed"
              : "Completed with resolved discrepancies"}
          </Badge>
        ) : (
          <div className="[&_[data-slot=badge]]:min-h-8 [&_[data-slot=badge]]:rounded-md [&_[data-slot=badge]]:text-sm [&_[data-slot=badge]]:px-2.5 [&_[data-slot=badge]]:transition-none">
            <DispatchStatusBadge status={dispatch.status} />
          </div>
        )}
      </div>
    </header>
  );
}
