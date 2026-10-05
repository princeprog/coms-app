"use client";
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
}: {
  id: string;
  branchName: string;
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
