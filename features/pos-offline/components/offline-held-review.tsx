"use client";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatProductPrice } from "@/lib/format-currency";
import {
  useHeldTransactions,
  useOfflineAdminMutation,
} from "../hooks/use-offline-admin";
import {
  OfflineAdminError,
  OfflineAdminPagination,
} from "./offline-admin-feedback";
import { offlineErrorMessage } from "../hooks/offline-errors";
import type {
  HeldTransaction,
  RegisterSession,
} from "../schemas/offline-admin.schema";

export function OfflineHeldReview({
  branchId,
  session,
}: {
  branchId: string;
  session: RegisterSession;
}) {
  const [page, setPage] = useState(1);
  const query = useHeldTransactions(branchId, session.id, page);
  const mutation = useOfflineAdminMutation(branchId);
  const [selected, setSelected] = useState<HeldTransaction | null>(null);
  const [reason, setReason] = useState("");
  return (
    <section className="space-y-4" aria-labelledby="held-sales-heading">
      <div>
        <h2 id="held-sales-heading" className="text-lg font-semibold">
          Held sales · {session.device_name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {session.cashier_name} · {session.business_date}. Review retries the
          saved sale without changing its contents or cashier.
        </p>
      </div>
      {query.isPending ? (
        <div
          role="status"
          aria-label="Loading held sales"
          className="h-40 animate-pulse rounded bg-muted"
        />
      ) : query.error ? (
        <OfflineAdminError
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          {!query.data?.items.length ? (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              No held sales on this page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason held</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      Saved sale {item.sequence}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.payload.captured_at).toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatProductPrice(item.payload.total_amount)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {item.reason ?? "Needs review"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Actions for saved sale ${item.sequence}`}
                            />
                          }
                        >
                          <MoreVertical aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              mutation.reset();
                              setSelected(item);
                              setReason("");
                            }}
                          >
                            Review and retry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {query.data && (
            <OfflineAdminPagination
              page={query.data.page}
              total={query.data.total}
              pageSize={query.data.page_size}
              onPage={setPage}
            />
          )}
        </>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review saved sale {selected?.sequence}</DialogTitle>
            <DialogDescription>
              {session.cashier_name} ·{" "}
              {selected
                ? formatProductPrice(selected.payload.total_amount)
                : ""}
              . Retry the unchanged sale after resolving the hold. COMS rechecks
              the original shift and report.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!selected) return;
              try {
                await mutation.mutateAsync({
                  path: `/sessions/${session.id}/review`,
                  body: { transaction_id: selected.id, reason: reason.trim() },
                });
                setSelected(null);
              } catch {
                /* Preserve the reason. */
              }
            }}
          >
            <p className="text-sm">{selected?.reason}</p>
            <div className="space-y-2">
              <Label htmlFor="held-review-reason">Review reason</Label>
              <Textarea
                id="held-review-reason"
                required
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            {mutation.error && (
              <p role="alert" className="text-sm text-destructive">
                {offlineErrorMessage(mutation.error)}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || reason.trim().length < 3}
              >
                {mutation.isPending ? "Retrying…" : "Retry saved sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
