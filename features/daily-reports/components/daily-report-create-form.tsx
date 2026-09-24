"use client";

import type { DailyReportCreateAction } from "@/features/daily-reports/types/daily-report.types";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDailyReportSchema } from "@/features/daily-reports/schemas/daily-report.schema";
import { createDailyReportHref } from "@/features/daily-reports/services/daily-report-page-params";

export function DailyReportCreateForm({
  branchId,
  todayManila,
  action,
}: {
  branchId: string;
  todayManila: string;
  action: DailyReportCreateAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [businessDate, setBusinessDate] = useState(todayManila);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function createReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = createDailyReportSchema.safeParse({
      business_date: businessDate,
    });
    if (!parsed.success) {
      setError("Choose a valid business date.");
      return;
    }
    if (parsed.data.business_date > todayManila) {
      setError("A report cannot be created for a future Manila business date.");
      return;
    }

    const fingerprint = `${branchId}:${parsed.data.business_date}`;
    if (retry.current?.fingerprint !== fingerprint) {
      retry.current = {
        fingerprint,
        key: globalThis.crypto.randomUUID(),
      };
    }

    setPending(true);
    try {
      const result = await action(branchId, parsed.data, retry.current.key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      retry.current = null;
      router.replace(
        createDailyReportHref({
          branchId,
          reportId: result.report.id,
          status: "all",
          page: 1,
        }),
      );
      router.refresh();
    } catch {
      setError("COMS could not create the draft. Keep the date and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={createReport}
      aria-label="Create daily report"
      className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="daily-report-business-date"
          className="text-sm font-medium"
        >
          Business date
        </label>
        <Input
          id="daily-report-business-date"
          type="date"
          max={todayManila}
          required
          value={businessDate}
          disabled={pending}
          onChange={(event) => {
            const nextDate = event.target.value;
            setBusinessDate(nextDate);
            setError(
              nextDate > todayManila
                ? "A report cannot be created for a future Manila business date."
                : "",
            );
          }}
        />
        <p className="text-xs text-muted-foreground">
          Dates follow the Asia/Manila business day.
        </p>
      </div>
      <Button type="submit" disabled={pending || !businessDate}>
        {pending ? "Creating…" : "Create draft"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      )}
    </form>
  );
}
