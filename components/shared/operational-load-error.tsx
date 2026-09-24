"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OperationalLoadError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <section
      role="alert"
      aria-labelledby="operational-load-error-title"
      className="flex flex-col items-start gap-3 rounded-lg border bg-card p-5"
    >
      <h2 id="operational-load-error-title" className="text-base font-semibold">
        Unable to load {title.toLowerCase()}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => router.refresh()}
      >
        Retry
      </Button>
    </section>
  );
}
