// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DailyReportDirectoryToolbar } from "./daily-report-directory-toolbar";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("daily report directory toolbar", () => {
  it("uses client GET navigation for supported filters and resets the list page", async () => {
    render(
      <DailyReportDirectoryToolbar
        branches={[
          { id: branchId, name: "Manila North", status: "active" },
          {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa9",
            name: "Closed branch",
            status: "inactive",
          },
        ]}
        filters={{ branchId, status: "RETURNED", page: 4 }}
      />,
    );

    const form = screen.getByRole("form", { name: "Filter daily reports" });
    expect(form.getAttribute("action")).toBe("/reports");
    expect(form.querySelector('input[name="page"]')).toBeNull();
    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole("combobox", { name: "Branch" }));
    expect(
      document.body.querySelector(
        '[data-coms-ui="operational"][data-slot="select-content"]',
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", { name: /Closed branch \(inactive\)/i }),
    ).toBeTruthy();
  });
});
