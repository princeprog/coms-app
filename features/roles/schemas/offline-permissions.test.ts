import { expect, it } from "vitest";
import {
  permissionsResponseSchema,
  replaceRolePermissionsSchema,
} from "./role.schema";
it("accepts the API offline POS permission catalog and role edits", () => {
  const keys = ["pos_offline.devices_manage", "pos_offline.review"];
  expect(
    permissionsResponseSchema.parse(
      keys.map((key) => ({
        key,
        module_key: "pos_offline",
        action_key: key.split(".")[1],
        description: "Offline register administration",
      })),
    ),
  ).toHaveLength(2);
  expect(
    replaceRolePermissionsSchema.parse({ permission_keys: keys })
      .permission_keys,
  ).toEqual(keys);
});
