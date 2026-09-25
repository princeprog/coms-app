"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { generateRoleCode } from "@/features/roles/utils/role-code";

export function RoleCodeField({
  roleName,
  value,
  disabled,
  onChange,
}: {
  roleName: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const generatedCode = generateRoleCode(roleName);
  const customized = Boolean(roleName && value && value !== generatedCode);

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor="role-code">Role code</FieldLabel>
        {customized && (
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(generatedCode)}
          >
            Use generated code
          </Button>
        )}
      </div>
      <Input
        id="role-code"
        required
        minLength={2}
        maxLength={50}
        pattern="[A-Z0-9][A-Z0-9_-]{1,49}"
        autoCapitalize="characters"
        aria-describedby="new-role-code-help"
        value={value}
        disabled={disabled}
        onFocus={(event) => {
          if (!customized) event.currentTarget.select();
        }}
        onChange={(event) => onChange(event.currentTarget.value.toUpperCase())}
        placeholder="Auto-generated"
      />
      <FieldDescription id="new-role-code-help" className="text-xs">
        {roleName ? (
          <>
            <span className="sm:hidden">
              Generated from the name; editable before saving.
            </span>
            <span className="hidden sm:inline">
              Generated from the name. Edit with uppercase letters, numbers,
              underscores, or hyphens; it becomes permanent after saving.
            </span>
          </>
        ) : (
          "Enter a role name to generate a code, or type a custom code."
        )}
      </FieldDescription>
    </Field>
  );
}
