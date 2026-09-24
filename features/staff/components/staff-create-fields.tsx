import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/features/roles/types/role.types";

export function StaffCreateFields({
  email,
  fullName,
  contactNumber,
  password,
  roleId,
  assignableRoles,
  onEmailChange,
  onFullNameChange,
  onContactNumberChange,
  onPasswordChange,
  onRoleChange,
}: {
  email: string;
  fullName: string;
  contactNumber: string;
  password: string;
  roleId: string;
  assignableRoles: Role[];
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}) {
  return (
    <FieldGroup className="gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="staff-create-email">Email</FieldLabel>
          <Input
            id="staff-create-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => onEmailChange(event.currentTarget.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="staff-create-full-name">Full name</FieldLabel>
          <Input
            id="staff-create-full-name"
            required
            minLength={2}
            maxLength={160}
            autoComplete="name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.currentTarget.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="staff-create-contact">Contact number</FieldLabel>
          <Input
            id="staff-create-contact"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={30}
            value={contactNumber}
            onChange={(event) =>
              onContactNumberChange(event.currentTarget.value)
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="staff-create-password">
            Initial password
          </FieldLabel>
          <Input
            id="staff-create-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => onPasswordChange(event.currentTarget.value)}
          />
          <FieldDescription>
            Use at least 12 characters. The password is never shown after
            successful creation.
          </FieldDescription>
        </Field>
      </div>

      <Field className="max-w-md">
        <FieldLabel htmlFor="staff-create-role">Role</FieldLabel>
        <Select
          value={roleId}
          onValueChange={(value) => onRoleChange(value ?? "")}
        >
          <SelectTrigger id="staff-create-role" className="w-full">
            <SelectValue placeholder="Select a role">
              {(value: unknown) =>
                assignableRoles.find((role) => role.id === value)?.role_name ??
                "Select a role"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            {assignableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.role_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
