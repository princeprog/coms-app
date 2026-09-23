import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="staff-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="staff-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => onEmailChange(event.currentTarget.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staff-full-name" className="text-sm font-medium">
            Full name
          </label>
          <Input
            id="staff-full-name"
            required
            minLength={2}
            maxLength={160}
            autoComplete="name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.currentTarget.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staff-contact-number" className="text-sm font-medium">
            Contact number
          </label>
          <Input
            id="staff-contact-number"
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
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="staff-initial-password"
            className="text-sm font-medium"
          >
            Initial password
          </label>
          <Input
            id="staff-initial-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => onPasswordChange(event.currentTarget.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use at least 12 characters. The password is never shown after
            successful creation.
          </p>
        </div>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor="staff-role" className="text-sm font-medium">
          Role
        </label>
        <NativeSelect
          id="staff-role"
          required
          value={roleId}
          onChange={(event) => onRoleChange(event.currentTarget.value)}
        >
          {assignableRoles.map((role) => (
            <NativeSelectOption key={role.id} value={role.id}>
              {role.role_name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </>
  );
}
