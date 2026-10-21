"use client";

import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { ExportKind } from "../export-targets";

type ExportParams = Record<string, string | boolean | null | undefined>;

function filenameFrom(disposition: string | null) {
  return /filename="([^"]+)"/.exec(disposition ?? "")?.[1] ?? "coms-export.csv";
}

/** Downloads every row matching the given filters as a CSV file. */
export function ExportCsvButton({
  kind,
  params,
  label = "Export CSV",
  icon = <Download data-icon="inline-start" aria-hidden="true" />,
  className,
}: {
  kind: ExportKind;
  params?: ExportParams;
  label?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  async function download() {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {}))
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== false
      )
        query.set(key, String(value));
    setPending(true);
    try {
      const response = await fetch(
        `/api/exports/${kind}${query.size ? `?${query}` : ""}`,
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        toast.add({
          type: "error",
          title: body?.message ?? "The export could not be created.",
        });
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(response.headers.get("content-disposition"));
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.add({
        type: "error",
        title: "COMS could not reach the server. Try again.",
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={download}
    >
      {pending ? <Spinner data-icon="inline-start" aria-hidden="true" /> : icon}
      {pending ? "Exporting…" : label}
    </Button>
  );
}
