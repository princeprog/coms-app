import Link from "next/link";
import {
  createSalesHref,
  type SalesPageFilters,
} from "@/features/sales/services/sales-page-params";

export function SalesPageLink({
  filters,
  label,
}: {
  filters: SalesPageFilters;
  label: string;
}) {
  return (
    <Link
      className="rounded-3xl border px-4 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30"
      href={createSalesHref(filters)}
    >
      {label}
    </Link>
  );
}
