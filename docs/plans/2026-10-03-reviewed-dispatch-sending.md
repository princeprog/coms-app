# Reviewed dispatch sending implementation plan

Approved flow: **New dispatch → Review & send → In transit → Branch confirms receipt**.
Sending means stock is physically ready to leave. Branch inventory increases only for recorded actual receipts. Keep the existing centered modal and legacy drafts.

## Handoff checklist

- [x] Require the disk-based data-management-page-ux skill in workspace and both repository instructions for new chats, handoffs, resumed and compacted contexts.
- [x] Add POST /dispatches/send with the existing creation payload, UUID Idempotency-Key, existing detail response, both create/send permissions, protected Super Admin policy and branch scope.
- [x] Within one transaction claim the key, validate active branch/items, create header/lines, deduct stock using a helper shared with legacy posting, write linked movements, creator/sender timestamps and one DISPATCHED event, finish IN_TRANSIT.
- [x] Preserve positive exact decimal strings, unique items and 100-line limit. Any insufficient line rolls back everything with a stock-specific error.
- [x] Matching concurrent retries return the original dispatch even after partial/full receipt. Changed payload, actor and cross-action key reuse conflict. Keep legacy create/post endpoints; never automatically convert existing drafts.
- [x] Modal edit → review (no mutation) → Confirm dispatch. Show branch, names, units and exact quantities; Back to edit preserves values. Confirmation: “Confirm that this stock is leaving the commissary. Sending will deduct commissary inventory.”
- [x] Sending… blocks duplicates and dismissal; failure preserves values, uncertain retries reuse key, payload changes use a new key. Success announces completion and opens detail. Preserve dirty guards, focus, scrolling and Quick Actions.
- [x] New creation requires both grants; create-only users get an explanation. Legacy draft sending still uses its existing grant.
- [x] Stock search: server-driven 25/page, 350ms debounce, accessible pagination, obsolete-response protection, selected metadata retained. Use existing commissary inventory endpoint only with inventory-read permission, otherwise active stock endpoint and availability-check explanation. Availability advisory; errors retry, never fabricated zeros.
- [x] Drafts show Planned quantity, Send dispatch and zero transit, omit misleading transit/shipped columns. Active discrepancies visible; collapse secondary history and omit empty sections.
- [x] Preserve receiving, partial receipts, recounts, shortage closures, list filters/pagination. No approvals, reservations, scheduling or transport features.
- [x] Database integration in a uniquely named disposable database: multi-line success, exact balances/movements/event, insufficient rollback, inactive branch/item, branch scope, each missing grant, concurrent identical retries, conflicting keys/actors/actions, competing limited-stock dispatches and retries after partial/full receipt.
- [x] Compatibility: manual legacy sending, draft zero transit, receipts credit only actual quantities, shortage handling.
- [x] Frontend tests: mutation-free review, Back, failure retention, duplicate/pending dismissal guards, retry keys, search races and recoverable lookup failures.
- [x] Focused/full suites, lint, formatting, typechecks and both production builds. Update/run API and browser fixtures; report simulated fixture evidence separately from real transaction evidence.
- [x] Browser: desktop, phone, dark mode, keyboard/focus return and narrow layouts with simulated accounts only.
- [ ] Update Obsidian workflow, decisions and progress after verified milestones.

## Delivery

Target five focused commits: frontend instructions, backend instructions, atomic API, reviewed frontend, browser fixtures. Stage task changes only, including individual hunks in already dirty files. Release additive API before frontend; no schema migration, dependency, automatic stock adjustment or production deployment.

Completion requires all relevant checks passing. Failed confirmation leaves no saved dispatch or stock deduction.

## Verified evidence — 2026-10-03

- Frontend: 115 files / 508 tests passed with four workers; ESLint, changed-file Prettier, production build and post-build typecheck passed.
- API: 112 unit tests passed; 37 opt-in database checks are skipped in the default unit command. All 108 end-to-end tests across 11 files passed against a uniquely named disposable PostgreSQL database with 20 existing migrations, then the database was dropped. The final focused dispatch suite passed all 20 checks, including nonexistent/inactive references and zero transit for drafts.
- Real transaction regressions: forced reversed-line send/legacy-draft overlap and concurrent cross-action key reuse across branches failed before the stock-lock fix and passed afterward. Exact decimal deductions, per-line linked movements, actor/timestamp, rollback, permission/scope denials and replay after receipt are asserted.
- Frontend regressions: lost response followed by equivalent/reverted quantity edits creates one operation; current permission changes mask retained selected and cached balances. Review is mutation-free; Back, failure retention, pending guards, lookup races and retry recovery are covered.
- Browser: the task-only fixture passed 21 route states at 195, 390, 768, 1440 and 1920px, all states in dark mode, and 2x scale at 195px. It exercises review, Back, failed confirmation, retry, success announcement, transit detail navigation, keyboard dismissal/focus and persistent shell. Browser/API fixture evidence uses synthetic accounts and simulated inventory, independently of the PostgreSQL transaction evidence. The wider working-tree fixture also passed 23 states, including prior inventory work; those unrelated additions are excluded from this task's commit.
- Independent final review identified retry identity and stock-lock ordering defects; both were reproduced and fixed. Current-access visibility and concurrent conflicting-key races were also fixed. No deferred review findings remain.

## Implementation rulings and costs

1. Work in the existing dev checkouts with pre-change snapshots because the centered modal and design-system prerequisites already exist there. Cost: stage task hunks carefully.
2. Use a Windows-compatible local ledger instead of the skill's Bash scripts. Cost: manual bookkeeping.
3. Include the existing centered dispatch modal prerequisite in this feature commit; preserve unrelated UI/inventory work separately. Cost: the feature commit includes that modal conversion.
4. Correct staff checkbox labels and the stale supplier-receipt response assertion found by full verification. Cost: minimal fixes outside dispatch, without changing those workflows or API contracts.
5. Reuse the released inventory query contract, presenting inactive results disabled. Cost: disabled inactive results can occupy search-page slots.
6. Run the full frontend suite with four workers after unconstrained parallelism caused existing UI deadlines to expire during builds. Cost: slower verification; no deadline or assertion was relaxed.

## Release and handoff

The additive API must be released before the updated frontend. No deployment is part of this implementation. Existing drafts remain intact and manually sendable. No migration, dependency, new permission grant or automatic inventory adjustment was introduced. Task commits preserve prior unrelated working-tree changes; verification used the current workspace and is not a claim that all prior uncommitted design-system work has been committed.
