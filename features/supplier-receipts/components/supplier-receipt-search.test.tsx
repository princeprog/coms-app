// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SupplierReceiptManagement } from "./supplier-receipt-management";
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));
const props = {
  page: { items: [], total: 0, page: 3, page_size: 25 },
  search: "",
  canCreate: false,
  formOptions: null,
  formOptionsIssue: null,
  createAction: vi.fn(),
};
afterEach(() => {
  vi.useRealTimers();
  replace.mockReset();
});
describe("receiving automatic search", () => {
  it("keeps newer typing when an earlier search response arrives", () => {
    vi.useFakeTimers();
    const view = render(<SupplierReceiptManagement {...props} />);
    fireEvent.change(screen.getByLabelText("Search supplier"), {
      target: { value: "North" },
    });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.change(screen.getByLabelText("Search supplier"), {
      target: { value: "North Farm" },
    });
    act(() => vi.advanceTimersByTime(150));
    view.rerender(
      <SupplierReceiptManagement
        {...props}
        page={{ ...props.page, page: 1 }}
        search="North"
      />,
    );
    expect(screen.getByLabelText("Search supplier")).toHaveProperty(
      "value",
      "North Farm",
    );
    act(() => vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenLastCalledWith("/receipts?search=North+Farm", {
      scroll: false,
    });
  });
  it("cancels obsolete text and restores the server query on browser navigation", () => {
    vi.useFakeTimers();
    const view = render(<SupplierReceiptManagement {...props} />);
    fireEvent.change(screen.getByLabelText("Search supplier"), {
      target: { value: "Obsolete" },
    });
    view.rerender(
      <SupplierReceiptManagement {...props} search="Previous search" />,
    );
    act(() => vi.advanceTimersByTime(400));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Search supplier")).toHaveProperty(
      "value",
      "Previous search",
    );
  });
  it("queries only the latest text after 350ms and resets the page", () => {
    vi.useFakeTimers();
    render(<SupplierReceiptManagement {...props} />);
    fireEvent.change(screen.getByLabelText("Search supplier"), {
      target: { value: "Nor" },
    });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(screen.getByLabelText("Search supplier"), {
      target: { value: "North" },
    });
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith("/receipts?search=North", {
      scroll: false,
    });
    expect(screen.queryByRole("button", { name: "Apply filters" })).toBeNull();
  });
  it("flushes on Enter and cancels a pending search when unmounted", () => {
    vi.useFakeTimers();
    const view = render(<SupplierReceiptManagement {...props} />);
    const input = screen.getByLabelText("Search supplier");
    fireEvent.change(input, { target: { value: "Farm" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(replace).toHaveBeenCalledExactlyOnceWith("/receipts?search=Farm", {
      scroll: false,
    });
    fireEvent.change(input, { target: { value: "Obsolete" } });
    view.unmount();
    act(() => vi.advanceTimersByTime(400));
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
