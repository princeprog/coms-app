"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CatalogLoadError({ title }: { title: string }) {
  const router = useRouter();
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <CardTitle>Unable to load {title.toLowerCase()}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p role="alert" className="text-sm text-muted-foreground">
          COMS could not load {title.toLowerCase()}. Try refreshing this page in
          a moment.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
