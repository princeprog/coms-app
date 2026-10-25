# Notifications

The authenticated header bell shows the current user's unread count and latest 10 notifications. Its popover opens below the trigger. `/notifications` provides All/Unread views, Dispatches/Daily reports filters, and server pagination with 10/30/50 rows. The account-menu Notifications link opens the same inbox.

The header polls every 30 seconds while the document is visible, refetches on focus/reconnection and opening, and shares its cached count with the inbox. Lists refresh only while their surface is mounted/open. Keys include user identity, Server Actions verify that identity against the cookie session, and the existing logout path cancels/clears query data. The API rechecks ownership, grants, and branch access on every request.

Links include a temporary `notification_id` query parameter. The persistent shell marks the notification read after arriving, then removes that parameter while preserving the record's other query parameters. This keeps the normal unsaved-navigation guard authoritative: cancelling preserves both the draft and unread state. Read failures use the shared Sileo toast adapter and preserve unread data. Opening the same notification again retries. See [Toasts and appearance](toasts-and-theme.md).

The inbox keeps its server snapshot until hydration, because the header can fill the shared count cache before the streamed inbox hydrates. Loading, empty/filter-empty, refresh, and retry states are distinct; an unavailable unread count never becomes a fabricated zero. Dates use Asia/Manila and explicitly display PHT. No sounds, push, email, preferences, or sales-completion alerts are added.

## Verification

- `pnpm exec vitest run features/notifications` covers links, query normalization, identity-bound cookie relay, invalid inputs/responses, deferred bell fetching, polling visibility, user cache isolation, visible read-error feedback, and streaming hydration.
- `pnpm build` followed by `node test/notifications-browser.cjs` checks the production build against a disposable loopback API fixture: below-trigger bell, keyboard/Escape focus, pagination, filters, report/dispatch links, dirty-form cancellation/confirmation, read failure/retry, and empty states. It also captures 1440/768/390/320px and dark layouts in ignored `test-results/notifications/` and fails on page errors or horizontal overflow.
- Browser records are synthetic; real recipient authorization, transactional writes, idempotency and migration behavior are covered by the API disposable PostgreSQL tests. No live operations are created by these browser checks. Native screen-reader and physical-device testing were not performed.

Release the notification migration and API before this app. Existing activity is not backfilled: the inbox begins receiving notifications only for new supported workflow transitions.
