# Dispatch receiving follow-up UI

Dispatch sending includes a required **Estimated arrival (PHT)** input defaulting to 24 hours ahead. The count modal records the receiving date and time automatically when the branch confirms its count; it has no delivery-date picker and omits `delivery_date` from the request. The API uses the submission date in Asia/Manila, separately from the dispatch timestamp. Overdue counts still require a reason, including when the deadline passes while the review is open. Field errors preserve the draft and focus the missing input; review remains in the same modal. The server validates deadlines, dates, permissions and immutable retry payloads.

The Dispatches page has one server-backed table with **All dispatches**, **Pending receiving**, **Overdue** and **Count review** views. A single status badge and estimated arrival replace the former duplicate list/badges. Search, filters and 10/20/30/50 pagination share URL state, with one pagination footer. Switching views clears conflicting lifecycle/discrepancy filters while retaining search, branch and page size. Colored filter options open below their trigger. The directory refreshes every 30 seconds while visible and on focus, pausing during query changes. Tasks remain visible independently of notification read state; overdue notification URLs open the matching branch/view. Loading, error/retry and empty states use the standard server directory flow.

Dispatch details show the deadline, receiving status, receiving date, saved late-count quantities and units, reasons and affected reports. Existing recorded dates remain unchanged. Independent reviewers can post saved counts after submitted reports are returned, or return counts with a reason. Approved reports keep the count on hold; this release does not include historical approved-report correction. Saved counts do not affect inventory until posting succeeds. Retries keep the original saved date and timestamp even after midnight or the deadline.

Daily reports show pending deliveries and require a not-arrived-by-day-end reason for each uncounted delivery. Report history retains submitted exceptions. A saved arrived count under review blocks submission and approval on the server; reasons cannot bypass it. No automatic receiving or assumed zero quantities are introduced.

The implementation follows the existing Server Action, feature service, TanStack hook and shadcn/Base UI boundaries. Authorization and branch scope are checked again by the API. Deploy the matching migration/API before this frontend.

## Verification and limits

- Automatic receiving-date update (2026-10-24): 24 focused frontend tests, changed-file ESLint, TypeScript and production build passed. The production browser fixture verifies no date picker, automatic-date review copy, overdue reason/focus, draft retention and responsive/dark layouts. No live counts were submitted. No database migration is needed for this update.
- Dispatch/report/notification checks: 32 files, 146 tests passed, including independent reviewer visibility, exception validation and failure retention.
- Operational fixture checks: 24 tests passed. Changed-file ESLint, formatting, TypeScript and production build checked.
- `node test/receiving-followup-browser.cjs` uses a production Next server on an ephemeral loopback port and synthetic API data. It checks pending filters/page size, overdue count validation and focus, review draft retention and discard, approved-report holds, correction reason validation and responsive/dark layouts. No live operational mutations are made.
- Screenshots: ignored `test-results/receiving-followup/`, including 1440/768/390/320px review screens and a narrow pending list. No page errors or horizontal overflow in these states. Native screen-reader, physical-device and real-browser database writes are not part of this check; database transactions are covered independently by API integration tests.


The directory simplification was subsequently checked with 16 dispatch test files / 94 tests and the updated production browser fixture. It verifies the single table, keyboard view changes, preserved receiving filters through pagination, empty results/reset, and desktop/mobile/dark layouts. See design-qa.md for the before/after review.


Create dispatch review now groups the destination branch, delivery person and estimated arrival above a compact stock list. Estimated arrival is the user-facing name for the existing `receive_by` timestamp; the 24-hour default, future-time validation and overdue/reminder threshold remain unchanged. Form errors retain input and focus the affected field. The modal fixture checks review/back navigation, missing courier/arrival validation and responsive layout without sending a dispatch.
