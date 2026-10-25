// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportCsvButton } from "./export-csv-button";

const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: toastAdd } }));

beforeEach(() => {
  toastAdd.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:csv");
  URL.revokeObjectURL = vi.fn();
});

describe("ExportCsvButton", () => {
  it("requests the export with the current filters and downloads the file", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("\uFEFFSale\r\n", {
        headers: {
          "content-disposition": 'attachment; filename="coms-sales-mn-1.csv"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(
      <ExportCsvButton
        kind="sales"
        params={{
          branch_id: "b1",
          status: "VOIDED",
          search: "",
          missing_only: false,
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/exports/sales?branch_id=b1&status=VOIDED",
    );
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
      "coms-sales-mn-1.csv",
    );
  });

  it("explains why an export failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { message: "This export has 60,000 rows. Narrow the filters." },
            { status: 400 },
          ),
        ),
    );
    render(<ExportCsvButton kind="commissary-inventory" />);
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith({
        type: "error",
        title: "This export has 60,000 rows. Narrow the filters.",
      }),
    );
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeTruthy();
  });
});
