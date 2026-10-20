# Register shifts

Point of Sale shows a shift bar above checkout. Selling requires the cashier's own open shift within its business day; otherwise checkout stays disabled and the bar says why (no shift, another cashier's shift, or business day ended).

- **Open shift**: count the drawer (₱). The API compares it with the cash the previous shift left behind.
- **Cash in/out**: record cash moved to the safe, small purchases or added change, with a reason.
- **Close shift**: blind count. Enter counted cash and the cash to leave for the next shift, confirm, then the result shows expected cash and Balanced / Short / Over. The cashier may add an explanation.
- **Force close** (reviewers): count the drawer of another cashier's open shift with a reason.

`/shifts` lists a branch's shifts with status and business-day filters and 10/30/50 rows. `/shifts/[id]?branch=` shows the counts, sales by payment method, cash movements, voids and notes; reviewers mark closed shifts reviewed (note required for any difference). Reviewers cannot review shifts they worked unless they are Super Admin. Expected cash stays hidden from cashiers while their shift is open.

Daily reports list the day's shifts; Submit is hidden with a reason until every shift is closed and reviewed. Report and sales dates use the business day from `GET /settings/business-day`. Super Admin schedules a new day start at Administration → Business day.

Verification: typecheck, lint and production build; 401/403 related unit tests (two unrelated item-editor tests timed out under load and pass alone). `node test/shifts-browser.cjs` (cashier flow) and `SHIFT_UI_ROLE=admin node test/shifts-browser.cjs` (business day) pass against the loopback fixture at 390/768/1440px. The fixture simulates shifts; cash math, locking and permissions are verified by coms-api integration tests.
