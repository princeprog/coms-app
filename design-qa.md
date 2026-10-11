# Dispatch details — option 2

Completed 2026-10-08. No actionable P0/P1/P2 findings remain after the second comparison.

## Comparison target and evidence

- Source visual truth: `C:/Users/Al Prince/.codex/generated_images/01a10c76-8dd1-70a1-bcfc-0bfac2731a02/exec-0ae957c7-38c6-451b-b71a-3f5248fb1553.png`, the second displayed concept, 1487 × 1058 pixels.
- Implementation: `test-results/dispatch-details/desktop-final.png`, 1472 × 1047 pixels; in-app browser at 1487 × 1058 CSS pixels, DPR 1.
- Route: `/dispatches/36000000-0000-4000-8000-000000000003`. Light theme, partially received Manila North delivery, open discrepancy and commissary review access. Synthetic data matches the source's actors, timestamps and item balances.
- Full-view comparison: source and final desktop capture opened together in one comparison input. The activity, milestones, balances and next-action regions were visually inspected.
- Focused comparison: `test-results/dispatch-details/balances-comparison.png` (1140 × 645), source left and implementation right. Source was normalized from 1487 × 1058 to 1472 × 1047 using Lanczos, then both images cropped at `(890, 380, 1460, 1025)`. This makes the table, progress bars, discrepancy badge and actions readable at comparable scale. The observed screenshot dimensions differ slightly from the requested CSS viewport; no pixel-perfect full-frame claim is made.
- Responsive evidence: `mobile-final.png` and `mobile-dark.png`, each 375 × 2385 pixels from a 390 × 844 CSS viewport; lifecycle captures and `responsive-checks.json` in the same directory.

## Comparison history

### Comparison 1 — blocked

Full-view source and `desktop-before.png` (1472 × 1047) were opened together.

- [P2, spacing] Duplicate page padding narrowed both panels and pushed actions below the viewport. Removed detail-view padding because `AppPageShell` already owns page margins.
- [P2, typography/layout] Paper boxes wrapped despite sufficient desktop space in the source. Restored panel width and gave stock identity a minimum width using the existing spacing scale.
- [P2, colors] Active discrepancy notes blended into ordinary receipt surfaces. Added feature-specific semantic warning surface, border and foreground tokens with light/dark values; historical notes remain neutral.

Action triggers were also increased to at least 44 CSS pixels for touch use.

### Comparison 2 — passed

The revised desktop capture was compared against the source in the same input, followed by the normalized balance-region comparison and both phone themes. Panel proportions and spacing now preserve the selected composition; all three stock names fit on desktop. The warning note has clear restrained emphasis, and primary/secondary actions are fully visible. All earlier P2 findings are resolved in `desktop-final.png` and the focused comparison.

## Required fidelity surfaces

- **Fonts and typography:** Existing Inter, readable display/body weights and line heights, consistent numeric alignment and no clipped labels. The 30px product heading, compact Nova badges and slightly smaller body text are accepted existing-design-system adaptations. Phone wrapping preserves identities, units and explanatory labels. Raster antialiasing differences from the generated source are expected.
- **Spacing and layout rhythm:** Clear header, four milestones and approximately 52/48 desktop panels; restrained borders/radii and no redundant page padding. Existing shell navigation and evenly spaced milestone centers are intentional product constraints. Panels stack on phones; quantities use grouped metadata rather than six compressed columns. Horizontal overflow remains inside the labeled table region where needed.
- **Colors and tokens:** Existing COMS orange primary, neutral surfaces, solid text-bearing amber/red statuses, green complete-receipt bars and semantic warning callouts. Dark theme uses the same semantic tokens. The source's brighter orange/gradient is intentionally adapted to the existing product theme; no new global primitive appearance was introduced.
- **Image quality and assets:** Reused the supplied Emma’s logo and installed Lucide icon family. Assets are sharp and proportionate; there is no additional raster imagery in this operational page. No source image asset was replaced with custom CSS/SVG art. Timeline icons deliberately communicate event type.
- **Copy and content:** Exact API decimal strings and units remain visible; progress is per item and never totals incompatible units. PHT is explicit. Receipts, shortage reasons and discrepancy notes retain actor/time history without duplicating linked events. The source's notification promise was replaced with truthful recount audit-history guidance because no notification integration is provided. Draft and closed-without-receipt states use meaningful labels.

## Interaction, responsive and engineering checks

- Light/dark layouts checked at actual 240, 390, 768, 1487 and 1920 CSS-pixel widths: no document overflow. The in-app browser clamped the requested 195px width to 240px, so 195px was not verified. At 390px the item table fits; at narrower/tablet conditions its accessible scroll region contains overflow.
- Draft, in-transit, received and closed-with-shortage states show lifecycle-appropriate controls, milestones and receipt progress. Existing server permission/branch checks and actions remain authoritative.
- Keyboard opened recount and shortage Sheets, focused the reason field, exercised dirty-draft Keep editing/Discard, retained failed input and returned focus to the originating trigger. A quantity above remaining transit was rejected locally. The fixture does not implement a successful recount endpoint: its 404 exercised translated error feedback and draft retention, not a successful write.
- Browser accessibility snapshot checked labels/headings/control names; warning/error console log query returned no entries. Native browser zoom and a real screen-reader session were not tested.
- Final full frontend suite: **117 files / 528 tests passed**, including exact high-precision progress, linked-history deduplication, partial receipt labels, terminal milestones and Manila timestamps. Meaningful new cases were observed failing before their fixes.
- Changed-file ESLint, Prettier, production build, post-build TypeScript and whitespace checks passed. Final logs: `test-results/dispatch-details/tests-final.log` and `build-final.log`. Changed production components stay within the project's 200-line rule.
- Browser evidence uses loopback synthetic API data; it does not establish live database transactions, notifications or successful reconciliation writes. Existing action/service tests cover success and retry protocols. No backend, schema, grant, dependency or deployment changes.

## Implementation checklist

- [x] Apply selected option 2 using existing shadcn/Base UI components and product tokens.
- [x] Fix all initial P2 findings and compare revised full-view and focused captures.
- [x] Verify responsive themes, lifecycle states, keyboard Sheets and draft/error safeguards.
- [x] Complete frontend suite, lint, format, build, post-build typecheck and whitespace checks.
- [x] Keep the synthetic local preview open and record fixture limitations.

## Follow-up polish

Minor differences in mock typography, milestone positioning and badge density are accepted product-system adaptations, not blockers. No additional P3 work is required for this handoff.

final result: passed

# Branch Menu — selected design

Completed 2026-10-10. This is the latest design QA; the Dispatch Details report above is retained.

## Comparison target and evidence

- Source visual truth: `C:/Users/Al Prince/.codex/generated_images/01a10c76-8dd1-70a1-bcfc-0bfac2731a02/exec-c5bd4105-7384-4db9-a6fb-cde3f40ac791.png`, 1586 × 992 pixels.
- Rendered production frontend: `test-results/branch-menu-design/desktop-final.jpg`, 1600 × 1000 pixels. Requested and measured viewport: 1600 × 1000 CSS pixels, DPR 1. Route `/branch-products`, light theme, synthetic single-branch manager, default filters, eight visible menu items matching the source.
- Full-view evidence: `comparison-final.png`, 3172 × 1020 pixels, source left and implementation right. The implementation was downsampled to 1586 × 992 with Lanczos for comparison; a 28px label strip was added. Both were opened together and visually inspected.
- Focused evidence: `table-comparison.png` (2505 × 321) and `controls-comparison.png` (2505 × 123). Crops come from the same normalized full-view images. Table: source `(283,353,1557,646)`, implementation `(309,353,1540,646)`; controls: source `(283,220,1557,315)`, implementation `(309,220,1540,315)`. Different crop widths reflect the retained application shell; crops are not stretched. Typography, chips, numeric alignment, labels and control heights were inspected together.
- Responsive captures: `mobile-light.jpg` and `mobile-dark.jpg`, 375 × 812 pixels from a measured 390 × 844 CSS viewport; `tablet-dark.jpg`, 753 × 1004 pixels from 768 × 1024 CSS. The browser capture backend trims/resizes these images; DOM measurements establish the tested CSS dimensions. Desktop and `load-error.jpg` use the exact requested capture dimensions.

## Comparison history

### Comparison 1 — blocked

Source and `desktop-first.jpg` were compared in `comparison-first.png`.

- [P2, layout/density] Initial rows were approximately 69px tall, pushing pagination below the 1000px viewport. Reduced cell vertical padding to the existing spacing scale; revised rows measure approximately 59px, with the pagination footer ending at 926.5px.
- [P2, typography/surfaces] Small pill badges weakened the branch context, service choices and availability hierarchy. Used rectangular feature-level badge layouts and readable 14px labels, retaining semantic status variants.

### Comparison 2 — blocked

The revised full-view and table crops resolved the first findings. The toolbar still had a 40px search control beside 32px selects: the Select primitive's size-specific utility overrode the ordinary height class.

- [P2, alignment] Applied the matching `data-[size=default]:h-10` utility only when the shared toolbar's comfortable layout is requested. Other pages retain their existing default density.

### Comparison 3 — passed

The rebuilt frontend was recaptured and compared in the final full-view, table and control evidence. All four toolbar controls measure 40px with the same top position. Eight sample rows and pagination fit without document overflow. Phone controls wrap predictably, and the focusable table region contains horizontal scrolling. No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces

- **Fonts and typography:** Existing Inter, a 30px desktop heading, semibold product identity, readable 14px body/chip labels, muted descriptions and aligned tabular prices preserve the hierarchy. The source's slightly larger body text is an accepted COMS/Nova adaptation. Labels and descriptions wrap without clipping. JPEG screenshot compression softens the captured text; the frontend loads the existing font rather than a rasterized page.
- **Spacing and layout rhythm:** Heading and fixed branch badge precede underlined section navigation, aligned labeled controls, a compact central-pricing note, one bordered table and a separate pagination footer. Duplicate list headings and redundant single-branch controls are removed. Existing sidebar width, header and shell gutters are intentionally retained. Multiple-branch users still receive an authorized selector.
- **Colors and visual tokens:** Existing orange primary, neutral borders/surfaces, secondary service badges and solid green/red text-bearing availability statuses match the intent. The same semantic tokens support both themes; global theme and primitive defaults were not redesigned.
- **Image quality and assets:** Reused the supplied Emma's logo and installed Lucide icons. The selected operational design needs no new product imagery. No visible source asset was replaced with handcrafted SVG, CSS art or placeholder imagery.
- **Copy and content:** Heading, description, service labels, central-price guidance and availability language match the selected design. Prices retain exact decimal strings, display at least two places and preserve additional nonzero precision. The mock's fictional request count is omitted because there is no aggregate for it. Sidebar entries and Pricing visibility follow existing grants rather than the mock's fictional access.

## Interaction and engineering verification

- Keyboard exercised Add to menu and its server-backed candidate selector, read-only approved price, service selection, dirty-selection Keep editing/Discard, independent availability confirmation, service update and price-request dialog. Synthetic availability/service changes were restored; no operational records were written.
- Verified 350ms search, combined availability/service/sort queries, removable chips, Clear filters, numbered pagination and filtered empty state. Backend queries and URL state remain authoritative; an out-of-range-page redirect now preserves service and sort filters.
- Checked manager fixed branch/no pricing action and central two-branch selector/Pricing visibility. Browser fixture responses use the existing typed contracts; this is UI verification, not a new authorization or database integration test.
- Final build's simulated list failure displays a named alert and Retry; keyboard Retry restores the table. Route-shaped loading skeleton is accessible. Final browser warning/error logs are empty.
- Desktop, 390px phone in both themes and 768px tablet have no persistent document overflow. Phone table scrolling is contained in the labeled, keyboard-focusable region. Native zoom/text scaling and a real screen-reader session were not run; semantic structure/control names and keyboard flows were inspected.
- Full frontend suite passed: **121 files / 555 tests**. After the final select-height refinement, **6 files / 28 focused tests** passed. Earlier affected-workflow run: **12 files / 52 tests**. Final production build, post-build TypeScript, changed-file ESLint/Prettier and whitespace checks passed. Logs: `test-results/branch-menu-design-tests.log`, `branch-menu-design-final-focused.log`, `branch-menu-design-build.log`, `branch-menu-design-types.log` and `branch-menu-design-lint.log`.
- API/database suites were not rerun for this presentation-only change. Browser records/actions are simulated by an ignored loopback fixture; no live database transaction, real approval or real price write was claimed. No backend, migration, grant, dependency, commit/push or deployment changes were made. Prior Dispatch Details, Inventory and menu ownership work remain intact.

## Implementation checklist

- [x] Apply the selected Branch Menu design with existing COMS/shadcn components.
- [x] Resolve all initial P2 findings and inspect updated full-view and focused comparisons.
- [x] Preserve permission-aware actions, authorized branch scope and server query behavior.
- [x] Check keyboard actions, drafts, filters, pagination, loading/error recovery and responsive themes.
- [x] Complete focused/full frontend checks and record synthetic-browser verification limits.

## Follow-up polish

No required P3 work. Existing shell proportions, compact typography and horizontal rather than vertical action dots are accepted product-system adaptations.

final result: passed

# Stock usage and unified product setup — 2026-10-10

Implemented solo using data-management-page-ux, project UX/architecture rules, and existing COMS/shadcn primitives. This extends the live feature contracts; no new generated-image reference was supplied for this workspace. Earlier Dispatch Details and Branch Menu QA remains above.

## Layout and workflow result

- Stock Items separates Category from multi-select Usage and presents Ingredient, Packaging, Ready to sell, and Operating supply labels. Usage filtering, search, pagination, and component lookups are backend-driven. Operating supplies do not enter sale recipes.
- Products now opens a dedicated setup page for details/services, Prepared or Ready to sell components, exact Dine-in/Takeaway deductions, and authorized central branch prices. Existing row actions and recipe editing links reach this workspace. Component rows align type, stock, quantity/unit, scope, and removal on desktop; narrower layouts stack them without clipping. Visible Quantity labels retain detailed accessible names. Ready-to-sell stock precedes optional packaging after save.
- Managers inspect readable saved values and deduction tables, then submit recipe requests. Central review keeps the proposal separate from adjusted approval. Add to menu exposes disabled blocked products and specific reasons alongside eligible centrally priced products. The candidate DTO whitelist regression found by the real browser was fixed and covered with observed red/green API tests.
- Real authenticated central, manager, and cashier flows used the production frontend/API and disposable PostgreSQL. Central creation, multiple stock usages, adjusted recipe approval, and menu additions succeeded. Both service sales saved exact money and deductions; read-only SQL verified their consumption snapshots. These checks are distinct from the earlier simulated menu preview.

## Evidence and limits

Desktop, 390px mobile light/dark, and 768px tablet checks showed no document overflow. Keyboard component/usage/candidate selection and menu dialogs worked; final browser warning/error logs were empty. Captures: `test-results/product-setup/prepared-setup-desktop.png`, `product-setup-desktop.png`, `stock-usage-desktop.png`, `components-mobile-light.png`, `components-mobile-dark.png`, `product-setup-tablet-dark.png`, `approved-request.png`, `manager-menu-added.png`, and `service-sales-history.png`.

Final frontend suite: **124 files / 564 tests passed**. Both API suites passed **154 unit/database plus 147 e2e cases** without skips. Both builds, type checks, full lint, and changed-TypeScript formatting passed. API lint retains four existing warnings; one existing concurrent-dispatch test failed intermittently before its focused and complete reruns passed, without code/assertion/timeout changes. Detailed logs, database preservation, and release instructions: `coms-api/docs/product-setup-release.md`.

Native zoom/text scaling, a real screen-reader session, exhaustive browser error states, and independent agent review were not exercised. Automated tests cover failure/conflict/draft/retry and transaction boundaries. Existing operational records and grants matched the pre-migration backup in all 23 checked tables. Local migration 23 is applied; legacy drinks/packaging require explicit classification review. Disposable browser records/processes and restored clone were removed, viewport/theme overrides restored, and the user tab returned to COMS sign-in at `http://localhost:3005`. No production release or commit/push.

final result: passed, with verification limits recorded above

## Simple Products and Branch Menus — 2026-10-10

The approved simplification supersedes the recipe, classification, request, template and branch-pricing sections above. Product creation/editing is one compact shared-price/service/branch form; new branches start unselected. Protected Super Admin owns all product/menu mutations. Other users receive scoped readable values and menus with fixed context for one branch. Retired controls, sections and links are removed; historical records remain.

Verified with the real production frontend/API and disposable PostgreSQL, using synthetic Super Admin, Branch Manager and Cashier accounts. Required-price validation, keyboard branch choices, concurrent-price review, draft retention/retry during an API outage, unsaved navigation, branch disable/re-enable, manager read-only details/menu, Dine-in/Takeaway checkout and new-sale void passed. Final rebuilt app repeated retry recovery and phone checkout. New sales/voids left all six balances unchanged, with no consumption or movements; saved price snapshots remained immutable. Legacy Templates redirected to Branch Menu, and Stock Items exposed no Usage controls.

Desktop, 390px phone in light/dark, and 768px tablet checks found no document overflow. Catalog compact rows retained currency and exact precision; Branch Menu uses bounded horizontal table scroll on phones. POS quantities survived service changes and the mobile cart/checkout remained keyboard accessible. Final browser warnings/errors were empty. Viewport and theme restored; user tab returned to app sign-in on 3005, API on 3006. Disposable databases/processes and the restored verification clone were removed; verified backup retained outside the vault.

Captures under `test-results/simple-products`: `product-form-final-desktop.png`, `branch-menu-final-desktop.png`, product form mobile light/dark/tablet, `products-final-mobile-light.png`, `products-final-mobile-dark.png`, `branch-menu-final-mobile-light.png`, `branch-menu-final-mobile-dark.png`, `manager-menu-desktop.png`, `manager-product-read-only.png`, `product-draft-retry-final.png`, `cashier-price-review.png`, `new-sale-void-review.png`, `pos-final-mobile-light.png`, `pos-final-mobile-dark.png` and `pos-final-mobile-sale.png`.

Final complete checks: frontend **118 files / 525 tests**, API **157 unit/database + 127 e2e tests**, no skips. Both lint/type/format/production-build checks passed. Local migration 24 is applied, with regenerated 51-table Kysely types; exact records in 23 business/access tables matched the verified backup, excluding added columns. Native zoom/text scaling, a real screen reader, exhaustive browser error combinations and independent delegation were not performed. Separate author review follows the user's explicit solo instruction. Production release and commit/push remain outside this delivery. See `docs/simple-products.md` and the API `docs/simple-products-release.md`.

## Create product image implementation and Takeout wording — 2026-10-11

Source visual truth: `C:/Users/Al Prince/.codex/generated_images/01a10c76-8dd1-70a1-bcfc-0bfac2731a02/exec-8c3e6418-443a-44a0-98a2-d557a98d3feb.png`.

First implementation capture: `test-results/create-product-design/desktop-light.png`. Source and implementation both measure **1487 × 1058 pixels**, at a **1487 × 1058 CSS viewport**, device pixel ratio 1. No density normalization. Light theme, synthetic protected Super Admin, Create product, populated name/price/description, both services selected, zero selected branches. The user's requested Takeout wording supersedes the mock's older label. Synthetic branch names and alphabetical server order differ from illustrative records.

Comparison pass 1: `comparison-full.png`, `comparison-details-services.png`, `comparison-branches-actions.png` in the same evidence folder contain source left and implementation right.

**Findings**

- [P2] Product details and Service options headings rendered at 16px; the source has stronger section hierarchy. The primitive's variant selector overrode the requested size. Fix: use the explicit legend variant at 20px and restore the gap after each legend.
- [P2] Cancel's outline was transparent because directly applying unmerged button variant classes to a link retained competing border styles. Fix: compose the existing Base UI Button with the Next link, with a 40px action height and readable padding.
- [P2] Branch rows were taller than the compact source list. Fix: reduce row vertical padding to retain the source's overall density after the heading correction.

Comparison pass 2 uses `desktop-final-light.png`, `comparison-final-full.png`, `comparison-final-details-services.png` and `comparison-final-branches-actions.png`. The revised matched-size comparison resolves all three earlier findings. Cancel now has its outline, headings restore the source's hierarchy, and branch rows have compact spacing. No actionable P0/P1/P2 differences remain.

**Required fidelity surfaces**

- Fonts/typography: existing Inter matches the mock's sans-serif UI; 30px desktop title, 20px section legends and 14px body/controls preserve hierarchy and wrapping. The mock's slightly heavier small text is minor P3 polish.
- Spacing/layout: three unboxed sections, two-column desktop details/services, subtle dividers, compact bounded branch rows and separate footer. Existing shell proportions are preserved; name/price columns are equal rather than the mock's slightly wider name field, an acceptable P3 difference.
- Colors/tokens: white/neutral surfaces, orange-red primary, warm checked choices and restrained borders use COMS tokens. Checked borders are slightly softer than the generated mock; existing token consistency is accepted. Dark mode uses the same semantic tokens.
- Image/assets: reuse the supplied Emma's logo at its existing sharp aspect ratio. Existing Lucide icons fit the source's outlined controls; no placeholder or handcrafted image substitutes.
- Copy/content: source hierarchy and helpers are retained. Takeout replaces the source's old service label by explicit user instruction. Branch names/order and synthetic account initials reflect real backend data and the existing authenticated shell.

**Interaction and responsive evidence**

- Real production frontend/API with owned disposable PostgreSQL: created Chicken rice meal at one exact price of 125, available at Main Branch and North Branch. Read-only SQL confirmed both mirrored offering prices and availability. Branch Manager details display only Main Branch and expose no edit/create controls.
- Keyboard Space toggles services and branch choices; unsupported branches disable with text reasons. The 350ms server search preserves selected IDs. Enter in search does not submit the form. Keyboard Cancel opens the draft warning; Keep editing retains entered fields and selections. The primary action saves and returns to Products.
- `desktop-final-dark.png` is 1487 × 1058. `mobile-light.png` and `mobile-dark.png` are full-content captures, 375 × 1238 at a 390 × 844 viewport; `tablet-dark.png` is 753 × 1106 at 768 × 1024. Full-page captures exclude the 15px native vertical scrollbar. All captures are density 1. Document widths stayed within the viewport; all form actions remained reachable.
- Product details show Dine-in · Takeout. Live branch POS completed a Takeout sale at 125 and Sales history displays Takeout. Read-only SQL confirms compatible storage, inventory_deducted=false and zero consumption/movement rows. `product-saved.png`, `manager-read-only.png`, `takeout-pos-recorded.png` and `takeout-sales-history.png` capture the result. Final browser warning/error logs were empty.

**Verification**

Frontend **120 files / 530 tests** and API **34 files / 158 unit/database tests** pass; relevant API e2e **3 files / 52 tests** pass. Both full lint, TypeScript and production builds pass; final visual changes also pass focused lint/type/build, seven focused draft/navigation/search cases and the complete frontend suite. Changed TypeScript/CJS formatting and whitespace checks pass. No cases in executed suites skipped. Unrelated API e2e suites were not rerun for this UI/search change. Native zoom/text scaling, an actual screen-reader session, and exhaustive browser failure combinations were not exercised. Review stayed solo as requested.

**Implementation checklist**

- Resolved selected visual and compared full/focused regions in combined inputs.
- Fixed the three moderate findings and inspected the revised combined evidence.
- Verified semantic controls, keyboard behavior, server search, real save and read-only branch scope.
- Checked desktop/phone/tablet and both themes; retained exact price/retry and legacy service storage contracts.
- Both owned browser databases/processes were removed, theme/viewport overrides restored and the user's original tab left intact. App 3005 and API 3006 both return HTTP 200.

final result: passed

## Branch Menu image implementation — 2026-10-11

Source visual truth: `C:/Users/Al Prince/.codex/generated_images/01a10c76-8dd1-70a1-bcfc-0bfac2731a02/exec-ad87a4d7-bc1f-43ce-91e7-066a49ec40b7.png`, copied without alteration to `test-results/branch-menu-design/source-design.png`.

Implementation: `test-results/branch-menu-design/desktop-final-light.png`. Both images are **1487 × 1058 pixels**, matching the **1487 × 1058 CSS viewport**, device pixel ratio 1. No density normalization or browser chrome. Light theme, protected Super Admin, Main Branch, no filters, Name A–Z, first page. Eight matching sample products and sixteen pagination records are synthetic; the production frontend uses a disposable in-memory API fixture rather than the operational database.

Full-view comparison: `test-results/branch-menu-design/comparison-final.png`, **2974 × 1058**, source left and implementation right. Focused comparison: `controls-table-final.png`, **1144 × 968**, source above implementation, using the same `(312, 162, 1456, 646)` crop. Both combined inputs were opened and visually reviewed; the focused view makes branch context, control sizes, table typography, prices, service icons and availability readable.

**Findings and comparison history**

- [P2, resolved] The initial branch selector and pagination actions rendered at 32px instead of the source's 40px. `comparison-initial-light.png` and `controls-table-initial.png` show the mismatch. The selector's default-size variant now explicitly uses 40px on desktop; pagination uses 40px desktop / 44px mobile. The final full/focused comparison resolves the sizing drift.
- [P2, resolved] Clearing the applied search updated the URL/results but left the search field populated. A new regression test failed before the fix. Chip removal and Clear all now clear the draft through the existing query owner before applying the URL change, cancelling the pending debounce. Browser checks confirmed an empty search field and all 24 results for both actions, preserving branch and sort.
- [P2, resolved] At 240px, the footer pager exceeded its 193px container and widened the document to 244px despite a 225px client width. The pagination container is now bounded and its content wraps. Final measured document/client widths are both 225px; `narrow-final-light.png` shows every pagination action reachable.
- No actionable P0/P1/P2 differences remain. Minor P3 differences are accepted: existing Inter rendering, COMS border/solid-badge tokens, a 384px branch selector instead of the mock's roughly 420px, and the existing shell/account details. Pagination links have subtler light-theme borders than the generated source; their labels, active state, focus and target sizes remain clear.

**Required fidelity surfaces**

- Fonts/typography: existing Inter preserves the sans-serif source, 30px desktop title, readable 14px body/controls, 20px table heading and product-name hierarchy. Descriptions wrap within the product column; exact prices remain right-aligned. Small weight/antialiasing differences are P3.
- Spacing/layout: header and primary action, separate branch context/divider, aligned search/availability/service/sort controls, one grouped menu table and footer reproduce the source's hierarchy. Product, Selling price, Services, Availability and Actions retain the intended order and density. No added summary cards or nested workflow tabs.
- Colors/tokens: existing orange-red primary, neutral surfaces/dividers, solid green Available and slate Unavailable with white text. Inactive-product status remains distinct. The darker slate shade preserves readable status contrast in both themes.
- Image/assets: supplied Emma's logo retains its sharp aspect ratio. Existing Lucide MapPin, Package, Utensils, ShoppingBag and overflow/pagination icons match the outlined source style. No generated replacements or handcrafted image approximations were needed.
- Copy/content: Branch Menu, Manage products, branch service support, search/filter labels, shared-price explanation and product totals match the selected simple workflow. Takeout remains the visible service term. Unknown branch capabilities do not invent a support caption.

**Interaction and responsive evidence**

- Server search debounces at 350ms. Search plus availability/service filters, individual chip removal, Clear all, highest-price sorting, page navigation and branch switching passed with URL-backed applied state and pagination resets. One shared query owner prevents a pending search from reverting a newly selected branch; the regression test also preserves applied filters and sort.
- Keyboard branch/filter selection and table scrolling passed. A Takeout-only branch displays its capability and effective service choices; a Dine-in filter produces the appropriate no-results state. Clear filters retains branch context.
- Existing availability and service actions remain independent. A simulated save outage retained the availability draft/error; retry succeeded. Narrowing services preserved price and availability. No retired pricing/template/request/recipe controls were added.
- The final manager view has fixed Main Branch context, zero branch selectors, zero Manage products links and zero row actions. `manager-desktop.png` captures the scoped read-only state. Backend authorization remains the existing API's responsibility; this fixture is UI evidence only.
- Final phone light/dark captures are **375 × 1473** at **390 × 844 CSS**; tablet dark is **753 × 1367** at **768 × 1024 CSS**; narrow light is **225 × 1576** at **240 × 844 CSS**. Full-page images exclude the 15px native scrollbar. All captures have density 1. Document width equals client width at each check, and the phone table scrolls within its 341px region over 843px of content. The earlier 1920px check also had no document overflow.
- Final browser warning/error logs were empty. The disposable preview was stopped, its tab closed and the viewport override reset. The operational app/API remain on 3005/3006, and the original user tab was preserved.

**Verification and limits**

Complete frontend: **120 files / 533 tests passed** with `--maxWorkers=2` (`tests-verified.log`). A resource-contended run alongside the build timed out in two unrelated staff/supplier tests; the subsequent complete run passed without changing assertions or timeouts. After the last responsive/context fixes, **10 focused files / 42 tests passed**. Full ESLint, final changed-file ESLint, TypeScript, formatting and production build pass; final logs include `lint-final.log`, `types-verified.log`, `format-verified.log` and `build-verified.log` in the evidence directory. Whitespace checks pass.

No API, schema, permissions, database or dependencies changed for this layout task; API/database suites were not rerun. Native zoom/text scaling, an actual screen-reader session and exhaustive browser error combinations were not exercised. Review stayed solo as requested. Prior Dispatch Details, Inventory and product/menu simplification changes are preserved.

**Implementation checklist**

- Matched the selected image using existing COMS/shadcn components and assets.
- Compared combined full/focused evidence and resolved all moderate findings.
- Preserved shared prices, authorized branch context, independent menu actions and query behavior.
- Verified keyboard, desktop/phone/tablet, light/dark, read-only access, error retention and retry.
- Completed relevant automated checks and removed disposable browser resources.

final result: passed

## Branch Menu action-icon follow-up — 2026-10-11

The user explicitly requested colored icons on every menu-item action after the selected layout was implemented. Amber pause / emerald check, violet utensils and blue pen identify availability, service and editing actions while retaining their text labels. The popup's 224px minimum width prevents labels from wrapping. Icons use explicit stroke tokens so the existing dropdown's focused-descendant text styles cannot make their paths monochrome.

Browser evidence: `test-results/branch-menu-design/actions-icons-native.png` at the original 780×884 viewport, with `actions-icons-detail.png` as a focused screenshot crop. Keyboard focus and SVG-path color were checked in both light and dark themes; the original light theme and viewport were restored. No application data changed. Browser warning/error logs were empty. Existing action checks pass (2 files / 7 tests), along with focused lint/formatting, TypeScript and whitespace checks. Full suites/builds were not repeated for this cosmetic change. This user-directed addition supersedes the earlier reference's text-only actions; the page layout remains as previously verified.

final result: passed

## 2026-10-11 — Branches selected alternative, initial comparison

Source: test-results/branches-design/source-design.png (1487×1058). Initial implementation: desktop-initial-light.png (1487×1058), CSS viewport 1487×1058, Light, All branches, Riverside action menu open. Combined evidence: comparison-initial.png, source left and implementation right. Existing COMS shell/brand are intentionally retained. Browser screenshots at an overridden viewport have some renderer resampling; native capture will accompany final proof.

Findings:
- [P2] Branch identity and status emphasis are weaker than the selected source. Increase the heading/branch-name scale and use compact rectangular solid badges; retain Inter and the current semantic theme.
- [P2] Service/Sort controls are proportionally too narrow. Give the three controls a 5:2:2 desktop grid while preserving mobile stacking.
- [P2] Status tab labels cause document overflow at 240 CSS px (scrollWidth 245). Allow tabs to wrap without losing keyboard operation. The table already contains its own scroll (338px table inside 193px region).

Initial result: blocked. Fix and recapture before final handoff.

### Branches phone comparison follow-up

[P2] Phone branch identity was compressed by desktop column proportions and cell padding. At 390px the services, dates and addresses produced unnecessarily tall rows. Give the identity the remaining mobile table width and reduce secondary cell padding, preserving 44px action targets. This remains blocked until the updated browser capture is checked.

[P2] The strengthened text added excess desktop row height: the eight-row page became 41px taller than the 1058px comparison viewport, causing the open-menu capture to scroll its header. Reduce identity cell padding and line gap to recover the source's compact row rhythm. Recapture the header, table and pagination together before passing.

## 2026-10-11 — Branches final comparison and edit fix

Source visual truth: test-results/branches-design/source-design.png. Rendered production frontend: desktop-final-light.png. Both images are 1487×1058 pixels at a 1487×1058 CSS viewport, nominal density 1, All branches / Name A–Z / Light, eight fictional rows, Riverside menu open. Combined full evidence: comparison-final.png (source left, implementation right). Combined focused evidence: comparison-focused.png (source above implementation), cropped from those exact captures without rescaling. Final capture has scrollY=0 and the complete header, eight rows and pagination fit within the viewport. Native live-app proof: live-branches-native.png, 1280×720 pixels/CSS, Light, real existing three branches and Mindanao actions open. No live records were changed.

**Findings and comparison history**

All earlier P2 findings are resolved in the latest browser captures:
- Heading and branch identity now have stronger scale; status badges are compact rectangles with solid contrast-safe colors and white labels.
- Desktop search/service/sort proportions use a 5:2:2 grid; controls stack on phones.
- The status tabs wrap at 240px. Document width stays within the viewport; horizontal scrolling is contained by the named, focusable table region.
- Phone identity receives the remaining table width, with less secondary cell padding and preserved 44px actions. Final phone rows are visibly shorter and addresses have more room.
- Compact identity padding and line gaps bring desktop rows back to approximately 69px. The 1058px viewport now contains the complete page instead of scrolling its header by 41px.

**Required fidelity surfaces**

- Typography: existing Inter is retained. The 30px heading, 16px semibold branch names, 14px secondary text and clear status hierarchy match the selected directory's intent. Real permanent codes wrap safely. The generated mock has slightly larger optical lettering in some cells; this is P3 within the existing shadcn typography.
- Spacing/layout: header, underline tabs, aligned controls, five desktop columns, unboxed table, horizontal rules and range/numbered footer match the source structure. The persistent 288px COMS sidebar and shell gutter are intentionally preserved. Narrow layouts group services/opened dates under identity and retain status/actions.
- Colors/tokens: existing COMS orange accent and neutral surfaces remain. Green/red labels have visible text, blue Edit and red Deactivate icons remain colored when focused. Existing light/dark tokens are used; no global theme redesign.
- Image quality/assets: the existing Emma's logo is reused. Standard Lucide pin, utensils, bag, pen, power and ellipsis icons replace no custom image assets. The source bag outline differs slightly from the installed Lucide version (P3). Override captures have browser renderer resampling; the native 1280×720 proof is sharp and unscaled.
- Copy/content: source labels and Takeout vocabulary are retained. Filtered counts explicitly say matching; missing dates/addresses are readable. Generated fixture codes/dates are illustrative; the native capture confirms actual permanent codes and saved data.

**Workflow verification**

Production frontend with a disposable synthetic API verified keyboard menu/editor/date-picker access, actual PATCH payloads including has_takeaway=false, failed-save draft retention/retry, service validation, dirty Cancel/Keep editing/Discard and focus return, creation, confirmed soft deactivation, and retained Edit for inactive records. Combined search/status/service/sort, no-results recovery, chips/Clear all, pagination/Back, out-of-range page recovery preserving query and load-error Retry passed. A scoped manager sees only the assigned branch and no create/update/deactivation actions. The live 3005 app loads the new directory and opens/closes its actual editor; live writes were deliberately not used as test fixtures.

Final 390px phone Light/Dark, 768px tablet, 240px narrow reflow and 1920px wide checks have no document overflow. Final warning/error logs are empty. The viewport override is reset; the operational Light preference is preserved, and the live Branches page is left open. Disposable preview processes were stopped.

**Checks and limits**

Complete frontend: 122 files / 541 tests passed; after final cosmetic changes, 3 focused files / 18 tests passed. Complete API default suite: 20 files / 121 passed, 15 files / 44 opt-in database cases skipped. Separately, 3 relevant API files / 17 passed include all 7 disposable PostgreSQL branch/pagination tests. Both full lint checks, final focused frontend lint, types, changed-file formatting, whitespace checks and production builds pass. Existing successful-run test-tool warnings remain in logs.

Broader opt-in database/e2e suites, native zoom/text scaling, an actual screen reader and an exhaustive browser failure matrix were not run for this branch-directory change. No migrations, dependency/permission changes, commit/push or deployment. Earlier Dispatch Details, Inventory and product/menu changes and ports 3005/3006 are preserved.

**Implementation checklist**

- Selected image implemented inside the existing COMS/shadcn page.
- Branch create/update validator corrected with observed failing-then-passing regressions.
- Server-owned scoped search/filter/sort/count/pagination retained.
- Combined full/focused comparison repeated after moderate findings were fixed.
- Browser workflows, responsive states, automated checks and disposable cleanup completed.

final result: passed

## 2026-10-12 — Modern POS and cash change

Source visual truth: test-results/pos-design/source.png (1536 x 1024).
Implementation: test-results/pos-design/desktop-final-light.png (1536 x 1024 CSS viewport and capture; browser raster resampling softens the capture). State: synthetic Cebu Branch, Takeout, 2 Roasted Chicken + 2 Mineral Water, total 540, cash 1000, change 460. Source and rendered views were opened for comparison. Desktop-first and desktop-light-first record the initial pass; mobile.png and tablet-dark.png cover responsive states.

Findings and iteration:
- P2 fixed: the initial checkout button extended below the 1024px desktop viewport. Reduced row padding/quantity-control height on desktop and tightened order-panel spacing. Final button bottom is 992px with scrollY=0; all payment actions visible.
- P2 fixed: on narrow layouts the service selector followed the product list. Added Choose service and Browse products anchors; verified keyboard service selection and the jump back to products on the final production build.
- Typography: existing Inter, readable labels, strong totals and cash change hierarchy. Layout: two-column product tiles and separate checkout pane; existing persistent application shell is intentionally retained rather than replacing navigation app-wide. Existing history tabs move into the header and keep the cart mounted.
- Colors: orange primary actions, subtle selected-tile tint, charcoal service selection and change panel, readable Light/Dark states. Imagery: real products have no photo field, so consistent Lucide icons replace the concept's sample food images; no invented product/photo mappings. Copy: Takeout, exact Philippine peso values, amount received, shortfall feedback and retained completion change.
- Payment and order details were reviewed at readable screenshot size in addition to full composition; screenshots and DOM checks confirm 540/1000/460, shortfall 40, exact change 0, disabled underpayment, responsive controls and zero horizontal overflow at 390 and 768px. Main action remains reachable by normal vertical scroll on phones.
- Browser: synthetic failed submission preserves quantities and cash, successful retry keeps change visible, server search preserves the cart, clear confirmation is keyboard usable, and service selection works by keyboard. Final console warning/error log is empty. Unit tests additionally cover price review, decimal precision, next-order cash reset and branch changes.
- Limits: no real sale created, no backend modifications, no new photo management, no native screen-reader run. Cash tender amount/change are local checkout calculations, not persisted sale fields. Existing app permissions, branches, sidebar, price review and retry contracts remain authoritative.

Verification: 123 frontend test files / 547 tests passed; focused sales suite 13 files / 44 tests; feature ESLint, TypeScript, formatting and production build passed. Browser fixtures are disposable and do not write to the application database.

final result: passed
