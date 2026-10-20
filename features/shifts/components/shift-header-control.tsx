"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronDown,
  Eye,
  LockKeyhole,
  PlayCircle,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { shiftHref } from "../constants";
import { useMyShift } from "../hooks/use-my-shift";
import { posHref } from "../services/shift-paths";
import { shiftTime } from "../services/shift-time";
import { CashMovementDialog } from "./cash-movement-dialog";

/** Header control: start a shift, or manage the one you are on, from any page. */
export function ShiftHeaderControl() {
  const mine = useMyShift();
  const [cashOpen, setCashOpen] = useState(false);
  if (mine.isPending || mine.isError) return null;
  const shift = mine.data;
  if (!shift)
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2"
        render={<Link href="/shifts/start" />}
      >
        <PlayCircle
          data-icon="inline-start"
          aria-hidden="true"
          className="text-emerald-600"
        />
        Start shift
      </Button>
    );
  const ended = shift.business_day_ended;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2",
                ended &&
                  "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
              )}
              aria-label={`Shift ${shift.shift_number} at ${shift.branch_name}${ended ? ", business day ended" : ""}`}
            />
          }
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              ended ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
          <span className="max-sm:hidden">Shift {shift.shift_number}</span>
          <span className="text-muted-foreground max-md:hidden">
            · {shift.branch_name}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-coms-ui="operational"
          align="end"
          className="min-w-64"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="text-sm font-medium text-foreground">
                Shift {shift.shift_number} · {shift.branch_name}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {ended
                  ? "Business day ended. End this shift to keep selling."
                  : `On shift since ${shiftTime(shift.opened_at)}`}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={posHref(shift.branch_id)} />}>
              <ShoppingCart aria-hidden="true" />
              Point of Sale
            </DropdownMenuItem>
            {!ended && (
              <DropdownMenuItem onClick={() => setCashOpen(true)}>
                <ArrowLeftRight aria-hidden="true" />
                Cash in / out
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              render={<Link href={shiftHref(shift.branch_id, shift.id)} />}
            >
              <Eye aria-hidden="true" />
              View shift
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/shifts/end" />}>
              <LockKeyhole aria-hidden="true" className="text-red-600" />
              End shift
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {cashOpen && (
        <CashMovementDialog
          branchId={shift.branch_id}
          shiftId={shift.id}
          onClose={() => setCashOpen(false)}
          onRecorded={() => {
            setCashOpen(false);
            void mine.refresh();
          }}
        />
      )}
    </>
  );
}
