# Direct purchase restocking

Open **Inventory → Commissary → Restock** to record stock bought from a grocery or other store. Select the purchase date, optionally identify the store/receipt, choose active stock, enter quantities and unit costs, review, and confirm. The date defaults to today in Manila; stock posts when confirmed. The form uses the item's existing unit and exact decimal totals in PHP.

**View purchases** opens `/inventory/purchases`, with server search by store/receipt, inclusive date filters, newest/oldest order and 10/30/50 rows. Each three-dot menu opens a URL-addressable read-only detail modal. Inventory activity identifies these movements as **Purchase received**; the detail action is shown only with receiving read permission.

Receiving create permission plus stock read permission exposes Restock. Receiving read permission exposes history/details and costs. No supplier account or suppliers.read is required. Branch receiving remains the dispatch workflow.

Failed confirmation preserves the form and idempotency key for retry; changed data receives a new key. Pending submission prevents duplicate clicks and dismissal. Dirty forms require discard confirmation. A success toast confirms the purchase and the inventory refreshes. The server is authoritative for stock eligibility and all write permissions.

## UI review

| Before                                               | After                                                              | Why                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Direct grocery stock had no dedicated receiving flow | Restock beside the Inventory heading                               | Obvious entry point without a new top-level module   |
| Supplier delivery required a registered supplier     | Optional store/receipt fields                                      | Reflects purchases without a supplier delivery       |
| No purchase-specific audit view                      | Server-paginated history and read-only detail modal                | Traceable stock additions without crowding Inventory |
| Generic receipt movement                             | Purchase received with permission-gated row action                 | Clear source without leaking costs                   |
| Potentially ambiguous stock-changing save            | Review with quantities, exact PHP totals and explicit stock effect | Clear confirmation before posting                    |

Keyboard and responsive checks use `node test/purchases-browser.cjs` against the disposable loopback fixture after `pnpm build`. The fixture simulates purchases and inventory for UI testing; real transaction/concurrency guarantees are verified in coms-api's disposable PostgreSQL integration tests. Captures are saved to ignored `test-results/purchases-ui/`.

Verification: frontend typecheck, focused lint and production build passed. 134 focused purchase/inventory/receiving/fixture tests passed. The browser check passed keyboard stock selection, inline errors, dirty discard protection, failed-save retry, one stock update, visible success toast/activity, URL details, search, 10/30/50 pagination and responsive light/dark layouts at 390/768/1440px. No real inventory writes were made by UI tests.
