// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

async function getItemEditor() {
  return import(/* @vite-ignore */ "./daily-report-item-editor").catch(
    () => null,
  );
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const stockItemId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const report = {
  id: reportId,
  branch_id: branchId,
  business_date: "2026-09-23",
  status: "DRAFT" as const,
  idempotency_key: reportId,
  created_by_user_id: reportId,
  submitted_by_user_id: null,
  submitted_at: null,
  reviewed_by_user_id: null,
  reviewed_at: null,
  return_reason: null,
  created_at: "2026-09-24T02:00:00.000Z",
  updated_at: "2026-09-24T02:00:00.000Z",
  items: [
    {
      id: stockItemId,
      stock_item_id: stockItemId,
      stock_item_name: "Bread flour",
      unit: "kg",
      opening_quantity: "10.000",
      receipt_quantity: "2",
      sale_consumption_quantity: "1.5",
      sale_void_reversal_quantity: "0.5",
      ledger_adjustment_quantity: "0",
      ledger_closing_quantity: "11",
      waste_quantity: "0",
      waste_reason: null,
      adjustment_quantity: "0",
      adjustment_reason: null,
      expected_closing_quantity: "11",
      physical_closing_quantity: null,
      variance_quantity: null,
    },
  ],
  events: [],
};

describe("daily report item editor", () => {
  it("sends decimal strings and reasons without calculating authoritative totals in the app", async () => {
    const editorModule = await getItemEditor();
    expect(editorModule).not.toBeNull();
    if (!editorModule) return;
    const updatedReport = {
      ...report,
      items: [
        {
          ...report.items[0],
          physical_closing_quantity: "10.5",
          waste_quantity: "0.5",
          waste_reason: "Damaged during prep",
          adjustment_quantity: "-0.25",
          adjustment_reason: "Count correction",
          expected_closing_quantity: "10.25",
          variance_quantity: "0.25",
        },
      ],
    };
    const action = vi
      .fn()
      .mockResolvedValue({ ok: true, report: updatedReport });
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(
      <editorModule.DailyReportItemEditor
        branchId={branchId}
        reportId={reportId}
        items={report.items}
        action={action}
        onSaved={onSaved}
      />,
    );

    await user.type(
      screen.getByLabelText("Physical closing for Bread flour (kg)"),
      "10.5",
    );
    await user.clear(screen.getByLabelText("Waste for Bread flour (kg)"));
    await user.type(screen.getByLabelText("Waste for Bread flour (kg)"), "0.5");
    await user.type(
      screen.getByLabelText("Reason for waste for Bread flour"),
      "Damaged during prep",
    );
    await user.clear(
      screen.getByLabelText("Justified adjustment for Bread flour (kg)"),
    );
    await user.type(
      screen.getByLabelText("Justified adjustment for Bread flour (kg)"),
      "-0.25",
    );
    await user.type(
      screen.getByLabelText("Reason for adjustment for Bread flour"),
      "Count correction",
    );
    await user.click(screen.getByRole("button", { name: "Save report" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action).toHaveBeenCalledWith(branchId, reportId, {
      items: [
        {
          stock_item_id: stockItemId,
          physical_closing_quantity: "10.5",
          waste_quantity: "0.5",
          waste_reason: "Damaged during prep",
          adjustment_quantity: "-0.25",
          adjustment_reason: "Count correction",
        },
      ],
    });
    expect(onSaved).toHaveBeenCalledWith(updatedReport);
  });

  it("requires a reason for every nonzero waste quantity before saving", async () => {
    const editorModule = await getItemEditor();
    expect(editorModule).not.toBeNull();
    if (!editorModule) return;
    const action = vi.fn();
    const user = userEvent.setup();
    render(
      <editorModule.DailyReportItemEditor
        branchId={branchId}
        reportId={reportId}
        items={report.items}
        action={action}
        onSaved={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("Physical closing for Bread flour (kg)"),
      "11",
    );
    await user.clear(screen.getByLabelText("Waste for Bread flour (kg)"));
    await user.type(screen.getByLabelText("Waste for Bread flour (kg)"), "1");
    await user.click(screen.getByRole("button", { name: "Save report" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/reason/i);
    expect(action).not.toHaveBeenCalled();
  });

  it("shows the API's ledger figures and current variance without changing them locally", async () => {
    const editorModule = await getItemEditor();
    expect(editorModule).not.toBeNull();
    if (!editorModule) return;
    render(
      <editorModule.DailyReportItemEditor
        branchId={branchId}
        reportId={reportId}
        items={report.items}
        canEdit={false}
        action={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText("Opening").nextSibling?.textContent).toBe(
      "10.000 kg",
    );
    expect(
      screen.getByText("Receipt quantities").nextSibling?.textContent,
    ).toBe("2 kg");
    expect(screen.getByText("Sale consumption").nextSibling?.textContent).toBe(
      "1.5 kg",
    );
    expect(screen.getByText("Variance").nextSibling?.textContent).toBe(
      "Not counted",
    );
    expect(screen.queryByRole("button", { name: "Save report" })).toBeNull();
  });
});
