# Expenses

Expenses replaces the retired Costs & profit page. `/expenses` opens the current Manila calendar month and all locations the signed-in user may access. Costing calculations remain: receipts set weighted-average stock costs, sales snapshot cost, and the Sales report and Dashboard show profit to users with `costs.read`.

## Recording and reviewing spending

- Record an operating expense with its date, location, category, description, exact PHP amount and payment method. Payee, reference and notes are optional. Expenses count immediately; there is no submission or approval step.
- Supplier deliveries and direct purchases appear automatically as read-only Stock purchases. They count once at the commissary. Dispatching stock does not create another expense. View the original purchase only when permitted.
- Recorded spending is operating expenses plus purchase value. It does not mean cash paid or net profit. Voided expenses remain available through the Status filter but never contribute to totals.
- Cash from the register must link to an existing eligible Cash out. The selected cash-out supplies the full amount; saving the expense does not remove cash again. Closed-shift cash-outs remain eligible. Use the existing register Cash out action first if there is no matching movement.
- Edit requires a correction reason and retains before/after history. Void requires a reason and retains the record. Register-linked location, payment, amount and cash-out cannot be edited; void and record a replacement to correct these fields. Voiding only changes expense classification, not cash balances.
- Inactive locations and categories remain available for history and unchanged historical corrections; they cannot be newly selected.

Search, dates, location, source, category, status, sorting, pagination, summaries and CSV use the same server-side scope. Export downloads all matching records up to the existing 50,000-row cap. Filters stay in the URL. Dirty forms warn before discard, errors preserve drafts and successful saves show a toast.

The toolbar follows the other list pages: a debounced search bar, a sort select, a Filters popover (status, location, category and source, applied together with Apply filters) and a date-range popover with This month / Last month presets. Active filters appear as removable chips with Clear all. Location filtering and the By location breakdown are shown only to users with `expenses.commissary_read` or `expenses.global_read`; branch-only users see their assigned branches without a location control.

## Access

Branch Managers receive read/create/update/void for assigned branches. Commissary Managers receive the same capabilities and commissary access. Super Admin manages categories and can access all locations. Cashiers and custom roles receive no automatic new grants. Administrators can grant expense capabilities through Roles; `global_read` expands branch access only and `commissary_read` is separate. Cash-out selection additionally needs shift access and ownership or review permission. History omits events involving locations the current viewer cannot access.

## Delivery

Deploy the API expenses migration and compatible API before this frontend. The implementation was migrated locally only; no production deployment is part of this change. See `coms-api/docs/expenses-implementation.md` for the schema, permission, endpoint and release contract.

Browser checks use a loopback fixture with simulated records, never a live account. Real transactional behavior is covered independently by the API disposable-database integration suite.

Verified 87 focused frontend/fixture tests, full TypeScript, scoped ESLint/Prettier and production build. The isolated production browser suite passed create failure/retry and visible success, correction/void history, exact register selection, read-only purchases, filters/pagination/sorting/date ranges/CSV, category create/rename/status, keyboard focus and Escape, and 390/1440px light/dark layouts without runtime errors. Decimal responses retain purchase precision; PHP display rounds using integer arithmetic. Expense-only roles also land on `/expenses` after sign-in.
