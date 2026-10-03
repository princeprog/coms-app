// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDispatchSendForm } from "./use-dispatch-send-form";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const event = { preventDefault() {} } as FormEvent<HTMLFormElement>;
afterEach(() => vi.unstubAllGlobals());

describe("uncertain dispatch sending", () => {
  it.each(["12.50 ", "12.500", "12.50"])(
    "preserves the operation after editing and returning to equivalent quantity %s",
    async (quantity) => {
      vi.stubGlobal("crypto", { randomUUID: vi.fn(() => cryptoKey()) });
      const saved = new Map<string, string>();
      let firstResponse = true;
      const { result } = renderHook(() =>
        useDispatchSendForm({
          action: async (_input, key) => {
            if (!saved.has(key)) saved.set(key, "dispatch-id");
            if (firstResponse) {
              firstResponse = false;
              throw new Error("Response lost after commit");
            }
            return { ok: true, dispatch_id: saved.get(key)! };
          },
          onCreated: vi.fn(),
          onDirtyChange: vi.fn(),
          onPendingChange: vi.fn(),
        }),
      );
      act(() => {
        result.current.setBranchId(branchId);
        result.current.setLines([
          { key: 1, stock_item_id: stockItemId, quantity_dispatched: "12.50" },
        ]);
      });
      await act(() => result.current.submit(event));
      expect(saved.size).toBe(0);
      await act(() => result.current.submit(event));
      expect(saved.size).toBe(1);
      act(() => result.current.setReview(null));
      act(() => result.current.updateLine(1, "quantity_dispatched", "10"));
      act(() => result.current.updateLine(1, "quantity_dispatched", quantity));
      await act(() => result.current.submit(event));
      await act(() => result.current.submit(event));
      expect(saved.size).toBe(1);
    },
  );
});

let sequence = 0;
function cryptoKey() {
  return `f47ac10b-58cc-4372-a567-${String(sequence++).padStart(12, "0")}`;
}
