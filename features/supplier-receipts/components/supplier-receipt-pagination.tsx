import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { createSupplierReceiptHref } from "@/features/supplier-receipts/services/supplier-receipt-page-params";

export function SupplierReceiptPagination({
  page,
  pageCount,
  search,
  status,
}: {
  page: number;
  pageCount: number;
  search: string;
  status: "all" | "DRAFT" | "POSTED";
}) {
  return (
    <nav
      aria-label="Supplier receipt pages"
      className="flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createSupplierReceiptHref({ page: page - 1, search, status })}
        >
          Previous page
        </Link>
      ) : (
        <Button type="button" variant="outline" disabled>
          Previous page
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createSupplierReceiptHref({ page: page + 1, search, status })}
        >
          Next page
        </Link>
      ) : (
        <Button type="button" variant="outline" disabled>
          Next page
        </Button>
      )}
    </nav>
  );
}
