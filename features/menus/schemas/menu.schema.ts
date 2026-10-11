import { z } from "zod";
export const serviceTypeSchema = z.enum(["DINE_IN", "TAKEAWAY"]);
export const serviceTypesSchema = z
  .array(serviceTypeSchema)
  .min(1, "Select at least one service.")
  .max(2)
  .refine(
    (value) => new Set(value).size === value.length,
    "Select each service only once.",
  );
export const menuDecimal = z
  .string()
  .trim()
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/, "Enter a nonnegative selling price.");
export type ServiceType = z.infer<typeof serviceTypeSchema>;
