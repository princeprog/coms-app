import { z } from "zod";

const rule = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  effective_from: z.iso.date(),
});

export const businessDaySchema = z.object({
  business_today: z.iso.date(),
  today_start: z.string(),
  today_end: z.string(),
  current: rule,
  scheduled: rule.nullable(),
});

export const scheduleBusinessDaySchema = z.object({
  start_time: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, "Choose a start time"),
  effective_from: z.iso.date("Choose an effective date"),
});

export type BusinessDay = z.infer<typeof businessDaySchema>;
