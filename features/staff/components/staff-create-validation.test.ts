import { describe, expect, it } from "vitest";
import {
  normalizeStaffContactNumber,
  sanitizeStaffContactInput,
  validateStaffCreateField,
} from "./staff-create-validation";

describe("Philippine staff contact number", () => {
  it("accepts local, national, and pasted +63 formats while keeping only local digits", () => {
    expect(sanitizeStaffContactInput("9171234567", "")).toBe("9171234567");
    expect(sanitizeStaffContactInput("0917 123 4567", "")).toBe("9171234567");
    expect(sanitizeStaffContactInput("+63 917 123 4567", "")).toBe(
      "9171234567",
    );
    expect(sanitizeStaffContactInput("0891-234-5678", "")).toBe("8912345678");
    expect(sanitizeStaffContactInput("9a1b7", "")).toBe("917");
  });

  it("does not silently truncate a pasted number with too many digits", () => {
    expect(sanitizeStaffContactInput("91712345678", "917")).toBe("917");
  });

  it("requires a complete Philippine mobile number before submission", () => {
    expect(normalizeStaffContactNumber("9171234567")).toBe("+639171234567");
    expect(normalizeStaffContactNumber("8912345678")).toBe("+638912345678");
    for (const input of [
      "",
      "917123456",
      "7171234567",
      "09171234567",
      "91712345678",
    ]) {
      expect(normalizeStaffContactNumber(input)).toBeNull();
      expect(validateStaffCreateField("contactNumber", input)).toBe(
        "Enter a Philippine mobile number with 10 digits after +63.",
      );
    }
  });
});
