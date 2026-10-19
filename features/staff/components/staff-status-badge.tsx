import { Badge } from "@/components/ui/badge";

export function StaffStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={
        active
          ? "border-transparent bg-emerald-700 text-white"
          : "border-transparent bg-red-700 text-white"
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
