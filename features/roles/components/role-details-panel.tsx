import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RoleNameForm } from "@/features/roles/components/role-name-form";
import type { Role } from "@/features/roles/types/role.types";

export function RoleDetailsPanel({
  role,
  selectedCount,
  canEditName,
  disabled,
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  role: Role;
  selectedCount: number;
  canEditName: boolean;
  disabled: boolean;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  return (
    <Card data-role-workspace-details className="min-h-0 min-w-0 gap-0 py-0">
      <CardHeader className="border-b px-3 py-2 sm:px-5 sm:py-4">
        <CardTitle>
          <h3 className="text-lg font-semibold">Role details</h3>
        </CardTitle>
        <CardAction className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge variant={role.is_system ? "secondary" : "outline"}>
            {role.is_system
              ? "System"
              : role.is_predefined
                ? "Predefined"
                : "Custom"}
          </Badge>
          <Badge variant={role.is_active ? "outline" : "secondary"}>
            {role.is_active ? "Active" : "Inactive"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="p-3 sm:p-5">
        {canEditName ? (
          <RoleNameForm
            id={role.id}
            initialName={role.role_name}
            code={role.code}
            disabled={disabled}
            onComplete={onComplete}
            onDirtyChange={onDirtyChange}
            onPendingChange={onPendingChange}
          />
        ) : (
          <FieldGroup className="gap-2 min-[360px]:grid min-[360px]:grid-cols-2 lg:flex lg:gap-5">
            <Field>
              <FieldLabel htmlFor={`role-name-readonly-${role.id}`}>
                Role name
              </FieldLabel>
              <Input
                id={`role-name-readonly-${role.id}`}
                value={role.role_name}
                readOnly
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`role-code-readonly-${role.id}`}>
                Role code
              </FieldLabel>
              <Input
                id={`role-code-readonly-${role.id}`}
                value={role.code}
                readOnly
                className="font-mono"
              />
            </Field>
          </FieldGroup>
        )}

        <Separator className="my-2 sm:my-5" />
        <div className="grid gap-1 rounded-md bg-muted/40 p-2 min-[360px]:flex min-[360px]:items-center min-[360px]:gap-2 sm:p-3">
          <Badge
            variant="secondary"
            aria-live="polite"
            className="w-fit text-primary"
          >
            {getAccessSummary(role, selectedCount)}
          </Badge>
          <p
            data-role-compact-description
            data-role-shared-effect={role.is_predefined ? "" : undefined}
            className="text-xs text-muted-foreground"
          >
            {role.is_system
              ? role.code === "SUPER_ADMIN"
                ? "This protected role has global access across COMS."
                : "This protected role does not grant access."
              : role.is_predefined
                ? "Permission changes apply to everyone assigned to this role."
                : "Members receive only the permissions selected here."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getAccessSummary(role: Role, selectedCount: number) {
  if (role.code === "SUPER_ADMIN") return "Global access";
  if (selectedCount === 0) return "No permissions";
  return `${selectedCount} ${selectedCount === 1 ? "permission" : "permissions"} selected`;
}
