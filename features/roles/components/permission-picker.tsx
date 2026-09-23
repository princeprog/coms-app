import type { Permission } from "@/features/roles/types/role.types";

export function PermissionPicker({
  permissions,
  selected,
  labelPrefix,
  onChange,
}: {
  permissions: Permission[];
  selected: string[];
  labelPrefix: string;
  onChange: (keys: string[]) => void;
}) {
  const groups = permissions.reduce<Record<string, Permission[]>>(
    (result, permission) => {
      (result[permission.module_key] ??= []).push(permission);
      return result;
    },
    {},
  );

  function togglePermission(key: string, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...selected, key])]
        : selected.filter((item) => item !== key),
    );
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-sm font-medium">Permissions</legend>
      {Object.entries(groups).map(([module, items]) => (
        <fieldset key={module} className="rounded-2xl border p-4">
          <legend className="px-1 text-sm font-medium capitalize">
            {module.replaceAll("_", " ")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((permission) => (
              <label
                key={permission.key}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-2 text-sm hover:bg-muted/60 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  aria-label={`${labelPrefix} ${permission.key}`}
                  checked={selected.includes(permission.key)}
                  onChange={(event) =>
                    togglePermission(
                      permission.key,
                      event.currentTarget.checked,
                    )
                  }
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {permission.action_key.replaceAll("_", " ")}
                  </span>
                  <span className="text-muted-foreground">
                    {permission.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {permissions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No permissions are available.
        </p>
      )}
    </fieldset>
  );
}
