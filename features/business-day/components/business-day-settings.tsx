"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock, LoaderCircle, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { DirectorySelect } from "@/components/shared/directory-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import type { BusinessDay } from "../schemas/business-day.schema";
import {
  cancelScheduledBusinessDayAction,
  scheduleBusinessDayAction,
} from "../services/business-day-actions";

const times = Array.from({ length: 48 }, (_, index) => {
  const value = `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
  return { value, label: timeLabel(value) };
});

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const day = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const dayLabel = (value: string) => day.format(new Date(`${value}T00:00:00Z`));
const span = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

function nextDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function BusinessDaySettings({ initial }: { initial: BusinessDay }) {
  const [settings, setSettings] = useState(initial);
  const [startTime, setStartTime] = useState(
    initial.scheduled?.start_time ?? initial.current.start_time,
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    initial.scheduled?.effective_from ?? nextDay(initial.business_today),
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function run(
    action: () => ReturnType<typeof scheduleBusinessDayAction>,
    message: string,
  ) {
    setPending(true);
    setError("");
    const result = await action();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSettings(result.data);
    toast.add({ type: "success", title: message });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (effectiveFrom <= settings.business_today) {
      setError("Choose a date after today’s business day.");
      return;
    }
    void run(
      () =>
        scheduleBusinessDayAction({
          start_time: startTime,
          effective_from: effectiveFrom,
        }),
      "Business day change scheduled",
    );
  }
  return (
    <div data-coms-ui="operational" className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Business day</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          When each branch’s day starts. Shifts, daily reports and sales dates
          follow this time.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sunrise aria-hidden="true" className="size-4 text-amber-600" />
            Current start
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {timeLabel(settings.current.start_time)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Today: {span.format(new Date(settings.today_start))} –{" "}
            {span.format(new Date(settings.today_end))}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-violet-600"
            />
            Scheduled change
          </p>
          {settings.scheduled ? (
            <>
              <p className="mt-2 text-2xl font-semibold">
                {timeLabel(settings.scheduled.start_time)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Starting {dayLabel(settings.scheduled.effective_from)}
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 -ml-2 h-9 px-2 text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() =>
                  void run(
                    cancelScheduledBusinessDayAction,
                    "Scheduled change cancelled",
                  )
                }
              >
                Cancel change
              </Button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">None</p>
          )}
        </div>
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-5 rounded-xl border bg-card p-5"
      >
        <h2 className="text-sm font-semibold">Schedule a new start time</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DirectorySelect
            id="business-day-start"
            label="Day starts at"
            alignItemWithTrigger={false}
            className="sm:w-full [&_[data-slot=select-trigger]]:h-11"
            value={startTime}
            options={times}
            onChange={setStartTime}
          />
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="business-day-effective">
              Effective from
            </FieldLabel>
            <DatePicker
              id="business-day-effective"
              label="Effective from"
              value={effectiveFrom}
              className="h-11"
              invalid={Boolean(error)}
              describedBy={error ? "business-day-error" : undefined}
              onChange={(value) => {
                setEffectiveFrom(value);
                setError("");
              }}
            />
          </Field>
        </div>
        {error && <FieldError id="business-day-error">{error}</FieldError>}
        <p className="text-sm text-muted-foreground">
          The day before the change ends at the new start time, so no sales fall
          between days.
        </p>
        <Button
          type="submit"
          className="min-h-11 w-fit gap-2"
          disabled={pending}
        >
          {pending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          Schedule change
        </Button>
      </form>
    </div>
  );
}
