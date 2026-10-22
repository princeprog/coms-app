"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useQuickCreateDialog } from "@/components/layout/use-quick-create-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import { createDailyReportSchema } from "@/features/daily-reports/schemas/daily-report.schema";
import { createDailyReportHref } from "@/features/daily-reports/services/daily-report-page-params";
import type { DailyReportCreateAction } from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCreateDiscardConfirmation } from "./daily-report-create-discard-confirmation";

export function DailyReportCreateForm({
  branches,
  defaultBranchId,
  todayManila,
  action,
}: {
  branches: BranchProductBranchOption[];
  defaultBranchId: string;
  todayManila: string;
  action: DailyReportCreateAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [businessDate, setBusinessDate] = useState(todayManila);
  const { open, openDialog, closeDialog } = useQuickCreateDialog();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dirty = businessDate !== todayManila || branchId !== defaultBranchId;

  function resetDraft() {
    setBusinessDate(todayManila);
    setBranchId(defaultBranchId);
    setError("");
  }

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    closeDialog();
  }

  async function createReport(event: FormEvent<HTMLFormElement>) {
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
      retry.current = { fingerprint, key: globalThis.crypto.randomUUID() };
    }

    setPending(true);
    try {
      const result = await action(branchId, parsed.data, retry.current.key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      retry.current = null;
      closeDialog();
      router.replace(
        createDailyReportHref({
          reportId: result.report.id,
          reportBranchId: branchId,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setError("");
          openDialog();
        } else requestClose();
      }}
    >
      <DialogTrigger render={<Button type="button" />}>
        Create report
      </DialogTrigger>
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Create daily report</DialogTitle>
          <DialogDescription>
            Choose the branch business date to snapshot stock movements and
            create a draft count.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={createReport} className="grid gap-5">
          <FieldGroup>
            {branches.length > 1 && (
              <DirectorySelect
                id="daily-report-create-branch"
                label="Branch"
                alignItemWithTrigger={false}
                value={branchId}
                options={branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                  icon: <Building2 className="text-sky-600" />,
                }))}
                onChange={(value) => {
                  setBranchId(value);
                  setError("");
                }}
              />
            )}
            <Field>
              <FieldLabel htmlFor="daily-report-business-date">
                Business date
              </FieldLabel>
              <Input
                id="daily-report-business-date"
                type="date"
                max={todayManila}
                required
                value={businessDate}
                disabled={pending}
                aria-invalid={Boolean(error)}
                aria-describedby="daily-report-business-date-hint"
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
              <FieldDescription id="daily-report-business-date-hint">
                Dates follow the Asia/Manila business day. Future reports cannot
                be created.
              </FieldDescription>
            </Field>
          </FieldGroup>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !businessDate}>
              {pending ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
        <DailyReportCreateDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            closeDialog();
            resetDraft();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
