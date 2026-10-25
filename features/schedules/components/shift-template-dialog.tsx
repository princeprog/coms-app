"use client";

import { useState, type FormEvent } from "react";
import { Clock3, Info, LoaderCircle, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DirectorySelect } from "@/components/shared/directory-select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  shiftTemplateFormSchema,
  type ShiftTemplate,
} from "../schemas/schedule.schema";
import { saveShiftTemplateAction } from "../services/schedule-actions";
import {
  WEEKDAYS,
  clockLabel,
  crossesDayStart,
  halfHourOptions,
  lengthLabel,
  shiftLength,
} from "../services/schedule-format";
import { FormAlert, ScheduleDialogShell } from "./schedule-dialog-shell";

type Errors = Partial<
  Record<"name" | "start_time" | "end_time" | "weekdays" | "form", string>
>;

const timeOptions = halfHourOptions.map((option) => ({
  ...option,
  icon: <Clock3 className="text-sky-600" />,
}));
const selectSize =
  "w-full sm:w-full [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3";

export function ShiftTemplateDialog({
  branchId,
  template,
  dayStartTimes,
  onClose,
  onSaved,
}: {
  branchId: string;
  template?: ShiftTemplate;
  /** Current business-day start, then any scheduled one. */
  dayStartTimes: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [start, setStart] = useState(template?.start_time ?? "06:00");
  const [end, setEnd] = useState(template?.end_time ?? "14:00");
  const [weekdays, setWeekdays] = useState<number[]>(
    template?.weekdays ?? WEEKDAYS.map((day) => day.value),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const crossed = dayStartTimes.find((dayStart) =>
    crossesDayStart(start, end, dayStart),
  );
  const passesMidnight =
    start !== end && shiftLength(start, end) > 0 && end <= start;

  function toggleDay(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
    setErrors((current) => ({ ...current, weekdays: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = shiftTemplateFormSchema.safeParse({
      name,
      start_time: start,
      end_time: end,
      weekdays,
    });
    if (!parsed.success || crossed) {
      const next: Errors = {};
      for (const issue of parsed.success ? [] : parsed.error.issues)
        next[issue.path[0] as keyof Errors] ??= issue.message;
      if (crossed)
        next.end_time ??= `Shifts can't run past the business day start (${clockLabel(crossed)}).`;
      setErrors(next);
      return;
    }
    setPending(true);
    setErrors({});
    const result = await saveShiftTemplateAction(
      branchId,
      parsed.data,
      template ? { id: template.id, revision: template.revision } : undefined,
    );
    setPending(false);
    if (!result.ok) {
      setErrors(
        result.code === "SHIFT_NAME_TAKEN"
          ? { name: result.error }
          : { form: result.error },
      );
      return;
    }
    toast.add({
      type: "success",
      title: template
        ? `${result.data.name} updated`
        : `${result.data.name} added`,
    });
    onSaved();
  }

  return (
    <ScheduleDialogShell
      title={template ? "Edit shift" : "Add shift"}
      description="Set the hours and the days this shift runs."
      pending={pending}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-h-11 gap-2" disabled={pending}>
            {pending && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            {template ? "Save shift" : "Add shift"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="shift-template-name">Shift name</FieldLabel>
          <Input
            id="shift-template-name"
            className="h-11"
            maxLength={40}
            placeholder="e.g. Morning, Closing, Night"
            value={name}
            autoFocus
            disabled={pending}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name ? "shift-template-name-error" : undefined
            }
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          {errors.name && (
            <FieldError id="shift-template-name-error">
              {errors.name}
            </FieldError>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <DirectorySelect
            id="shift-template-start"
            label="Starts"
            alignItemWithTrigger={false}
            className={selectSize}
            value={start}
            options={timeOptions}
            onChange={(value) => {
              setStart(value);
              setErrors((current) => ({ ...current, end_time: undefined }));
            }}
          />
          <DirectorySelect
            id="shift-template-end"
            label="Ends"
            alignItemWithTrigger={false}
            className={selectSize}
            value={end}
            options={timeOptions}
            onChange={(value) => {
              setEnd(value);
              setErrors((current) => ({ ...current, end_time: undefined }));
            }}
          />
        </div>
        {start !== end && (
          <p className="-mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            {passesMidnight && (
              <Moon aria-hidden="true" className="size-4 text-indigo-600" />
            )}
            {lengthLabel(start, end)}
            {passesMidnight && " · ends the next day"}
          </p>
        )}
        {(errors.end_time || crossed) && (
          <p
            role="alert"
            className="-mt-2 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {crossed
                ? `This shift runs past the business day start (${clockLabel(crossed)}). End it at ${clockLabel(crossed)} and add another shift for the rest, or ask Super Admin to change the business day start.`
                : errors.end_time}
            </span>
          </p>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Runs on</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => {
              const selected = weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={day.long}
                  disabled={pending}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-[background-color,color,border-color,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-97 motion-reduce:active:scale-100",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-sm">
            {[
              { label: "Every day", days: [1, 2, 3, 4, 5, 6, 7] },
              { label: "Mon – Fri", days: [1, 2, 3, 4, 5] },
              { label: "Weekends", days: [6, 7] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={pending}
                className="rounded text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => {
                  setWeekdays(preset.days);
                  setErrors((current) => ({ ...current, weekdays: undefined }));
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {errors.weekdays && <FieldError>{errors.weekdays}</FieldError>}
        </fieldset>
        <FormAlert message={errors.form} />
      </div>
    </ScheduleDialogShell>
  );
}
