import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { dispatchTimestamp } from "../services/dispatch-detail-presentation";
import type { Dispatch } from "../types/dispatch.types";
import { DispatchStatusBadge } from "./dispatch-status-badge";

export function DispatchDetailHeader({ dispatch }: { dispatch: Dispatch }) {
  return (
    <header className="flex min-w-0 flex-col gap-4">
      <Link
        href="/dispatches"
        className="inline-flex w-fit items-center gap-2 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to dispatches
      </Link>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight wrap-anywhere lg:text-3xl">
            Dispatch to {dispatch.branch_name}
          </h1>
          <DispatchStatusBadge status={dispatch.status} size="lg" />
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            From{" "}
            <strong className="ml-1 font-medium text-foreground">
              Commissary
            </strong>
          </span>
          <ArrowRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 text-muted-foreground">
            To{" "}
            <strong className="ml-1 font-medium text-foreground wrap-anywhere">
              {dispatch.branch_name}
            </strong>
          </span>
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
            <dt>Created</dt>
            <dd className="min-w-0 wrap-anywhere">
              <time dateTime={dispatch.created_at}>
                {dispatchTimestamp(dispatch.created_at)}
              </time>{" "}
              <span>by {dispatch.created_by_name}</span>
            </dd>
          </div>
          {dispatch.dispatched_at && (
            <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
              <dt>Dispatched</dt>
              <dd className="min-w-0 wrap-anywhere">
                <time dateTime={dispatch.dispatched_at}>
                  {dispatchTimestamp(dispatch.dispatched_at)}
                </time>{" "}
                <span>by {dispatch.dispatched_by_name ?? "Not recorded"}</span>
              </dd>
            </div>
          )}
        </dl>
      </div>
      <Separator />
    </header>
  );
}
