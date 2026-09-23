import type { z } from "zod";
import type {
  permissionSchema,
  roleSchema,
} from "@/features/roles/schemas/role.schema";

export type Role = z.infer<typeof roleSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type RoleMutationResult = { ok: true } | { ok: false; error: string };
