import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  active: "bg-emerald-700",
  inactive: "bg-red-700",
  unavailable: "bg-slate-600",
  pending: "bg-amber-800",
  approved: "bg-emerald-700",
  rejected: "bg-red-700",
  cancelled: "bg-slate-600",
};

export function MenuStatusBadge({
  status,
  children,
  className,
}: {
  status: keyof typeof statusStyles;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "h-auto min-h-5 w-fit text-white",
        statusStyles[status],
        className,
      )}
    >
      {children}
    </Badge>
  );
}
