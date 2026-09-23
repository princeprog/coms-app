// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { StockRequestCreateAction } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestCreateForm } from "./stock-request-create-form";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const requestId = "8c19ad45-b776-42fe-bc8d-71f231a59a11";
const retryKey = "e23d6f29-00da-41c3-b639-2ec409af93ef";
const timestamp = "2026-09-24T01:30:00.000Z";
const branches: Branch[] = [
  {
    id: branchId,
    code: "DT",
    branch_name: "Downtown",
    address: null,
    date_opened: null,
    has_dine_in: false,
    status: "active",
  },
];
const stockItems: StockItem[] = [
  {
    id: stockItemId,
    stock_item_name: "Flour",
    category: "Dry goods",
    unit: "kg",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
];

describe("stock request create form", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", { randomUUID: () => retryKey });
  });

  it("submits exact decimal text for the selected branch and item", async () => {
    const user = userEvent.setup();
    const action = vi.fn<StockRequestCreateAction>().mockResolvedValue({
      ok: true,
      request_id: requestId,
    });
    const onCreated = vi.fn();
    render(
      <StockRequestCreateForm
        branches={branches}
        stockItems={stockItems}
        selectedBranchId={branchId}
        action={action}
        onPendingChange={vi.fn()}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText("Quantity 1"), "12.5000");
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith(
        {
          branch_id: branchId,
          items: [
            { stock_item_id: stockItemId, quantity_requested: "12.5000" },
          ],
        },
        retryKey,
      );
    });
    expect(onCreated).toHaveBeenCalledWith(requestId);
  });

  it("rejects a zero quantity before calling the server action", async () => {
    const user = userEvent.setup();
    const action = vi.fn<StockRequestCreateAction>();
    render(
      <StockRequestCreateForm
        branches={branches}
        stockItems={stockItems}
        selectedBranchId={branchId}
        action={action}
        onPendingChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Quantity 1"), "0");
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "positive quantities",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("reuses the same retry key for an unchanged request after a failure", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<StockRequestCreateAction>()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true, request_id: requestId });
    render(
      <StockRequestCreateForm
        branches={branches}
        stockItems={stockItems}
        selectedBranchId={branchId}
        action={action}
        onPendingChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Quantity 1"), "2.5");

    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Try again.",
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0][1]).toBe(retryKey);
    expect(action.mock.calls[1][1]).toBe(retryKey);
  });
});
