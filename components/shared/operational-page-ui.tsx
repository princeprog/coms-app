import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function OperationalPageIntro({
  description,
  count,
  actions,
}: {
  description: string;
  count?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      {(count || actions) && (
        <div className="flex flex-wrap items-center gap-3">
          {count}
          {actions}
        </div>
      )}
    </section>
  );
}

export function OperationalEmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <Empty className="rounded-lg border border-dashed bg-background p-8">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actions && <EmptyContent>{actions}</EmptyContent>}
    </Empty>
  );
}

export function OperationalPagination({
  ariaLabel,
  page,
  pageCount,
  previousHref,
  nextHref,
  resultSummary,
}: {
  ariaLabel: string;
  page: number;
  pageCount: number;
  previousHref?: string;
  nextHref?: string;
  resultSummary?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      {previousHref ? (
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={previousHref}
        >
          Previous page
        </Link>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled>
          Previous page
        </Button>
      )}
      <span aria-live="polite" className="text-sm text-muted-foreground">
        {resultSummary ?? `Page ${page} of ${pageCount}`}
      </span>
      {nextHref ? (
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={nextHref}
        >
          Next page
        </Link>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled>
          Next page
        </Button>
      )}
    </nav>
  );
}

export function OperationalStatusBadge({
  variant,
  children,
  ...props
}: ComponentProps<typeof Badge>) {
  return (
    <Badge variant={variant} {...props}>
      {children}
    </Badge>
  );
}
