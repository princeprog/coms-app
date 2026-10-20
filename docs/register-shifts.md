# Register shifts

Shifts are started and ended on their own pages, and the app header shows shift status on every page for users with `shifts.operate` (Super Admin excluded). Point of Sale shows the register only to the cashier on shift; otherwise it shows a card explaining what to do next (start a shift, another cashier is on the register, or the business day has ended).

- **Start shift** (`/shifts/start?branch=&return=`): choose the branch when assigned to several, then count the opening cash as one total or by Philippine bills and coins. If another cashier is on that register, the page says so and links to their shift. On success it returns to `return` (same-origin paths only) or Point of Sale.
- **Header control**: a Start shift button, or a Shift N · Branch menu with Point of Sale, Cash in / out, View shift and End shift. The status dot turns amber when the business day has ended.
- **Cash in / out**: record cash moved to the safe, small purchases or added change, with a reason.
- **End shift** (`/shifts/end`): four steps — Review (time on shift, sales, cash movements), Count (blind count of the drawer and the cash left for the next shift), Confirm, Done (expected cash and Balanced / Short / Over, optional explanation). Done returns to Point of Sale.
- **Force close** (reviewers): from the Point of Sale card, count the drawer of another cashier's open shift with a reason.

`/shifts` also shows Start shift or End shift for the signed-in operator. The shared `useMyShift` hook reports loading until hydration because the header can fill its cache before a streamed page hydrates.

`/shifts` lists a branch's shifts with status and business-day filters and 10/30/50 rows. `/shifts/[id]?branch=` shows the counts, sales by payment method, cash movements, voids and notes; reviewers mark closed shifts reviewed (note required for any difference). Reviewers cannot review shifts they worked unless they are Super Admin. Expected cash stays hidden from cashiers while their shift is open.

Daily reports list the day's shifts; Submit is hidden with a reason until every shift is closed and reviewed. Report and sales dates use the business day from `GET /settings/business-day`. Super Admin schedules a new day start at Administration → Business day.

Verification: typecheck, lint and production build; related unit tests. `node test/shifts-browser.cjs` (POS card, start page with a bills-and-coins count, header cash out, stepped end with a shortfall and explanation, return to the POS card, list and detail) and `SHIFT_UI_ROLE=admin node test/shifts-browser.cjs` (business day) pass against the loopback fixture at 390/768/1440px with no console errors. The fixture simulates shifts; cash math, locking and permissions are verified by coms-api integration tests.
