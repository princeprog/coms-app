import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Shift } from "../schemas/shift.schema";

const styles: Record<Shift["status"], { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-700 text-white" },
  CLOSED: { label: "Needs review", className: "bg-amber-700 text-white" },
  REVIEWED: { label: "Reviewed", className: "bg-emerald-700 text-white" },
};

export function ShiftStatusBadge({ status }: { status: Shift["status"] }) {
  const style = styles[status];
  return (
    <Badge className={cn("h-auto min-h-6 px-2.5", style.className)}>
      {style.label}
    </Badge>
  );
}

export const shiftStatusLabel = (status: Shift["status"]) =>
  styles[status].label;
