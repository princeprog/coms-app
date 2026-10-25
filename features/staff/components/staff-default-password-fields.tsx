"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
export function StaffDefaultPasswordFields({
  password,
  confirm,
  errors,
  pending,
  onChange,
}: {
  password: string;
  confirm: string;
  errors: { password?: string; confirm?: string };
  pending: boolean;
  onChange: (field: "password" | "confirm", value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      {" "}
      <Field className="gap-2">
        <FieldLabel htmlFor="default-password">New default password</FieldLabel>
        <div className="relative">
          <Input
            id="default-password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            maxLength={128}
            className="h-11 pr-11"
            value={password}
            disabled={pending}
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="default-password-help"
            onChange={(e) => {
              onChange("password", e.target.value);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={visible ? "Hide password" : "Show password"}
            disabled={pending}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        <p
          id="default-password-help"
          className={
            errors.password
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {errors.password ??
            "12–128 characters. The saved password cannot be viewed."}
        </p>
      </Field>
      <Field className="gap-2">
        <FieldLabel htmlFor="default-confirm">
          Confirm default password
        </FieldLabel>
        <Input
          id="default-confirm"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          maxLength={128}
          className="h-11"
          value={confirm}
          disabled={pending}
          aria-required="true"
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={
            errors.confirm ? "default-confirm-error" : undefined
          }
          onChange={(e) => {
            onChange("confirm", e.target.value);
          }}
        />
        {errors.confirm && (
          <p id="default-confirm-error" className="text-xs text-destructive">
            {errors.confirm}
          </p>
        )}
      </Field>
    </>
  );
}
