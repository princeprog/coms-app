"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectorySelect } from "@/components/shared/directory-select";
import { toast } from "@/components/ui/toast";
import type { ScheduleWeek } from "../schemas/schedule.schema";
import { saveStaffPatternAction } from "../services/schedule-actions";
import { WEEKDAYS, timeRange } from "../services/schedule-format";
import { patternKeys } from "../services/schedule-grid";
import { FormAlert, ScheduleDialogShell } from "./schedule-dialog-shell";

export function StaffPatternDialog({
  week,
  initialUserId,
  onClose,
  onSaved,
}: {
  week: ScheduleWeek;
  initialUserId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [userId, setUserId] = useState(
    initialUserId ?? week.staff[0]?.user_id ?? "",
  );
  const [selected, setSelected] = useState(() => patternKeys(week, userId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const person = week.staff.find((member) => member.user_id === userId);

  function choosePerson(next: string) {
    setUserId(next);
    setSelected(patternKeys(week, next));
    setError(undefined);
  }
  function toggle(key: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
    setError(undefined);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) return;
    setPending(true);
    setError(undefined);
    const assignments = [...selected].map((key) => {
      const [template_id, weekday] = key.split(":");
      return { template_id, weekday: Number(weekday) };
    });
    const result = await saveStaffPatternAction(
      week.branch.id,
      userId,
      assignments,
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.add({
      type: "success",
      title: `${person.full_name}'s weekly pattern saved`,
    });
    onSaved();
  }

  return (
    <ScheduleDialogShell
      wide
      title="Weekly pattern"
      description="The shifts this person works every week, from today on. Change single days on the schedule."
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
          <Button
            type="submit"
            className="min-h-11 gap-2"
            disabled={pending || !person}
          >
            {pending && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            Save pattern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {week.staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active staff are assigned to {week.branch.name}. Assign staff to
            this branch in Staff first.
          </p>
        ) : (
          <>
            <DirectorySelect
              id="pattern-staff"
              label="Staff member"
              alignItemWithTrigger={false}
              className="w-full sm:w-80 [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3"
              value={userId}
              options={week.staff.map((member) => ({
                value: member.user_id,
                label: member.role_name
                  ? `${member.full_name} · ${member.role_name}`
                  : member.full_name,
                icon: <UserRound className="text-violet-600" />,
              }))}
              onChange={choosePerson}
            />
            <div className="relative overflow-x-auto rounded-lg border">
              <table className="w-full min-w-lg text-sm">
                <caption className="sr-only">
                  Shifts {person?.full_name} works each weekday
                </caption>
                <thead className="bg-muted/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left font-medium"
                    >
                      Shift
                    </th>
                    {WEEKDAYS.map((day) => (
                      <th
                        key={day.value}
                        scope="col"
                        className="w-12 px-1 py-2.5 text-center font-medium"
                      >
                        <abbr title={day.long} className="no-underline">
                          {day.short}
                        </abbr>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {week.templates.map((template) => (
                    <tr key={template.id} className="border-t">
                      <th
                        scope="row"
                        className="px-3 py-2.5 text-left font-normal"
                      >
                        <span className="font-medium">{template.name}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {timeRange(template.start_time, template.end_time)}
                        </span>
                      </th>
                      {WEEKDAYS.map((day) => {
                        const key = `${template.id}:${day.value}`;
                        const runs = template.weekdays.includes(day.value);
                        return (
                          <td
                            key={day.value}
                            className="px-1 py-2.5 text-center"
                          >
                            {runs ? (
                              <Checkbox
                                aria-label={`${template.name} on ${day.long}`}
                                checked={selected.has(key)}
                                disabled={pending}
                                className="size-5"
                                onCheckedChange={(checked) =>
                                  toggle(key, checked === true)
                                }
                              />
                            ) : (
                              <span
                                aria-label={`${template.name} doesn't run on ${day.long}`}
                                className="text-muted-foreground/60"
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              {selected.size === 0
                ? `${person?.full_name ?? "This person"} has no regular shifts.`
                : `${selected.size} ${selected.size === 1 ? "shift" : "shifts"} a week.`}
            </p>
          </>
        )}
        <FormAlert message={error} />
      </div>
    </ScheduleDialogShell>
  );
}
