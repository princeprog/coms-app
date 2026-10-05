import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CatalogRecordStatus({ active }: { active: boolean }) {
  return (
    <Badge
      className={cn(
        "h-auto min-h-5 text-white",
        active ? "bg-emerald-700" : "bg-red-700",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
