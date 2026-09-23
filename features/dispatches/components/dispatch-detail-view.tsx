import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";
import { DispatchHistory } from "./dispatch-history";
import { DispatchItemTable } from "./dispatch-item-table";

export function DispatchDetailView({ dispatch }: { dispatch: Dispatch }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/dispatches"
        >
          Back to dispatches
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/replenishment/${dispatch.stock_request_id}`}
        >
          View stock request
        </Link>
      </div>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Dispatch to {dispatch.branch_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stock request status: {dispatch.stock_request_status}
            </p>
          </div>
          <Badge variant="outline">
            {dispatch.status.replaceAll("_", " ")}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Created by" value={dispatch.created_by_name} />
          <DetailField
            label="Created"
            value={format(parseISO(dispatch.created_at), "PPp")}
          />
          <DetailField
            label="Dispatched by"
            value={dispatch.dispatched_by_name ?? "Not dispatched"}
          />
          <DetailField
            label="Dispatched at"
            value={
              dispatch.dispatched_at
                ? format(parseISO(dispatch.dispatched_at), "PPp")
                : "Not dispatched"
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dispatch quantities</CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchItemTable dispatch={dispatch} />
        </CardContent>
      </Card>
      <DispatchHistory dispatch={dispatch} />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
