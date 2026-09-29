import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { createSupplierReceiptHref } from "@/features/supplier-receipts/services/supplier-receipt-page-params";

export function SupplierReceiptPagination({
  page,
  pageCount,
  search,
}: {
  page: number;
  pageCount: number;
  search: string;
}) {
  return (
    <nav
      aria-label="Supplier delivery pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createSupplierReceiptHref({ page: page - 1, search })}
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
          href={createSupplierReceiptHref({ page: page + 1, search })}
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
