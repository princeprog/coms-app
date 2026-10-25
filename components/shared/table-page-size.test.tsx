// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TablePageSize } from "./table-page-size";
import { parseTablePageSize } from "@/lib/table-pagination";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("table page sizes", () => {
  beforeEach(() => replace.mockReset());

  it.each([undefined, "", "25", "-1", "0", "500", "30.5", "invalid"])(
    "defaults unsupported size %s to 10",
    (value) => expect(parseTablePageSize(value)).toBe(10),
  );
  it.each([10, 30, 50])("accepts %s", (value) => {
    expect(parseTablePageSize(String(value))).toBe(value);
  });

  it.each(["/inventory", "/stock-items", "/products", "/branch-products"])(
    "%s offers only 10/30/50 and resets the page while retaining filters",
    async (route) => {
      const user = userEvent.setup();
      render(
        <TablePageSize
          pageSize={10}
          href={`${route}?page=3&scope=BRANCH&branch_id=branch-1&search=rice&is_active=true&sort=price%3Aasc`}
        />,
      );
      await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
      expect(
        (await screen.findAllByRole("option")).map(
          (option) => option.textContent,
        ),
      ).toEqual(["10", "30", "50"]);
      await user.click(screen.getByRole("option", { name: "30" }));
      const [href, options] = replace.mock.calls[0];
      const url = new URL(href, "http://localhost");
      expect(url.pathname).toBe(route);
      expect(Object.fromEntries(url.searchParams)).toEqual({
        scope: "BRANCH",
        branch_id: "branch-1",
        search: "rice",
        is_active: "true",
        sort: "price:asc",
        page_size: "30",
      });
      expect(options).toEqual({ scroll: false });
    },
  );
});
