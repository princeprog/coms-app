# COMS frontend

## Local authentication setup

Run the NestJS API on port `3001` and the Next.js app on port `3000`:

```powershell
# Terminal 1: coms-api
$env:PORT = "3001"
$env:WEB_ORIGIN = "http://localhost:3000"
pnpm start:dev

# Terminal 2: coms-app
Copy-Item .env.example .env.local
pnpm dev
```

`COMS_API_BASE_URL` is server-only. TanStack auth hooks call server actions in
`features/auth/services/`, which call Nest and relay only the HttpOnly access
and refresh cookies. Tokens never enter JavaScript storage.

Set `COMS_AUTH_GATEWAY_SECRET` to the same generated 64-character hexadecimal
secret used by Nest, in `.env.local` or deployment secrets. Do not overwrite an
existing local environment file when copying examples. Generate production
secrets independently; never use a `NEXT_PUBLIC_` name for gateway credentials.
Browser headers cannot override the configured gateway header.

Backend redirects are rejected so gateway credentials and token-changing requests
cannot be forwarded to a redirected destination. Auth responses are validated at
the server boundary and extra user fields are stripped before reaching the client.
Logout clears cookies only after the API confirms its documented 204 response.

Auth components call TanStack hooks, which call feature services and endpoint
constants. Server pages call feature server services directly. Auth mutations
never automatically retry. A shared exclusive Web Lock coordinates all tabs;
waiting is limited to 30 seconds and each backend request to 10 seconds. Recovery
rechecks `me` while holding the lock before rotating. Successful logout cancels
and clears cached user data and broadcasts a token-free logout event.
If browser privacy settings block that broadcast, the initiating tab still
completes logout; other tabs discover the revoked session on their next check.

Use modern browsers with Web Locks over HTTPS or localhost. If unavailable,
automatic rotation is disabled and **Sign in again** completes logout before
returning to login. Rejected recovery clears cookies and refreshes the route,
including when already on `/`. Outages preserve cookies and offer retry.

## Verification and rollout

Run `pnpm test` and `pnpm build`. `pnpm test:auth-browser` runs against the
disposable HTTPS fixture described in `coms-api/docs/authentication.md`; it uses
Chrome and a dedicated database, not real accounts. Build both apps before
starting that fixture. Stop it after verification to remove its database.

Apply the API's additive migration first, then deploy API and frontend together
with matching gateway configuration. Old frontend instances will receive 403.

Existing unrelated checks remain: `pnpm typecheck` reports missing `cmdk`,
`@shadcn/react` components, `clsx`, `tailwind-merge`, and a resizable-panels API
mismatch. `pnpm lint` fails because the ESLint flat configuration is missing.
The build still skips type validation; authentication tests verify the changed
flow independently. Server auth outage logs contain only status and count.

Review verification (2026-09-22): 48 frontend tests, 52 API tests including the
isolated PostgreSQL suite, both production builds, and 10 HTTPS browser scenarios
passed. Browser coverage includes two-tab recovery, refresh versus logout, lost
refresh responses, outages, secure-cookie deletion, keyboard use, and mobile
layout. The existing typecheck/lint limitations above remain; a successful build
does not replace those checks.
