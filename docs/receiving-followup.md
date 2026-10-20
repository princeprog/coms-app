# Dispatch receiving follow-up UI

Dispatch sending includes a required **Receive by (PHT)** input defaulting to 24 hours ahead. The count modal records the actual delivery date and requires a reason for late counts. Field errors preserve the draft and focus the missing input; review remains in the same modal. The server validates deadlines, dates, permissions and immutable retry payloads.

The Dispatches page includes a persistent **Pending receiving** section with server filters, 10/30/50 page sizes, loading/error/retry/empty states and visible 30-second refresh. Colored status options open below their trigger. Receiving tasks remain visible regardless of notification read state. Overdue notification links open the correct branch/status context.

Dispatch details show the deadline, receiving status, actual delivery date, saved late-count quantities and units, reasons and affected reports. Independent reviewers can post saved counts after submitted reports are returned, or return counts with a reason. Approved reports keep the count on hold; this release does not include historical approved-report correction. Saved counts do not affect inventory until posting succeeds.

Daily reports show pending deliveries and require a not-arrived-by-day-end reason for each uncounted delivery. Report history retains submitted exceptions. A saved arrived count under review blocks submission and approval on the server; reasons cannot bypass it. No automatic receiving or assumed zero quantities are introduced.

The implementation follows the existing Server Action, feature service, TanStack hook and shadcn/Base UI boundaries. Authorization and branch scope are checked again by the API. Deploy the matching migration/API before this frontend.

## Verification and limits

- Dispatch/report/notification checks: 32 files, 146 tests passed, including independent reviewer visibility, exception validation and failure retention.
- Operational fixture checks: 24 tests passed. Changed-file ESLint, formatting, TypeScript and production build checked.
- `node test/receiving-followup-browser.cjs` uses a production Next server on an ephemeral loopback port and synthetic API data. It checks pending filters/page size, overdue count validation and focus, review draft retention and discard, approved-report holds, correction reason validation and responsive/dark layouts. No live operational mutations are made.
- Screenshots: ignored `test-results/receiving-followup/`, including 1440/768/390/320px review screens and a narrow pending list. No page errors or horizontal overflow in these states. Native screen-reader, physical-device and real-browser database writes are not part of this check; database transactions are covered independently by API integration tests.
