const assert = require("node:assert/strict");
const fs = require("node:fs");

// Exercises entry/review only; never sends or mutates a dispatch.
async function checkDispatchCreateModal(page) {
  await page
    .getByRole("button", { name: "Create dispatch", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create dispatch",
    exact: true,
  });
  await dialog.getByRole("combobox", { name: "Branch", exact: true }).click();
  await page.getByRole("option", { name: "Manila North", exact: true }).click();
  await dialog
    .getByRole("combobox", { name: "Stock item 1", exact: true })
    .click();
  await page.getByRole("option", { name: /^Flour/ }).click();
  await dialog.getByLabel("Quantity (kg)", { exact: true }).fill("5");
  await dialog
    .getByRole("button", { name: "Review & send", exact: true })
    .click();
  await dialog.getByText("Destination branch", { exact: true }).waitFor();
  const arrival = dialog.getByRole("button", {
    name: /Estimated arrival date/,
  });
  const time = dialog.getByLabel("Estimated arrival time (PHT)", {
    exact: true,
  });
  const initialTime = await time.inputValue();
  await arrival.click();
  const calendar = page.getByRole("grid");
  await calendar.waitFor();
  await page.keyboard.press("Escape");
  await calendar.waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("alertdialog").count(), 0);
  assert.equal(
    await arrival.evaluate((el) => el === document.activeElement),
    true,
  );
  await arrival.click();
  await page.getByRole("button", { name: "Go to the Next Month" }).click();
  await calendar.getByRole("button", { name: /15/ }).click();
  await calendar.waitFor({ state: "hidden" });
  assert.equal(await time.inputValue(), initialTime);
  await arrival.press("Enter");
  await calendar.waitFor({ timeout: 5000 });
  const selectedDay = calendar.getByRole("button", { name: /15/ });
  await selectedDay.press("ArrowRight");
  await calendar.getByRole("button", { name: /16/ }).press("Enter");
  await calendar.waitFor({ state: "hidden", timeout: 5000 });
  assert.match(await arrival.textContent(), /16/);
  const selectedDate = await arrival.textContent();
  assert.equal(await dialog.getByLabel(/Receive by/).count(), 0);
  await dialog
    .getByRole("button", { name: "Confirm dispatch", exact: true })
    .click();
  await dialog.getByText("Enter who is delivering this dispatch.").waitFor();
  assert.equal(
    await dialog
      .getByLabel("Delivered by", { exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await dialog
    .getByLabel("Delivered by", { exact: true })
    .fill("Juan Dela Cruz");
  await time.fill("");
  await dialog
    .getByRole("button", { name: "Confirm dispatch", exact: true })
    .click();
  await dialog
    .getByText("Choose an estimated arrival in the future.")
    .waitFor();
  assert.equal(
    await time.evaluate((el) => el === document.activeElement),
    true,
  );
  await time.fill(initialTime);
  fs.mkdirSync("test-results/dispatch-modal", { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await dialog.boundingBox();
    assert.ok(
      bounds.x >= 0 && bounds.x + bounds.width <= width,
      `dialog overflow at ${width}`,
    );
    assert.equal(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
      true,
      `dialog content overflow at ${width}`,
    );
    await dialog.screenshot({
      path: `test-results/dispatch-modal/review-${width}.png`,
    });
    await arrival.click();
    await calendar.waitFor();
    const calendarBounds = await calendar.boundingBox();
    assert.ok(
      calendarBounds.x >= 0 && calendarBounds.x + calendarBounds.width <= width,
      `calendar overflow at ${width}`,
    );
    await page.screenshot({
      path: `test-results/dispatch-modal/calendar-${width}.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await calendar.waitFor({ state: "hidden" });
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await dialog.screenshot({
    path: "test-results/dispatch-modal/review-dark.png",
  });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await dialog
    .getByRole("button", { name: "Back to edit", exact: true })
    .click();
  assert.equal(
    await dialog.getByLabel("Quantity (kg)", { exact: true }).inputValue(),
    "5",
  );
  await dialog
    .getByRole("button", { name: "Review & send", exact: true })
    .click();
  assert.equal(
    await dialog.getByLabel("Delivered by", { exact: true }).inputValue(),
    "Juan Dela Cruz",
  );
  assert.equal(await arrival.textContent(), selectedDate);
  assert.equal(await time.inputValue(), initialTime);
  await dialog
    .getByRole("button", { name: "Close Create dispatch", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Discard details", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log(
    "PASS: create dispatch organization, estimated arrival validation/focus, draft retention and responsive/dark modal layouts; no send performed.",
  );
}
module.exports = { checkDispatchCreateModal };
