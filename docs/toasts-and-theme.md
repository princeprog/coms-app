# Toasts and appearance

COMS uses one Sileo renderer in the root layout, inside the existing next-themes provider. It remains mounted across authenticated and public routes. Feature code imports `toast` from `@/components/ui/toast`; do not mount feature-level renderers or import Sileo directly.

```tsx
toast.add({
  type: "success",
  title: "Branch created.",
  description: `Code: ${code}`,
});
```

Supported types are success, error, warning and info (default). `add` returns an ID for `toast.dismiss(id)`; `toast.clear()` clears the queue. Messages over 30 characters move into the expanded description under a short severity heading, preserving their complete text and any existing description. Keep field validation and required confirmations in their existing controls.

Toasts appear at the bottom right with safe-area gutters, show three at a time and queue additional messages in arrival order. Success/info expire after six seconds; error/warning after eight. Queued time does not consume their display duration. Hover or keyboard focus pauses expiry, which resumes with the remaining time. Each toast supports an explicit dismiss button, focused Escape and swipe dismissal. Descriptions expand automatically and remain available. Colors follow the live COMS semantic tokens; changing appearance does not recreate messages or restart timers.

The shared theme selector appears beside the header bell and at the top right of sign-in and password-change screens. Light, Dark and System choices use next-themes' existing `theme` localStorage preference. System is the default and follows the OS; explicit choices override it. Selection closes the menu and returns focus. The former D shortcut has been removed. This is a browser-local preference, not an account setting.

## Pinned Sileo compatibility patch

Sileo is pinned to 0.1.6 in package.json. pnpm-workspace.yaml applies `patches/sileo@0.1.6.patch` on every install. Both ESM/CommonJS entrypoints and declarations are patched. The patch supplies independent IDs, a `visibleToasts` queue limit, remaining-time accounting, responsive SVG measurement, keyboard/focus support, a close button, semantic markup and reduced SVG motion. COMS overrides in `app/toast.css` outrank the package's injected styles and provide theme colors, sizing, safe-area placement and focus states.

Before upgrading Sileo, compare upstream behavior against each patched capability and rerun the integration checks. Do not silently drop the patch. Keep app-specific colors and copy in COMS, not in the package patch.

References: [Sileo documentation](https://sileo.aaryan.design/docs), [renderer API](https://sileo.aaryan.design/docs/api/toaster), [styling](https://sileo.aaryan.design/docs/styling).

## Checks

- `pnpm exec vitest run components/ui/toast.test.tsx components/shared/theme-selector.test.tsx components/site-header.test.tsx` checks queue identity/timing, dismissal, readable messages, theme choices/persistence/System behavior and the visible header control.
- `pnpm build` then `node test/toast-theme-browser.cjs` runs the production app against the loopback synthetic API. Captures and appearance measurements go to `test-results/toast-theme`. It exercises real UI actions, live theme changes, responsive layouts, keyboard dismissal, queued export failures and success across navigation. It never writes development database records.
- Run `pnpm typecheck`, changed-file ESLint/Prettier and the affected feature tests. The production build configuration skips TypeScript validation, so typecheck must run separately.

Automated accessibility checks cover roles, accessible text and keyboard behavior; they do not replace a manual assistive-technology audit.
