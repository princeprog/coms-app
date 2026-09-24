import type { ReactNode } from "react";
import { AuthQuerySeed } from "@/features/auth/components/auth-query-seed";
import type { User } from "@/features/auth/types/auth.types";

export function AppPageShell({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <>
      <AuthQuerySeed user={user} />
      <div
        data-coms-ui="operational"
        className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6"
      >
        {children}
      </div>
    </>
  );
}
