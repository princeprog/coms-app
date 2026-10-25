"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ArrowLeft, Compass, House } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// One-time entrance: each block rises in with a short stagger. Reduced
// motion keeps the fade and drops the movement.
const enter =
  "animate-in fill-mode-both duration-400 ease-out-quint fade-in-0 motion-safe:slide-in-from-bottom-2";
const press =
  "transition-[scale,background-color,color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

const noSubscription = () => () => {};

/**
 * The address in the browser bar. The server renders the root 404 as an
 * internal route, so read it only on the client to keep hydration in sync.
 */
function useRequestedPath() {
  return useSyncExternalStore(
    noSubscription,
    () => window.location.pathname,
    () => null,
  );
}

type NotFoundStateProps = {
  /** "page" fills the screen with branding; "inline" sits inside the app shell. */
  variant?: "page" | "inline";
  description?: string;
};

export function NotFoundState({
  variant = "page",
  description = "The page you're looking for doesn't exist or may have moved.",
}: NotFoundStateProps) {
  const pathname = useRequestedPath();
  const page = variant === "page";
  const Heading = page ? "h1" : "h2";
  // The app shell already provides <main>.
  const Root = page ? "main" : "section";

  // Leave with full page loads: Next.js 16.1 crashes when the client router
  // navigates away from a notFound() page rendered inside the app shell.
  function goBack() {
    // A fresh tab has nothing to return to, so fall back to home.
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  }

  return (
    <Root
      aria-labelledby="not-found-title"
      className={cn(
        "relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center",
        page ? "min-h-svh bg-background py-12" : "m-4 rounded-xl border py-16",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
      />
      {page && (
        // eslint-disable-next-line @next/next/no-html-link-for-pages -- full load avoids the Next.js 16.1 not-found navigation crash
        <a
          href="/"
          aria-label="Emma's Chicken House home"
          className={cn(
            "mb-12 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            enter,
          )}
        >
          <Image
            src="/images/emmas%20chicken%20house%20logo.png"
            alt=""
            width={390}
            height={170}
            priority
            className="h-auto w-40 object-contain"
          />
        </a>
      )}

      <div className="flex max-w-md flex-col items-center">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-12 items-center justify-center rounded-xl border bg-card text-primary shadow-sm",
            enter,
          )}
        >
          <Compass className="size-5" />
        </div>
        <p
          className={cn(
            "mt-6 text-xs font-semibold tracking-[0.2em] text-primary uppercase delay-50",
            enter,
          )}
        >
          Error 404
        </p>
        <Heading
          id="not-found-title"
          className={cn(
            "mt-2 font-heading font-semibold tracking-tight text-balance delay-100",
            page ? "text-3xl sm:text-4xl" : "text-2xl",
            enter,
          )}
        >
          Page not found
        </Heading>
        <p
          className={cn(
            "mt-3 text-sm text-balance text-muted-foreground delay-150 sm:text-base",
            enter,
          )}
        >
          {description}
        </p>
        {pathname && pathname !== "/" && (
          <p
            className={cn(
              "mt-4 max-w-full truncate rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground delay-150",
              enter,
            )}
          >
            <span className="sr-only">Requested address: </span>
            {pathname}
          </p>
        )}
        <div
          className={cn(
            "mt-8 flex flex-col-reverse gap-2 self-stretch delay-200 sm:flex-row sm:justify-center sm:self-auto",
            enter,
          )}
        >
          <Button
            variant="outline"
            size="lg"
            className={cn("px-4", press)}
            onClick={goBack}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Go back
          </Button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full load avoids the Next.js 16.1 not-found navigation crash */}
          <a
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "px-4", press)}
          >
            <House data-icon="inline-start" aria-hidden="true" />
            Return home
          </a>
        </div>
      </div>
    </Root>
  );
}
