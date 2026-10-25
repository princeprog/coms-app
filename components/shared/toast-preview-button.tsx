"use client";

import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function ToastPreviewButton() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-2"
      aria-label="Test toast"
      title="Test toast (development only)"
      onClick={() =>
        toast.add({
          type: "success",
          title: "Test notification",
          description: "This is how notifications appear in COMS.",
        })
      }
    >
      <FlaskConical className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Test toast</span>
    </Button>
  );
}
