import type { ReactNode } from "react";

export function BranchMenuHeader({
  canManage,
  actions,
}: {
  canManage: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Branch Menu
        </h2>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Manage the products available at each branch."
            : "View the products available at your branches."}
        </p>
      </div>
      {actions}
    </header>
  );
}
