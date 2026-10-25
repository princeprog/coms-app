import { z } from "zod";

const clock = z.string().regex(/^\d{2}:\d{2}$/);
const weekday = z.number().int().min(1).max(7);

export const shiftTemplateSchema = z.object({
  id: z.uuid(),
  branch_id: z.uuid(),
  name: z.string(),
  start_time: clock,
  end_time: clock,
  weekdays: z.array(weekday),
  is_active: z.boolean(),
  revision: z.number().int(),
  staff_count: z.number().int().nonnegative(),
});
export const shiftTemplateListSchema = z.array(shiftTemplateSchema);

export const scheduleWeekSchema = z.object({
  branch: z.object({ id: z.uuid(), name: z.string(), is_active: z.boolean() }),
  week_start: z.iso.date(),
  days: z.array(
    z.object({ date: z.iso.date(), weekday, is_past: z.boolean() }),
  ),
  business_today: z.iso.date(),
  day_start_time: clock,
  templates: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      start_time: clock,
      end_time: clock,
      weekdays: z.array(weekday),
    }),
  ),
  staff: z.array(
    z.object({
      user_id: z.uuid(),
      full_name: z.string(),
      role_name: z.string().nullable(),
    }),
  ),
  pattern: z.array(
    z.object({ user_id: z.uuid(), template_id: z.uuid(), weekday }),
  ),
  shifts: z.array(
    z.object({
      work_date: z.iso.date(),
      user_id: z.uuid(),
      full_name: z.string(),
      template_id: z.uuid(),
      source: z.enum(["PATTERN", "EXTRA"]),
      exception_id: z.uuid().nullable(),
      starts_at: z.string(),
      ends_at: z.string(),
    }),
  ),
  off: z.array(
    z.object({
      exception_id: z.uuid(),
      work_date: z.iso.date(),
      user_id: z.uuid(),
      full_name: z.string(),
      template_id: z.uuid(),
      reason: z.string().nullable(),
    }),
  ),
});

export const myScheduleSchema = z.object({
  business_today: z.iso.date(),
  days: z.number().int(),
  shifts: z.array(
    z.object({
      work_date: z.iso.date(),
      branch_id: z.uuid(),
      branch_name: z.string(),
      template_id: z.uuid(),
      template_name: z.string(),
      start_time: clock,
      end_time: clock,
      starts_at: z.string(),
      ends_at: z.string(),
      source: z.enum(["PATTERN", "EXTRA"]),
    }),
  ),
});

const halfHour = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, "Choose a time");

export const shiftTemplateFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a shift name")
      .max(40, "Use 40 characters or fewer"),
    start_time: halfHour,
    end_time: halfHour,
    weekdays: z.array(weekday).min(1, "Choose at least one day"),
  })
  .refine((value) => value.start_time !== value.end_time, {
    path: ["end_time"],
    message: "Choose an end time different from the start",
  });

export const patternSchema = z.array(
  z.object({ template_id: z.uuid(), weekday }),
);

export const scheduleExceptionSchema = z.object({
  user_id: z.uuid(),
  template_id: z.uuid(),
  work_date: z.iso.date(),
  kind: z.enum(["OFF", "EXTRA"]),
  reason: z.string().trim().max(200).optional(),
});

export type ShiftTemplate = z.infer<typeof shiftTemplateSchema>;
export type ScheduleWeek = z.infer<typeof scheduleWeekSchema>;
export type MySchedule = z.infer<typeof myScheduleSchema>;
export type ShiftTemplateForm = z.infer<typeof shiftTemplateFormSchema>;
export type ScheduleResult<T> =
  { ok: true; data: T } | { ok: false; error: string; code?: string };
