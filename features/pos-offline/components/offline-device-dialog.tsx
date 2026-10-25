"use client";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useOfflineAdminMutation,
  useRegisterDevices,
} from "../hooks/use-offline-admin";
import type { RegisterDevice } from "../schemas/offline-admin.schema";
import { OfflineAdminError } from "./offline-admin-feedback";
import { offlineErrorMessage } from "../hooks/offline-errors";

export function OfflineDeviceDialog({
  branchId,
  open,
  onOpenChange,
}: {
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const devices = useRegisterDevices(branchId, open);
  const mutation = useOfflineAdminMutation(branchId);
  const [edit, setEdit] = useState<{
    device: RegisterDevice;
    action: "rename" | "approve" | "revoke";
  } | null>(null);
  const [name, setName] = useState("");
  function select(
    device: RegisterDevice,
    action: "rename" | "approve" | "revoke",
  ) {
    mutation.reset();
    setName(device.name);
    setEdit({ device, action });
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) {
          setEdit(null);
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {edit
              ? `${edit.action === "rename" ? "Rename" : edit.action === "approve" ? "Approve" : "Revoke"} register`
              : "Register devices"}
          </DialogTitle>
          <DialogDescription>
            {edit
              ? edit.action === "revoke"
                ? `Revoke ${edit.device.name}? Further synchronization from this browser will require manager recovery. Saved sales are retained.`
                : `Update ${edit.device.name}.`
              : "Cashiers request approval from their own browser. Approve only a recognized register for this branch."}
          </DialogDescription>
        </DialogHeader>
        {edit ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await mutation.mutateAsync({
                  path: `/devices/${edit.device.id}`,
                  method: "PATCH",
                  body:
                    edit.action === "rename"
                      ? { name: name.trim() }
                      : {
                          status:
                            edit.action === "approve" ? "APPROVED" : "REVOKED",
                        },
                });
                setEdit(null);
              } catch {
                /* Inline feedback preserves draft. */
              }
            }}
          >
            {edit.action === "rename" && (
              <div className="space-y-2">
                <Label htmlFor="device-name">Register name</Label>
                <Input
                  id="device-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={80}
                />
              </div>
            )}
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
                onClick={() => setEdit(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={edit.action === "revoke" ? "destructive" : "default"}
                disabled={mutation.isPending || !name.trim()}
              >
                {mutation.isPending
                  ? "Saving…"
                  : edit.action === "rename"
                    ? "Save name"
                    : edit.action === "approve"
                      ? "Approve register"
                      : "Revoke register"}
              </Button>
            </DialogFooter>
          </form>
        ) : devices.isPending ? (
          <div
            role="status"
            aria-label="Loading register devices"
            className="h-40 animate-pulse rounded bg-muted"
          />
        ) : devices.error ? (
          <OfflineAdminError
            error={devices.error}
            retry={() => void devices.refetch()}
          />
        ) : !devices.data?.length ? (
          <p className="py-6 text-sm text-muted-foreground">
            No browser requests yet. Ask the cashier to select Register this
            browser in Point of Sale.
          </p>
        ) : (
          <Table
            containerProps={{
              role: "region",
              "aria-label": "Register devices",
              tabIndex: 0,
              className: "max-h-96",
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Register</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.data.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${device.status === "APPROVED" ? "bg-green-700" : device.status === "REVOKED" ? "bg-red-700" : "bg-slate-700"} text-white`}
                    >
                      {device.status === "APPROVED"
                        ? "Approved"
                        : device.status === "REVOKED"
                          ? "Revoked"
                          : "Pending approval"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Actions for ${device.name}`}
                          />
                        }
                      >
                        <MoreVertical aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => select(device, "rename")}
                        >
                          Rename
                        </DropdownMenuItem>
                        {device.status !== "APPROVED" && (
                          <DropdownMenuItem
                            onClick={() => select(device, "approve")}
                          >
                            Approve
                          </DropdownMenuItem>
                        )}
                        {device.status !== "REVOKED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => select(device, "revoke")}
                          >
                            Revoke
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
