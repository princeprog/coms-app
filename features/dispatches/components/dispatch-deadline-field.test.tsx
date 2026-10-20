// @vitest-environment jsdom

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DispatchDeadlineField } from "./dispatch-deadline-field";
import { receiveByIso } from "../services/receiving-time";

function ArrivalForm() {
  const [value, setValue] = useState("2027-01-31T23:45");
  return (
    <>
      <DispatchDeadlineField
        value={value}
        onChange={setValue}
        error=""
        disabled={false}
      />
      <output aria-label="Arrival timestamp">{receiveByIso(value)}</output>
    </>
  );
}

describe("dispatch arrival picker", () => {
  it("navigates to a future month, preserves time, and serializes the selected date in PHT", async () => {
    const user = userEvent.setup();
    render(<ArrivalForm />);
    await user.click(
      screen.getByRole("button", { name: /Estimated arrival date/ }),
    );
    await user.click(
      screen.getByRole("button", { name: "Go to the Next Month" }),
    );
    await user.click(screen.getByRole("button", { name: /February 15/ }));
    expect(
      screen.getByLabelText("Estimated arrival time (PHT)"),
    ).toHaveProperty("value", "23:45");
    expect(screen.getByLabelText("Arrival timestamp").textContent).toBe(
      "2027-02-15T15:45:00.000Z",
    );
  });

  it("keeps the selected date while time is cleared and corrected", () => {
    render(<ArrivalForm />);
    const time = screen.getByLabelText("Estimated arrival time (PHT)");
    fireEvent.change(time, { target: { value: "" } });
    expect(screen.getByLabelText("Arrival timestamp").textContent).toBe("");
    expect(
      screen.getByRole("button", { name: /Estimated arrival date/ })
        .textContent,
    ).toContain("January 31");
    fireEvent.change(time, { target: { value: "00:15" } });
    expect(screen.getByLabelText("Arrival timestamp").textContent).toBe(
      "2027-01-30T16:15:00.000Z",
    );
  });
});
