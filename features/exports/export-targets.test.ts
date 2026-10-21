import { describe, expect, it } from "vitest";
import { resolveExportTarget } from "./export-targets";

const branch = "00000000-0000-4000-8000-000000000001";

describe("export targets", () => {
  it("forwards only the filters an export allows", () => {
    expect(
      resolveExportTarget(
        "sales",
        new URLSearchParams({
          branch_id: branch,
          status: "VOIDED",
          date_from: "2026-10-01",
          page_size: "100",
          other: "x",
        }),
      ),
    ).toBe(
      `/branches/${branch}/sales/export?status=VOIDED&date_from=2026-10-01`,
    );
    expect(
      resolveExportTarget("stock-costs", new URLSearchParams({ search: "" })),
    ).toBe("/costs/stock-items/export");
  });

  it("rejects unknown kinds and invalid branches", () => {
    expect(resolveExportTarget("staff", new URLSearchParams())).toBeNull();
    expect(resolveExportTarget("toString", new URLSearchParams())).toBeNull();
    expect(
      resolveExportTarget(
        "branch-inventory",
        new URLSearchParams({ branch_id: "../../auth/me" }),
      ),
    ).toBeNull();
  });
});
