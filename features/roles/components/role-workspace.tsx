import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function RoleWorkspace({
  title,
  description,
  onBack,
  pending,
  children,
}: {
  title: string;
  description: string;
  onBack: () => void;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-role-workspace
      className="flex h-full min-h-0 flex-col gap-3 lg:gap-4"
    >
      <header className="grid shrink-0 gap-2">
        <Link
          href="/roles"
          aria-disabled={pending}
          className="flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={(event) => {
            event.preventDefault();
            if (!pending) onBack();
          }}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to roles
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h2>
          <p
            data-role-compact-description
            className="text-sm text-muted-foreground md:text-base"
          >
            {description}
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}

export function RoleWorkspaceGrid({ children }: { children: ReactNode }) {
  return (
    <div
      data-role-workspace-grid
      className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-3 lg:grid-rows-1 lg:gap-5"
    >
      {children}
    </div>
  );
}

export function RoleWorkspaceFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      data-role-workspace-footer
      className={`flex shrink-0 flex-wrap items-center gap-3 border-t pt-4 ${className}`}
    >
      {children}
    </footer>
  );
}
