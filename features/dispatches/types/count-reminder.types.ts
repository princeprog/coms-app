import type { z } from "zod";
import type { countReminderSchema } from "../schemas/dispatch.schema";
export type CountReminder = z.infer<typeof countReminderSchema>;
export type CountReminderResult =
  | { ok: true; data: CountReminder }
  | { ok: false; status: number; error: string; next_allowed_at?: string };
