"use client";

import { LogOutIcon } from "lucide-react";

import { useLogout } from "@/features/auth/hooks/mutations/use-logout";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  const logoutMutation = useLogout();

  return (
    <DropdownMenuItem
      disabled={logoutMutation.isPending}
      aria-busy={logoutMutation.isPending}
      aria-label={
        logoutMutation.isPending
          ? "Signing out…"
          : logoutMutation.error
            ? "Sign out failed. Try again."
            : "Log out"
      }
      closeOnClick={false}
      onClick={() => logoutMutation.mutate()}
    >
      <LogOutIcon aria-hidden="true" />
      {logoutMutation.isPending ? (
        "Signing out…"
      ) : logoutMutation.error ? (
        <span role="alert">Sign out failed. Try again.</span>
      ) : (
        "Log out"
      )}
    </DropdownMenuItem>
  );
}
