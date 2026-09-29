import { z } from "zod";

export type StaffCreateField =
  "fullName" | "email" | "contactNumber" | "password";

export type StaffCreateFieldErrors = Partial<Record<StaffCreateField, string>>;

const emailSchema = z.email().max(320);

export function validateStaffCreateField(
  field: StaffCreateField,
  value: string,
): string | undefined {
  if (field === "fullName") {
    return value.trim().length >= 2 && value.trim().length <= 160
      ? undefined
      : "Enter a full name with 2 to 160 characters.";
  }

  if (field === "email") {
    return emailSchema.safeParse(value.trim().toLowerCase()).success
      ? undefined
      : "Enter a valid email address.";
  }

  if (field === "password") {
    if (value.length < 12) return "Use at least 12 characters.";
    if (value.length > 128) return "Use no more than 128 characters.";
    return undefined;
  }

  return normalizeStaffContactNumber(value)
    ? undefined
    : "Enter a Philippine mobile number with 10 digits after +63.";
}

export function sanitizeStaffContactInput(
  raw: string,
  previous: string,
): string {
  const value = raw.trim();
  let digits = value.replace(/\D/g, "");
  if (
    value.startsWith("+63") ||
    (digits.startsWith("63") && digits.length > 10)
  ) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length > 1) digits = digits.slice(1);
  return digits.length <= 10 ? digits : previous;
}

export function normalizeStaffContactNumber(
  localNumber: string,
): string | null {
  return /^(?:9\d|89)\d{8}$/.test(localNumber) ? `+63${localNumber}` : null;
}
