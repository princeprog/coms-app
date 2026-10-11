import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function dispatchStatusLabel(status: string) {
  const label = status.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
const styles: Record<string, string> = {
  DRAFT: "bg-slate-600",
  IN_TRANSIT: "bg-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-800",
  RECEIVED: "bg-emerald-700",
  CLOSED_WITH_SHORTAGE: "bg-red-700",
  OPEN: "bg-red-700",
  RECOUNT_REQUESTED: "bg-amber-800",
  RESOLVED: "bg-emerald-700",
};
export function DispatchStatusBadge({
  status,
  label,
  size = "default",
}: {
  status: string;
  label?: string;
  size?: "default" | "lg";
}) {
  return (
    <Badge
      className={cn(
        "h-auto min-h-5 max-w-full text-center whitespace-normal text-white",
        styles[status] ?? "bg-slate-600",
        size === "lg" && "min-h-8 px-3 text-sm",
      )}
    >
      {label ?? dispatchStatusLabel(status)}
    </Badge>
  );
}
