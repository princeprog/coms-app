"use client";

import Link from "next/link";
import { ClipboardCheck, Ellipsis, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shiftHref } from "../constants";
import type { Shift } from "../schemas/shift.schema";

export function ShiftRowActions({
  shift,
  canReview,
}: {
  shift: Shift;
  canReview: boolean;
}) {
  const href = shiftHref(shift.branch_id, shift.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for shift ${shift.shift_number}, ${shift.business_date}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent data-coms-ui="operational" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={href} />}>
            <Eye aria-hidden="true" />
            View shift
          </DropdownMenuItem>
          {canReview && shift.status === "CLOSED" && (
            <DropdownMenuItem render={<Link href={`${href}#review`} />}>
              <ClipboardCheck aria-hidden="true" />
              Review shift
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
