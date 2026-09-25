import type { ReactNode } from "react";
import { AuthQuerySeed } from "@/features/auth/components/auth-query-seed";
import type { User } from "@/features/auth/types/auth.types";

export function AppPageShell({
  user,
  children,
  fillViewport = false,
}: {
  user: User;
  children: ReactNode;
  fillViewport?: boolean;
}) {
  return (
    <>
      <AuthQuerySeed user={user} />
      <div
        data-coms-ui="operational"
        className={`@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 ${
          fillViewport
            ? "h-[calc(100dvh-var(--header-height))] min-h-0 flex-none overflow-hidden md:h-[calc(100dvh-var(--header-height)-1rem)]"
            : "flex-1"
        }`}
      >
        {children}
      </div>
    </>
  );
}
