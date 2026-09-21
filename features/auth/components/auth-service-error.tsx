"use client";

import { Button } from "@/components/ui/button";

export function AuthServiceError({
  context,
}: {
  context: "login" | "dashboard";
}) {
  const description =
    context === "login"
      ? "The sign-in service is temporarily unavailable."
      : "We could not verify your session right now.";

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Temporarily unavailable</h1>
        <p className="text-sm text-muted-foreground">
          {description} Try again in a moment.
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </section>
    </main>
  );
}
