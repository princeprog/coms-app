import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DailyReport } from "../types/daily-report.types";

const styles: Record<
  DailyReport["status"],
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-slate-600 text-white" },
  SUBMITTED: { label: "Submitted", className: "bg-amber-700 text-white" },
  RETURNED: { label: "Returned", className: "bg-red-700 text-white" },
  APPROVED: { label: "Approved", className: "bg-emerald-700 text-white" },
};

export function DailyReportStatusBadge({
  status,
}: {
  status: DailyReport["status"];
}) {
  const style = styles[status];
  return (
    <Badge className={cn("h-auto min-h-6 px-2.5", style.className)}>
      {style.label}
    </Badge>
  );
}
