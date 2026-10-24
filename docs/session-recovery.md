# Automatic session recovery

The persistent authenticated shell now observes the current-user query instead
of only seeding its cache. It checks every 60 seconds while the page is visible,
and on focus or reconnection. A check rotates the access cookie only when the API
returns 401, using the existing single-flight promise and exclusive cross-tab
Web Lock. Cookies stay HttpOnly; no tokens are exposed to browser JavaScript.

After a successful rotation, a local event invalidates non-auth query reads and
refreshes the server-rendered route in a React transition. This preserves mounted
form state. Business mutations are never automatically replayed. Healthy session
checks do not trigger route refreshes.

The authenticated error boundary previously only reset its error state, which
could reuse the same failed server response. **Try again** now restores/checks
the session, refreshes the route and then resets the boundary. Background recovery
also clears a stale boundary. Temporary outages preserve cookies and remain
retryable; expired or revoked refresh sessions return to sign-in.

## Verification — 2026-10-24

- Focused auth, authenticated error boundary and persistent-shell tests: 67 passed.
- TypeScript, scoped ESLint and the production Next.js build passed.
- `node test/session-maintenance-browser.cjs`: four scenarios passed against a
  production Next.js build with a loopback fixture API: automatic rotation with
  an unsaved form, coordinated two-tab recovery, retry after a refresh outage,
  and revoked-session sign-in. These use no real accounts or database.
- Full `pnpm test`: 158 files passed and four failed. Daily-report editor, staff
  creation and supplier-receipt dialog timing failures all passed when rerun
  serially (19 tests). `components/site-header.test.tsx` still fails to resolve
  `server-only`; the identical failure was verified on the unchanged previous
  commit `8dd965c`. The full suite is therefore not reported as passing.

Run the browser scenarios after `pnpm build`. They start and stop their own local
server and use Chrome through Playwright.
