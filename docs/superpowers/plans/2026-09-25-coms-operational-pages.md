# COMS Operational Pages Redesign — Execution Brief

## Objective and constraints

Refresh all signed-in COMS operational sections and their four nested detail routes using existing shadcn/Base UI components. The approved treatment uses clean neutral surfaces, compact tables for directories and history, focused dialogs or sheets for existing operations, cards for the POS menu, and restrained COMS orange for primary actions and selection.

Dashboard appearance/content/data, the shared authenticated shell/sidebar/header, login and recovery, public URLs, permissions, validation, server actions, API contracts, exact decimal handling, and workflow transitions are protected. Keep changes inside `coms-app` except for the explicitly requested local Obsidian documentation. Work directly on the existing `dev` branch with one agent and frequent, explicit-file, reviewable commits. No branch switching, worktree, subagents, push, API/schema changes, new UI dependency, fake production metrics, or new business capability.

## Implementation rules

- Use existing shadcn/Base UI primitives and composition (`render`, never Radix `asChild`); read installed component APIs before use. Use Field/FieldGroup, Table, Dialog, Sheet, Select/Combobox, Badge, Alert, Empty, Skeleton, DropdownMenu, and Sonner where appropriate.
- Keep feature behavior/data in its existing `features/<feature>` owner; `app/` composes pages. Shared, feature-neutral presentation lives in `components/shared/`. Do not turn it into a universal page/table configuration framework.
- Preserve each feature's server-side authorization, services/actions, schemas, permissions, branch scope, decimal strings, idempotency, refresh behavior, and supported pagination. Do not add filters, sorting, columns derived from unavailable data, or unsupported totals.
- Keep the shared header's existing `h1`. Operational page content uses section-level headings. Use Next `Form` with string `action` for changed GET filters and `Link` for navigation so the authenticated shell remains mounted. Preserve independent POS URL parameters and query-selected report/sale detail.
- Existing shadcn primitives have default styles shared by Dashboard. Opt in via `data-coms-ui="operational"` on operational content and narrowly scoped `data-slot` recipes in `app/globals.css`. Mark portal content as well. Do not change global tokens, fonts, primitive defaults, sidebar/header, auth, or Dashboard. Retain focus, disabled, invalid, hover, and open states.
- Overlay forms have an accessible title, useful description, scrollable content, stable footer, pending/error feedback, and correct focus return. Preserve values on failed submissions; confirm discarding dirty local edits. Keep API-separate saves separate. Keep required transition confirmations/reasons.
- Keep changed components focused and under 200 lines. Remove old card/form variants only after references and tests migrate.

## Route checklist

### Administration

- [x] `/roles`: compact table for name/code, system/custom, grant summary, status, row actions. Create in a Sheet. Edit custom role name and permissions in independently submitted sections. Group permissions by module, show selected counts, allow local permission search, and preserve checked state while filtering/collapsing. System roles remain read-only. Render `SUPER_ADMIN` as global access and `NO_ACCESS` as no grants. Preserve deactivation rules/confirmation.
  - Component verification is complete for protected states, filtered grants, independent saves, pending state, dirty-form confirmation, and focus return. Responsive production-browser evidence remains in the final fixture pass.
- [x] `/staff`: table for name/email, role, branches, contact and status. Add/manage in Sheets; profile, role and branch assignments remain separate operations. Retain branch/search URL scope, action-specific permissions, self-change protection and unavailable option-list states.
  - Component coverage verifies populated table rows, detail-only access, add/manage sheets, dirty-draft confirmation, protected branch selection, filter-preserving pagination, create failure retention, and separate profile/role/branch actions. Full fixture viewport checks remain in the final browser pass.
- [x] `/branches`: table for name/code, address, opening date, dine-in and status. Create/edit in Dialogs; code immutable on edit. Preserve pagination, branch assignment rules and confirmed deactivation. Add no unsupported search/summary.
  - Tests cover scoped action visibility, code immutability, create/update/deactivate payloads, dirty creation dismissal, validation failure retention, empty state, pagination, and keyboard confirmation. Fixture data includes multiple pages, inactive records, and long names; fixture mutation retry and response schemas are checked.

### Catalogs and product configuration

- [x] `/suppliers`: table for name/contact/phone/email/status; address in detail/edit. Keep supported search and active filter; reuse shared catalog behavior and authorized actions.
- [x] `/stock-items`: table for name/category/unit/status; preserve search/filter, validation and soft deactivation.
- [x] `/products`: table for name/description/status; no price here. Recipe link only with permission; create/edit dialogs.
  - Shared catalog component tests cover explicit columns, full read-only details, filters and pagination, permission-gated row actions, dirty-form discard, server rejection/retry, and successful mutation refresh. Production-browser verification against the populated API fixture remains in the final pass.
- [x] `/recipes`: compact product list and existing paging; no inferred completeness metrics. Search uses Next.js client GET navigation without pinning the old page; empty search results offer a clear-search action.
- [x] `/recipes/[productId]`: back link, product/status, notices, ingredient table/editor. Keep positive decimal quantities, units, inactive-item history, duplicate validation and read-only access. Repeatable accessible fields and one existing save action.
  - Component coverage verifies exact decimal create/update payloads, duplicate and inactive-item validation, read-only history, shadcn Select interaction, stable row IDs, and value retention/retry after server rejection. Production-browser screenshots and fixture-backed route verification remain in the final pass.
- [x] `/branch-products`: branch + existing filters and a table for product/price/availability/status. Add offering, change price, and change availability use distinct dialogs/actions/permissions. Inactive branch/product behavior remains.
  - Tests cover branch/search/availability preservation and page reset, pagination, separate dialogs/actions, exact price strings, inactive record protections, dirty-draft confirmation, and retry value retention. The schema-checked fixture provides 31 products, 26 paginated branch offers, saved/empty recipes, and product/recipe/offer mutations. Production-browser screenshots and viewport evidence remain in the final pass.

### Inventory and stock movement

- [x] `/inventory`: scope/branch/search toolbar; separate balance and movement sections; adjustment stays tied to balance with required reason. Preserve scope, branch, inactive branch, exact decimal and paging behavior.
  - Tests cover client GET filters, branch selection, scope/search preservation, labeled keyboard-focusable table scroll regions, empty/error states, inactive restrictions, exact decimal adjustment payloads, retry behavior, and dirty adjustment confirmation.
- [x] `/receipts`: compact table for supplier/date/item count/total cost/status/detail. New receipt uses a scrollable Sheet with supplier/date and repeatable stock lines. Preserve draft creation and retry keys.
  - Tests cover client GET status/search, filter-preserving pagination, exact decimal payloads, idempotent retries, dirty-draft confirmation, validation, posting confirmation, and labeled table scroll regions. Fixture contracts cover active supplier/stock-item options, paginated draft/posted receipts, long values, create retry, posting, and detail.
- [x] `/receipts/[id]`: back link, supplier/date/status/count/total metadata, received-items table, exact totals and posting data. The current receipt API schema has no reference/photo fields; none were invented. Post confirmation remains authorized; posted content is read-only.
- [x] `/replenishment`: compact table for branch/requester/item count/status/submitted/detail; client GET status/branch filters; multi-item request Sheet with branch and existing item/quantity fields, dirty-draft confirmation, retained errors, and unchanged idempotency behavior.
- [x] `/replenishment/[id]`: metadata, requested-item table, event history, and only currently valid approve/reject/cancel/create-dispatch actions. Rejection remains reason-free; dispatch creation remains an approved-request action.
  - Feature and fixture coverage passes 38 tests across 10 files, including filter state/page reset, unavailable branch choices, sheet validation and dirty dismissal, exact decimal payloads, idempotent retry, conflict handling, request event history, and approve/reject/cancel transitions. Lint, typecheck, and targeted Prettier checks pass. Browser screenshots and viewport checks remain in the final acceptance pass.
- [x] `/dispatches`: compact table with branch/request/items/status/created/dispatched/detail. Draft creation stays connected to approved request; no free-form dispatch. Status filters use client GET navigation and reset pagination.
- [x] `/dispatches/[id]`: quantity workspace for requested/dispatched/received/shortage-closed/in-transit plus separate dispatch, receipt, and shortage history. Posting remains confirmed; partial receive and reasoned shortage close use responsive Sheets with dirty-draft confirmation, existing authorization, decimal validation, and retry keys.
  - Dispatch feature tests cover all workflow states, list filters, accessible table regions, transition sheets, explicit posting confirmation, and exact action payloads. The focused dispatch, stock-request, and operational fixture run passed 89 tests across 22 files; fixture contract tests passed 9/9. Lint, typecheck, Prettier, and whitespace checks passed. Populated production-browser and viewport evidence remains in the final pass.
- [x] Keep received amounts as existing decimal strings without a currency symbol; the currency is not established.

### POS and reporting

- [ ] `/pos`: branch/search toolbar, product cards and bounded cart beside menu on desktop, stacked mobile with visible cart anchor. Keep quantity/remove/tender/estimate/pending/retry/last-sale behavior. History remains below as table. Open sale details in a Sheet keyed to existing `sale_id`; closing preserves other query parameters and the cart. Branch change retains existing cart clearing. No payment processing/refunds/discounts/printing/images.
- [ ] `/reports` directory: branch/status toolbar, existing date dialog, table for date/status/updated/open, current Asia/Manila date and pagination.
- [ ] `/reports?report_id=…`: replace directory with report workspace and filter-preserving back link. Keep status, returned reason, counts, review controls, history. Desktop count table with expected/physical/waste/justified-adjustment/variance; expandable ledger breakdown/reasons. Mobile stacked item editor shares the same state and has unique IDs; inactive duplicate fields are not focusable/submitted. Server-calculated values remain identified as such. Save all items as existing action; Save/Submit/Return/Approve stay distinct; transitions cannot lose unsaved edits. Preserve every required reason, permission and immutable approved rule.

## Commits and gates

At every boundary verify branch `dev`, inspect staged diff, stage explicit files, run relevant existing checks, commit only the coherent change and record the hash in the ledger and Obsidian Progress.

1. Save this brief/checklist, capture current baseline and Dashboard evidence; commit documentation baseline.
2. Operational opt-in styling, shared pieces, and isolated populated browser fixture; test dashboard style isolation and shared states.
3. Roles pilot; validate protections, filters/permissions, forms, keyboard and small viewport.
4. Shared catalogs and suppliers/stock items/products.
5. Branches.
6. Staff.
7. Inventory and adjustment.
8. Receiving list/create/detail.
9. Replenishment list/create/detail.
10. Dispatch list/detail and transitions.
11. Recipes/detail and Branch Products.
12. POS and sale-detail sheet.
13. Daily Reports/list/count/review.
14. Full browser/visual/accessibility regression and documentation.

Split a boundary where its smaller coherent pieces can be reviewed/tested independently. No `git add .`, unrelated commits, API edits, squashing, rebasing, or pushing.

## Execution ledger

- `b8e0083` — execution specification, route checklist, and baseline evidence.
- `3203931` — opt-in operational styling and shared presentation helpers.
- `9de6e2f` — Roles table and permission sheets.
- `76045d9` — local HTTP fixture foundation with fake auth, role mutations, and schema-checked permission catalog. Extended by `8c30d33` with deterministic branch records, pagination, status/long-name states, create/update/deactivate mutations, and one-shot failure responses. This fixture does not replace the real isolated-auth browser harness.
- `f89b644` — explicit per-catalog column configuration, shadcn tables, server GET filters, full read-only record details and guarded create/edit dialogs across Suppliers, Stock Items, and Products.
- `8c30d33` — branch table, create/edit dialogs, confirmed deactivation, shared in-content retry state, and deterministic paginated branch API fixture records.
- `bdbbd08` — Staff directory table, add/manage sheets, read-only account details, separate profile/role/branch actions, branch-aware GET filters, dirty-draft confirmation, and focused component coverage.
- `cb9f05a` — Staff fixture responses and mutations, including deterministic 26-record pagination, long/inactive examples, branch filtering, schema validation, and retry/error behavior.
- `27a5b8e` — Inventory scope/filter toolbar, responsive balances and movements, exact-decimal adjustment dialog, dirty-draft confirmation, and a focusable labeled table scroll container with no default UI style changes.
- `08ea59a` — Receiving list/detail tables, Next.js search/status navigation, multi-line receipt Sheet with dirty-draft confirmation, and confirmed posting control.
- `b1bb7d4` — schema-checked receipt list/detail/options, exact-decimal in-memory fixture create/retry/post responses, and fixture tests.
- `5277fa3` — Receiving plan checklist and milestone documentation.
- `038c327` — Replenishment list/detail tables, client GET branch/status filters, multi-item request Sheet, guarded transitions, request history, and focused component tests.
- `fe67c50` — Paginated stock-request fixture responses, schema validation, normalized decimal/idempotency behavior, and create/retry/transition tests.
- `bd21f50` — Dispatch directory/detail tables, responsive transition Sheets, dirty-draft confirmation, and focused interaction tests.
- `3905274` — Schema-checked dispatch fixture with 26 paginated records, all five workflow statuses, request-linked creation, posting, partial receipts, shortage history, and retry behavior.
- `d941b18` — Recipes product table and recipe workspace with shadcn fields/select, stable repeatable rows, operational styling isolation, and focused validation/retry tests.
- `a33831e` — Branch Products table, URL-backed filters, and distinct create, price, and availability dialogs with inactive-record protections.
- `4f39a14` — Product/recipe/branch-offer fixture contracts, catalog mutation responses, schema validation, exact-decimal workflow checks, and retry-test pending-state synchronization.

## Baseline and acceptance

Run `pnpm test`, `pnpm lint`, `pnpm build`, then `pnpm typecheck`; record exact results, don't assume the historically recorded 379 tests still describe this checkout. Capture representative Dashboard and operations desktop/mobile screenshots before the visual changes. Record hashes for the dashboard route, data, and directly rendered content components. Save screenshots only from disposable fixtures; never expose real account data.

Use a test-only locally bound in-memory HTTP fixture for populated page/API interactions so normal server services/actions render their contract responses; validate fixtures with existing feature schemas. It is distinct from and does not replace the isolated-auth browser fixture. Do not add a production auth bypass or app fixture route. Cover representative populated/multiple-page/long-text/inactive/empty/failure responses and the mutation responses needed for action, retry, and refresh UI. If the current auth fixture cannot compose safely with this fixture without a production auth bypass, use the disposable authenticated test harness already present or clearly report the precise limitation; never change the real account.

Check all operation pages at 390, 768, 1440 and 1920 px, including light/dark, 200% zoom, no page overflow, scroll-contained tables, overlays, and keyboard/focus. Cover directory empty/filtered/error states; field validation/pending/failure/retry/dirty close; read-only and partial permissions; direct URL/query selection and preserved Back/Forward state; stock transitions and reasons; POS cart/retries/sale/void; and report unsaved/count/review rules. Verify no duplicate `main`/page `h1`, hydration/browser errors, or new React key warnings.

Protect Dashboard using before/after screenshots, route/data/content hashes, and unchanged Dashboard/shared-shell/auth source. Re-run the existing document/sidebar identity, collapse/scroll, browser history and mutation refresh regression after the redesign.

Final gate: `pnpm test`, `pnpm lint`, targeted formatting checks, `pnpm build`, then `pnpm typecheck`, existing auth/navigation production-browser harness, populated operational production-browser fixture, and a separate author self-review (no subagents). Record exact results, screenshots, commits and any limitation in the app and Obsidian docs. Completion means all listed page behaviors work, not merely passing compilation.
