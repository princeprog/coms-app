import { Badge } from "@/components/ui/badge";
export function ReceivingStatusBadge({ status }: { status?: string }) {
  if (!status || status === "NONE" || status === "COUNTED") return null;
  const label =
    status === "OVERDUE"
      ? "Overdue"
      : status === "REVIEW"
        ? "Late count under review"
        : "Awaiting count";
  return (
    <Badge
      className={
        "h-auto max-w-full whitespace-normal text-center " +
        (status === "OVERDUE"
          ? "bg-red-700 text-white"
          : status === "REVIEW"
            ? "bg-violet-700 text-white"
            : "bg-amber-700 text-white")
      }
    >
      {label}
    </Badge>
  );
}
