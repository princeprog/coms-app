// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import Link from "next/link";
import { UnsavedNavigationGuard } from "./unsaved-navigation-guard";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => push.mockReset());

it("retains a recipe draft until navigation is explicitly confirmed", async () => {
  const user = userEvent.setup();
  render(
    <>
      <UnsavedNavigationGuard dirty />
      <Link href="/products/example">Overview</Link>
    </>,
  );
  await user.click(screen.getByRole("link", { name: "Overview" }));
  expect(push).not.toHaveBeenCalled();
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(push).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();
  await user.click(screen.getByRole("link", { name: "Overview" }));
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(push).toHaveBeenCalledWith("/products/example");
});

it("leaves clean and modified navigation available without a discard dialog", () => {
  const navigate = vi.fn((event: React.MouseEvent) => {
    expect(event.defaultPrevented).toBe(false);
    event.preventDefault();
  });
  const { rerender } = render(
    <>
      <UnsavedNavigationGuard dirty={false} />
      <Link href="/products/example" onClick={navigate}>
        Overview
      </Link>
    </>,
  );
  const link = screen.getByRole("link");
  fireEvent.click(link);
  rerender(
    <>
      <UnsavedNavigationGuard dirty />
      <Link href="/products/example" onClick={navigate}>
        Overview
      </Link>
    </>,
  );
  fireEvent.click(link, { ctrlKey: true });
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
