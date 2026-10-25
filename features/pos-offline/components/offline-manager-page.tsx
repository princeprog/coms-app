"use client";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useRegisterSessions } from "../hooks/use-offline-admin";
import type { RegisterSession } from "../schemas/offline-admin.schema";
import {
  OfflineAdminError,
  OfflineAdminPagination,
} from "./offline-admin-feedback";
import { OfflineDeviceDialog } from "./offline-device-dialog";
import { OfflineHeldReview } from "./offline-held-review";
import { OfflineRecoveryPanel } from "./offline-recovery-panel";

export function OfflineManagerPage({
  branchId,
  canManageDevices,
  canReview,
}: {
  branchId: string;
  canManageDevices: boolean;
  canReview: boolean;
}) {
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RegisterSession | null>(null);
  const sessions = useRegisterSessions(branchId, page, canReview);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <a href="/branches" className="text-sm underline">
            Branches
          </a>
          <h1 className="text-2xl font-semibold">Offline registers</h1>
          <p className="text-sm text-muted-foreground">
            Manage this branch’s approved browsers, held sales and original
            device recovery files.
          </p>
        </div>
        {canManageDevices && (
          <Button variant="outline" onClick={() => setDevicesOpen(true)}>
            Register devices
          </Button>
        )}
      </header>
      {canReview && (
        <>
          <section
            className="space-y-4"
            aria-labelledby="prepared-registers-heading"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="prepared-registers-heading"
                className="text-lg font-semibold"
              >
                Open prepared registers
              </h2>
              <Button
                variant="outline"
                size="sm"
                disabled={sessions.isFetching}
                onClick={() => void sessions.refetch()}
              >
                Refresh
              </Button>
            </div>
            {sessions.isPending ? (
              <div
                role="status"
                aria-label="Loading prepared registers"
                className="h-40 animate-pulse rounded bg-muted"
              />
            ) : sessions.error ? (
              <OfflineAdminError
                error={sessions.error}
                retry={() => void sessions.refetch()}
              />
            ) : (
              <>
                {!sessions.data?.items.length ? (
                  <p className="rounded-lg border p-6 text-sm text-muted-foreground">
                    No open prepared registers on this page.
                  </p>
                ) : (
                  <Table
                    containerProps={{
                      role: "region",
                      "aria-label": "Open prepared registers",
                      tabIndex: 0,
                    }}
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead>Register / cashier</TableHead>
                        <TableHead>Business date</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Last sync</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.data.items.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {session.device_name}
                            <p className="text-xs text-muted-foreground">
                              {session.cashier_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            {session.business_date.slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${session.review_count ? "bg-amber-800" : "bg-slate-700"} text-white`}
                            >
                              {session.review_count
                                ? `${session.review_count} held`
                                : "No held sales"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.last_sync_at
                              ? new Date(session.last_sync_at).toLocaleString()
                              : "Not yet synced"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Actions for ${session.device_name}`}
                                  />
                                }
                              >
                                <MoreVertical aria-hidden />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => setSelected(session)}
                                >
                                  Review held sales
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {sessions.data && (
                  <OfflineAdminPagination
                    page={sessions.data.page}
                    total={sessions.data.total}
                    pageSize={sessions.data.page_size}
                    onPage={setPage}
                  />
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Sales not yet sent by a device are unavailable to the server. Ask
              the cashier to sync or export its complete recovery file.
            </p>
          </section>
          {selected && (
            <OfflineHeldReview
              key={selected.id}
              branchId={branchId}
              session={selected}
            />
          )}
          <OfflineRecoveryPanel branchId={branchId} />
        </>
      )}
      {canManageDevices && (
        <OfflineDeviceDialog
          branchId={branchId}
          open={devicesOpen}
          onOpenChange={setDevicesOpen}
        />
      )}
    </div>
  );
}
