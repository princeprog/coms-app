import { z } from "zod";

const uuid = z.uuid();
const device = z.object({ device_id: uuid }).strict();
const decimal = z
  .string()
  .max(80)
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);
const envelope = z
  .object({
    id: uuid,
    session_id: uuid,
    device_id: uuid,
    shift_id: uuid,
    sequence: z.number().int().positive(),
    snapshot_id: uuid,
    captured_at: z.iso.datetime(),
    service_type: z.enum(["DINE_IN", "TAKEAWAY"]),
    items: z
      .array(
        z
          .object({
            product_id: uuid,
            quantity: decimal,
            unit_price: decimal,
            price_revision: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .max(40),
    cash_tendered: decimal,
    total_amount: decimal,
  })
  .strict();
const transactions = device
  .extend({ transactions: z.array(envelope).min(1).max(25) })
  .strict();
const reason = z.string().trim().min(3).max(500);

/** Enumerated operations only: never turn user input into an arbitrary proxy URL. */
export function offlineTarget(
  method: string,
  path: string[],
  query: URLSearchParams,
) {
  const id = (value: string | undefined) => uuid.safeParse(value).success;
  const originalPath = path;
  // All register operations are branch scoped, including session reads and replay.
  if (path[0] === "branches" && id(path[1]) && path[2] === "sessions")
    path = path.slice(2);
  let schema: z.ZodType | undefined;
  let valid = false;
  if (method === "GET" && path.join("/") === "context") valid = true;
  if (path[0] === "branches" && id(path[1])) {
    if (path.length === 3 && path[2] === "devices") {
      if (method === "GET") valid = true;
      if (method === "POST")
        schema = device
          .extend({ name: z.string().trim().min(1).max(80) })
          .strict();
    }
    if (
      path.length === 4 &&
      path[2] === "devices" &&
      id(path[3]) &&
      method === "PATCH"
    )
      schema = z
        .object({
          name: z.string().trim().min(1).max(80).optional(),
          status: z.enum(["APPROVED", "REVOKED"]).optional(),
        })
        .strict()
        .refine((value) => Boolean(value.name || value.status));
  }
  if (path[0] === "sessions") {
    if (originalPath === path) return null;
    if (path.length === 2 && path[1] === "prepare" && method === "POST")
      schema = device;
    if (path.length === 1 && method === "GET") valid = true;
    if (id(path[1]) && path.length === 3) {
      if (path[2] === "transactions" && method === "GET") valid = true;
      if (method === "POST") {
        if (path[2] === "refresh") schema = device;
        if (path[2] === "sync") schema = transactions;
        if (path[2] === "finalize")
          schema = device
            .extend({ final_sequence: z.number().int().nonnegative() })
            .strict();
        if (path[2] === "recover-finalize")
          schema = device
            .extend({
              final_sequence: z.number().int().positive(),
              transaction_ids: z.array(uuid).min(1).max(10000),
              reason,
            })
            .strict()
            .refine(
              (value) =>
                value.final_sequence === value.transaction_ids.length &&
                new Set(value.transaction_ids).size ===
                  value.transaction_ids.length,
            );
        if (path[2] === "review")
          schema = z.object({ transaction_id: uuid, reason }).strict();
        if (path[2] === "recover")
          schema = transactions.extend({ reason }).strict();
      }
    }
  }
  if (!valid && !schema) return null;
  const cleanQuery = new URLSearchParams();
  for (const [key, value] of query) {
    if (method !== "GET" || path[0] !== "sessions") return null;
    if (cleanQuery.has(key)) return null;
    if (key === "branch_id" && id(value)) cleanQuery.set(key, value);
    else if (key === "page" && /^[1-9]\d{0,5}$/.test(value))
      cleanQuery.set(key, value);
    else if (
      key === "page_size" &&
      ["10", "25", "30", "50", "100"].includes(value)
    )
      cleanQuery.set(key, value);
    else return null;
  }
  return {
    endpoint: `/pos-offline/${originalPath.join("/")}${cleanQuery.size ? `?${cleanQuery}` : ""}`,
    schema,
  };
}
