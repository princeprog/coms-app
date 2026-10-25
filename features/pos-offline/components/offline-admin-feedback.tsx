import { Button } from "@/components/ui/button";
import { offlineErrorMessage } from "../hooks/offline-errors";
export function OfflineAdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p role="alert" className="text-sm text-destructive">
        {offlineErrorMessage(error)}
      </p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function OfflineAdminPagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Register pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <span className="text-sm text-muted-foreground">
        {total} records · Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
