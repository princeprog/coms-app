import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportProgress } from "../schemas/dashboard-today.schema";

const statuses = {
  APPROVED: { label: "Approved", color: "bg-emerald-700" },
  SUBMITTED: { label: "Submitted", color: "bg-sky-700" },
  RETURNED: { label: "Returned", color: "bg-amber-700" },
  DRAFT: { label: "Draft", color: "bg-slate-600" },
  MISSING: { label: "Not started", color: "bg-slate-600" },
};

export function ReportProgressCell({
  report,
  bypassed,
}: {
  report?: ReportProgress;
  bypassed: boolean;
}) {
  if (!report) return <span className="text-muted-foreground">—</span>;
  const status = statuses[report.status];
  const editable = ["DRAFT", "RETURNED", "MISSING"].includes(report.status);
  const overdue =
    report.period === "yesterday" &&
    report.had_sales &&
    report.status === "MISSING";
  const checks = editable
    ? [
        ...(report.open_shifts
          ? [
              `${report.open_shifts} open shift${report.open_shifts === 1 ? "" : "s"}`,
            ]
          : []),
        ...(report.unreviewed_shifts
          ? [
              `${report.unreviewed_shifts} shift${report.unreviewed_shifts === 1 ? "" : "s"} to review`,
            ]
          : []),
        ...(report.counts_awaiting_review
          ? [
              `${report.counts_awaiting_review} delivery count${report.counts_awaiting_review === 1 ? "" : "s"} to review`,
            ]
          : []),
        ...(report.pending_deliveries
          ? [
              `${report.pending_deliveries} ${report.pending_deliveries === 1 ? "delivery needs" : "deliveries need"} a count or explanation`,
            ]
          : []),
        ...(!report.day_ended ? ["Business day still open"] : []),
      ]
    : [];
  return (
    <div className="flex min-w-40 flex-col items-start gap-1 whitespace-normal">
      <Badge
        className={cn("text-white", overdue ? "bg-red-700" : status.color)}
      >
        {status.label}
      </Badge>
      {report.total_items !== null && (
        <span className="text-xs text-muted-foreground">
          {report.total_items === 0
            ? "No items to count"
            : `${report.counted_items} / ${report.total_items} items counted`}
        </span>
      )}
      {checks.length > 0 && (
        <ul
          aria-label="Report checklist"
          className="space-y-0.5 text-xs text-muted-foreground"
        >
          {checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      )}
      {bypassed && editable && (
        <span className="text-xs text-muted-foreground">
          Development: checklist bypassed
        </span>
      )}
    </div>
  );
}
