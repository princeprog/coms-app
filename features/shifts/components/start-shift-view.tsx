"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  LoaderCircle,
  PlayCircle,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectorySelect } from "@/components/shared/directory-select";
import { toast } from "@/components/ui/toast";
import { shiftHref } from "../constants";
import { useCurrentShift } from "../hooks/use-current-shift";
import { useMyShift } from "../hooks/use-my-shift";
import { useRetryKey } from "../hooks/use-retry-key";
import { shiftKeys } from "../query-keys";
import { pesoInputSchema } from "../schemas/shift.schema";
import { openShiftAction } from "../services/shift-actions";
import { focusFirstInvalid } from "../services/focus-invalid";
import { posHref } from "../services/shift-paths";
import { shiftTime } from "../services/shift-time";
import { CashCountField } from "./cash-count-field";
import { ShiftPageFrame } from "./shift-page-frame";

export function StartShiftView({
  branches,
  defaultBranchId,
  returnTo,
}: {
  branches: { id: string; name: string }[];
  defaultBranchId: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const mine = useMyShift();
  const [branchId, setBranchId] = useState(defaultBranchId);
  const register = useCurrentShift(branchId, !mine.data);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const keyFor = useRetryKey();
  const occupied =
    register.data &&
    register.data.opened_by_user_id !== mine.data?.opened_by_user_id
      ? register.data
      : null;
  const branchName =
    branches.find((branch) => branch.id === branchId)?.name ?? "this branch";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = pesoInputSchema.safeParse(amount);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Enter the cash in the drawer",
      );
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setPending(true);
    setError("");
    const result = await openShiftAction(
      branchId,
      parsed.data,
      keyFor(`${branchId}:${parsed.data}`),
    );
    if (!result.ok) {
      setPending(false);
      setError(result.error);
      return;
    }
    await client.invalidateQueries({ queryKey: shiftKeys.all });
    toast.add({
      type: "success",
      title: `Shift ${result.data.shift_number} started`,
    });
    router.push(returnTo ?? posHref(branchId));
  }

  if (mine.isPending)
    return (
      <div
        aria-busy="true"
        aria-label="Checking your shift"
        className="mx-auto w-full max-w-2xl space-y-4 py-6"
      >
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );

  if (mine.data)
    return (
      <ShiftPageFrame
        icon={PlayCircle}
        title="You’re on shift"
        description={`Shift ${mine.data.shift_number} at ${mine.data.branch_name} since ${shiftTime(mine.data.opened_at)}.`}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11 gap-2"
            render={<Link href={posHref(mine.data.branch_id)} />}
          >
            <ShoppingCart data-icon="inline-start" aria-hidden="true" />
            Go to Point of Sale
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            render={<Link href="/shifts/end" />}
          >
            End shift
          </Button>
        </div>
      </ShiftPageFrame>
    );

  return (
    <ShiftPageFrame
      icon={PlayCircle}
      title="Start shift"
      description="Count the cash in the drawer before your first sale."
    >
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
      >
        {branches.length > 1 && (
          <DirectorySelect
            id="start-shift-branch"
            label="Branch"
            alignItemWithTrigger={false}
            className="sm:w-full [&_[data-slot=select-trigger]]:h-11"
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
        {occupied ? (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <p className="font-medium">
              {occupied.opened_by_name} is on the register at {branchName}.
            </p>
            <p className="mt-1">
              Their shift must end before you can start yours.
            </p>
            <Link
              href={shiftHref(branchId, occupied.id)}
              className="mt-2 inline-block font-medium underline underline-offset-4"
            >
              View their shift
            </Link>
          </div>
        ) : (
          <CashCountField
            id="start-shift-cash"
            label="Opening cash"
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setError("");
            }}
            error={error}
            disabled={pending}
            autoFocus
          />
        )}
        <Button
          type="submit"
          size="lg"
          className="min-h-12 w-full gap-2 text-base"
          disabled={pending || Boolean(occupied) || register.isPending}
        >
          {pending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {pending ? "Starting…" : "Start shift"}
        </Button>
      </form>
      <Link
        href={`/shifts?branch=${branchId}`}
        className="self-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        View shift history
      </Link>
    </ShiftPageFrame>
  );
}
