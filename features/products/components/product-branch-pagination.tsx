"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductBranchPagination({
  page,
  pages,
  total,
  disabled,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  disabled: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Branch choices pagination"
      className="flex items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages} · {total} branches
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous branches"
          disabled={disabled || page === 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next branches"
          disabled={disabled || page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
