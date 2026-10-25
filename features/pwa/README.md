# PWA integration contract

This feature owns production service-worker registration, install/update controls and public shell precaching. It does not persist business data or credentials.

Parent route requirement: create `app/offline-pos/page.tsx` outside `(authenticated)`, with `export const dynamic = "error"`. Render a generic shell only; access user/branch/menu data after hydration via the offline runtime. No cookies, server auth loaders, server-fetched personal data, or authenticated layout imports. The production build fails closed unless Next prerenders `/offline-pos` as a static route. Its built HTML is copied to `/pwa/offline-pos.html`, never downloaded from an authenticated route. Next's public static JS/CSS/fonts are precached for hydration, including lazy chunks; no `.rsc`, API JSON, source maps, other HTML or server output is included.

## Parent/runtime exports

- `registerPwaUpdateSafetyCheck(owner: "cart" | "outbox", check: () => boolean | Promise<boolean>): () => void` from `@/features/pwa/services/update-safety`. Call in an effect and return the disposer. Both owners must register in **every open window**; missing owners, rejected reads, timeouts or any false result block activation. Read the latest cart/ref and durable pending outbox at check time. Multiple checks per owner are combined with AND. Never return true for an unknown state. A non-POS window can register a cart check only if it knows it has no draft; the outbox still needs a durable check. No default assumption that non-POS means safe.
- `getPwaOfflineStatus(): Promise<PwaOfflineStatus>` from `@/features/pwa/services/registration`. Status includes `ready`, `cachedAssets`, `totalAssets`; readiness means all public shell assets are present, not that the user has a valid offline session/menu/shift.
- `PwaProvider` and `usePwa` from `@/features/pwa/components/pwa-provider`. Root layout already mounts the provider. `usePwa()` exposes `offlineStatus`, `updateAvailable`, `supported`, `error`, `refreshOfflineStatus`.
- Window event `coms:pwa-status`, a `CustomEvent<PwaOfflineStatus>`, emitted when readiness is refreshed. Poll `getPwaOfflineStatus` if subscribing after initial registration.

## Worker protocol

Send messages with a `MessageChannel` port: `COMS_PWA_STATUS` returns `{ type: "COMS_PWA_STATUS", ready, cachedAssets, totalAssets }`. `COMS_PWA_APPLY_UPDATE` is sent to the **waiting** worker; it requests `COMS_PWA_CHECK_UPDATE_SAFETY` from every window, then returns `{ applied: boolean }`. The provider answers checks using the registry above. Unknown or unresponsive windows block updates. There is no unconditional skipWaiting and no automatic page reload. Users explicitly apply updates; after activation they may reload when ready.

Navigation is network-only with no-store. On network failure only `/pos`, `/offline-pos`, and the manifest start URL `/?source=pwa` receive the generic shell. Other pages receive a small reconnect page. RSC, server actions, API requests and credential-bearing requests are never cached. Offline Next client navigation is not intercepted: the POS owner must use a full document navigation to `/offline-pos` when moving into the offline workflow.

Build: `pnpm build` runs Next then `scripts/build-pwa.mjs`. Each public asset includes a SHA-256 revision and subresource integrity digest. A deployment that serves different bytes fails installation rather than caching an unexpected response. Generated `public/sw.js` and `public/pwa/offline-pos.html` are ignored and must be deployed from the build output. Development never registers a worker. Use a separate origin for development and production testing to avoid an already-installed production worker controlling a dev server.

## Verification

`pnpm exec vitest run features/pwa` exercises cache boundaries, update owners and build assembly. `node features/pwa/pwa-browser.mjs` runs the real bundled Workbox worker and client registration in Chromium against an isolated public-asset fixture; it verifies cookie-free downloads, cache contents, offline JS/CSS, fallback scope, cart/outbox/multiple-window update blocking, explicit activation and cache eviction readiness. It does not represent real backend checkout.

After the parent builds and starts `coms-api/test/offline-pos-browser-fixture.cjs`, run `node features/pwa/production-browser.mjs`. Defaults: fixture JSON at `../coms-api/node_modules/.cache/coms-offline-browser/fixture.json`, origin `https://localhost:3445`, Edge headless. Optional `PWA_FIXTURE_FILE`, `PWA_APP_URL`, `PWA_BROWSER_CHANNEL`. The fixture must contain its disposable `databaseName`, `origin`, `email`/`password` (or `cashier.email`/`cashier.password`) and optionally `branchId`. This harness signs in to the real disposable API, checks the production manifest/cache/cold offline hydration/install controls, and temporarily appends a comment to the local generated worker to verify waiting-update UI. It restores that file in `finally`; do not rebuild while it runs. It records actual browser persistence policy without simulating a grant. No checkout or business-data writes. Evidence and screenshots go to ignored `test-results/pwa-production/`.

The browser can naturally activate a waiting worker after every app window closes. This feature never clears IndexedDB or forces a page reload; durable outbox schema compatibility remains the offline-runtime owner's responsibility.

References: [Workbox injectManifest](https://developer.chrome.com/docs/workbox/modules/workbox-build), [Workbox precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching), [Next manifest and service worker guidance](https://nextjs.org/docs/app/guides/progressive-web-apps).
