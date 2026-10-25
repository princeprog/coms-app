# Staff management

The Staff table has one three-dot menu per manageable account with five permission-aware actions: Edit profile, Assign role, Manage branch assignments, Reset password, and Deactivate staff. Manage staff and its combined workspace have been removed. Read-only operators see the account information in the table without an action menu.

Each action opens its own focused centered modal. Profile, role and branch forms share consistent spacing, a visible account identity, a scrollable body and a Save/Cancel footer. Successful saves close the modal, refresh the directory and show the shared success toast. Failed saves retain the draft with an inline error. Dirty dismissal offers Keep editing/Discard; pending saves block dismissal and duplicate submission. Focus returns to the row trigger.

Role assignment requires role-catalog access. Self role/branch/security changes and unauthorized Super Admin changes remain hidden. Inactive staff have no reset-password or deactivation action. API validation and branch scoping remain authoritative.

Password reset opens its confirmation directly, then shows the temporary password once in the same modal. Closing unmounts and clears it; a clipboard failure provides manual-copy guidance. Deactivation is separated visually in the menu, requires confirmation and shows success only after the API completes. Both confirmations preserve failures and block dismissal during a request.

## Verification

Run `pnpm exec vitest run features/staff --maxWorkers=4`. After `pnpm build`, run `node test/staff-modal-browser.cjs`. The browser scenario uses a loopback synthetic API and fictional staff only. It checks all five modals at 320/390/768/1440px in both themes, keyboard focus containment/return, dirty dismissal, failed-save recovery, profile/role/branch saves, one-time password display, deactivation and success feedback. Screenshots are saved under `test-results/staff-modal`.
