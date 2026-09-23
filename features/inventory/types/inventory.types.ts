import type { z } from "zod";
import type {
  createInventoryAdjustmentSchema,
  inventoryMovementPageSchema,
  inventoryPageSchema,
} from "@/features/inventory/schemas/inventory.schema";

export type InventoryPage = z.infer<typeof inventoryPageSchema>;
export type InventoryMovementPage = z.infer<typeof inventoryMovementPageSchema>;
export type InventoryItem = InventoryPage["items"][number];
export type InventoryMovement = InventoryMovementPage["items"][number];
export type CreateInventoryAdjustment = z.infer<
  typeof createInventoryAdjustmentSchema
>;

export type InventoryBranchOption = {
  id: string;
  name: string;
  status?: "active" | "inactive";
};

export type InventoryMutationResult =
  { ok: true } | { ok: false; error: string };
