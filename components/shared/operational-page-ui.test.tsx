// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  OperationalEmptyState,
  OperationalPageIntro,
  OperationalPagination,
  OperationalStatusBadge,
} from "@/components/shared/operational-page-ui";

describe("operational page UI", () => {
  it("keeps page context and its one primary action together", () => {
    render(
      <OperationalPageIntro
        description="Manage active suppliers."
        count="12 suppliers"
        actions={<button type="button">Add supplier</button>}
      />,
    );

    expect(screen.getByText("Manage active suppliers.")).toBeTruthy();
    expect(screen.getByText("12 suppliers")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add supplier" })).toBeTruthy();
  });

  it("renders empty guidance and the caller-authorized next action", () => {
    render(
      <OperationalEmptyState
        title="No stock items yet"
        description="Add the first stock item to begin receiving."
        actions={<button type="button">Add stock item</button>}
      />,
    );

    expect(screen.getByText("No stock items yet")).toBeTruthy();
    expect(
      screen.getByText("Add the first stock item to begin receiving."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add stock item" })).toBeTruthy();
  });

  it("provides named pagination links and keeps unavailable directions disabled", () => {
    const { rerender } = render(
      <OperationalPagination
        ariaLabel="Supplier pages"
        page={2}
        pageCount={4}
        previousHref="/suppliers?page=1"
        nextHref="/suppliers?page=3"
        resultSummary="Showing 11–20 of 35 suppliers"
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Supplier pages" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Previous page" }).getAttribute("href"),
    ).toBe("/suppliers?page=1");
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/suppliers?page=3");
    expect(screen.getByText("Showing 11–20 of 35 suppliers")).toBeTruthy();

    rerender(
      <OperationalPagination
        ariaLabel="Supplier pages"
        page={1}
        pageCount={2}
        nextHref="/suppliers?page=2"
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Previous page" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("keeps explicit status text in the selected shadcn badge variant", () => {
    render(
      <OperationalStatusBadge variant="secondary">
        Active
      </OperationalStatusBadge>,
    );
    expect(screen.getByText("Active").getAttribute("data-slot")).toBe("badge");
  });
});
