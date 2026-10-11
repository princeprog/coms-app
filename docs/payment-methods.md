# Payment methods

Super Admin manages the shared list at **Administration → Payment methods** (`/payment-methods`). Create or edit a name, Cash/Non-cash type and Active/Inactive status. Names are case-insensitively unique. Use Deactivate to stop accepting a method; Edit → Active reactivates it. Methods are retained rather than deleted.

POS loads enabled methods from the API, defaults to an enabled Cash type on first load, and otherwise asks the cashier to choose. Cash type controls Amount received/change, independent of its name. Non-cash methods do not ask for cash. These are accepted-tender labels, not payment-provider integrations. Cash received and change remain local calculator values.

Selections refresh on focus and every minute. A removed selection is flagged; the app never silently substitutes another method. Empty/error states block new checkout and offer reload. Server rejection refreshes methods and preserves the cart. The server locks and revalidates the method when recording a sale, stores its ID and name snapshot, and preserves successful idempotent API retries after rename/deactivation. Historical sales retain their original tender names.

## Verification — 2026-10-12

- Frontend full suite: 127 files / 555 tests passed, plus 3 new focused checkout tests passed after the suite. TypeScript, full ESLint, changed-file formatting and production build passed.
- API full default suite: 121 passed, 44 opt-in database cases skipped. The disposable integration suite separately passed 21 tests including payment authorization, CRUD, validation, disabled/unknown tender rejection, snapshots/retries, legacy compatibility and migration upgrade/rollback guards. Disposable databases were dropped.
- API TypeScript, build, standard Oxlint and changed-file formatting passed. Type-aware `pnpm lint` could not launch the Windows tsgolint executable (`spawnSync UNKNOWN`), including one retry.
- No browser testing, per user instruction. Responsive and keyboard browser QA remains unverified; automated DOM tests cover readable choices, selection, reactivation, failure retention and cash/non-cash checkout.
- Local development migration applied after verifying a backup archive; 25 migrations applied, none pending; Kysely types regenerated. No production deployment or commit/push. Ports remain 3005/3006.

Release in order: back up the deployment database, apply migration `20261012044805_payment_methods`, deploy API, then frontend, and refresh open POS clients. Add required non-cash methods; only Cash is initially enabled. Old callers without a method ID can submit an enabled method's name (case-insensitive); arbitrary free-text tenders are rejected. Historical unknown tender labels are not automatically added to the accepted list.

## Management UI refinement — 2026-10-12

The management card uses explicit payment-method copy instead of a stock-item fallback. Create and edit use a focused dialog with the method name, illustrated Cash/Non-cash behavior choices, and Active/Inactive availability choices. The dialog explains the POS effect of every option and preserves failed drafts. Directory row actions use visible blue View, amber Edit, and red Deactivate icons while retaining text labels and accessible names.
