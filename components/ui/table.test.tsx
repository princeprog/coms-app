// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "@/components/ui/table";

describe("Table", () => {
  it("forwards accessible scroll-container props without altering the table", () => {
    render(
      <Table
        containerProps={{
          "aria-label": "Recent supplier deliveries",
          role: "region",
          tabIndex: 0,
          className: "max-h-80 overflow-auto",
        }}
      >
        <tbody>
          <tr>
            <td>Flour</td>
          </tr>
        </tbody>
      </Table>,
    );

    const scroller = screen.getByRole("region", {
      name: "Recent supplier deliveries",
    });
    expect(scroller.getAttribute("aria-label")).toBe(
      "Recent supplier deliveries",
    );
    expect(scroller.tabIndex).toBe(0);
    expect(scroller.className).toContain("max-h-80");
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
