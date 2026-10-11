import { z } from "zod";
export const paymentMethodChoiceSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(40),
  kind: z.enum(["CASH", "NON_CASH"]),
});
export const paymentMethodSchema = paymentMethodChoiceSchema.extend({
  is_active: z.boolean(),
});
export const paymentMethodPageSchema = z.object({
  items: z.array(paymentMethodSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});
export const savePaymentMethodSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    kind: z.enum(["CASH", "NON_CASH"]),
    status: z.enum(["enabled", "disabled"]),
  })
  .strict()
  .transform(({ status, ...values }) => ({
    ...values,
    is_active: status === "enabled",
  }));
export type PaymentMethodChoice = z.infer<typeof paymentMethodChoiceSchema>;
