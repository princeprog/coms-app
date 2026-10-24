# Delivery count reminders

Dispatch senders can use **Remind branch to submit count** from the row menu or the Receiving section of a dispatch detail page. The action appears only for authorized users and an active branch's awaiting/overdue count. The API determines eligibility and recipients.

The control disables while sending and during the shared 30-minute cooldown. It shows when another reminder is available and when the last reminder was sent, in PHT. Uncertain failures preserve the request key for retry. Successful sends refresh the existing list/detail while preserving URL filters. A count already submitted or awaiting review is not eligible.

Branch recipients see **Delivery count pending** in their existing bell/inbox and can open the dispatch to count it. Marking the notification read does not change the delivery. Activity shows who sent each reminder and when.

API metadata is optional for rollout compatibility. Deploy this frontend before the new API can create reminder events; see `coms-api/docs/count-reminders.md` for migration and rollout details.

Checks: dispatch and notification Vitest suites; `pnpm exec tsc --noEmit`; scoped ESLint/Prettier; `pnpm build`; `node test/count-reminder-browser.cjs` after the build. The browser script uses loopback fixtures only and saves screenshots under ignored `test-results/count-reminders/`. Real recipient, permission, concurrency and transaction rules are covered by API database integration tests.
