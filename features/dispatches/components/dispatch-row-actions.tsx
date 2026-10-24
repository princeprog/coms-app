"use client";
import { DispatchCountReminder } from "./dispatch-count-reminder";
import type { DispatchListItem } from "../types/dispatch.types";
import Link from "next/link";
import { Ellipsis, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function DispatchRowActions({
  id,
  branchName,
  dispatch,
  canRemind = false,
}: {
  id: string;
  branchName: string;
  dispatch?: DispatchListItem;
  canRemind?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${branchName} dispatch`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-coms-ui="operational">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={`/dispatches/${id}`} />}>
            <Eye aria-hidden="true" />
            View dispatch
          </DropdownMenuItem>
          {dispatch && (
            <DispatchCountReminder
              dispatch={dispatch}
              allowed={canRemind}
              menu
            />
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
