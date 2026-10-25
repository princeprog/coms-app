# Staff management

The Staff table has one three-dot menu per manageable account with five permission-aware actions: Edit profile, Assign role, Manage branch assignments, Reset password, and Deactivate staff. Manage staff and its combined workspace have been removed. Read-only operators see the account information in the table without an action menu.

Each action opens its own focused centered modal. Profile, role and branch forms share consistent spacing, a visible account identity, a scrollable body and a Save/Cancel footer. Successful saves close the modal, refresh the directory and show the shared success toast. Failed saves retain the draft with an inline error. Dirty dismissal offers Keep editing/Discard; pending saves block dismissal and duplicate submission. Focus returns to the row trigger.

Role assignment requires role-catalog access. Self role/branch/security changes and unauthorized Super Admin changes remain hidden. Inactive staff have no reset-password or deactivation action. API validation and branch scoping remain authoritative.

Password reset opens its confirmation directly, then shows the temporary password once in the same modal. Closing unmounts and clears it; a clipboard failure provides manual-copy guidance. Deactivation is separated visually in the menu, requires confirmation and shows success only after the API completes. Both confirmations preserve failures and block dismissal during a request.

## New staff and default password

Super Admin sets the shared onboarding password using **Staff → Default password**. The modal asks for a new default and confirmation (12–128 characters), keeps failed drafts, prevents duplicate saves, and clears entered passwords when closed. No saved password is displayed; share it with new staff privately. Only Super Admin may change this global setting.

Add staff asks for identity, role and branch assignments, with no password input. Set the default once before creating accounts; if settings cannot be loaded, retry before creating. The API always enforces this prerequisite. Changes affect accounts created afterward, including unassigned staff, without resetting existing accounts or changing the separate Reset password action.

New accounts require a password change. Login goes directly to /change-password; server route checks and API authorization prevent operational access until a different personal password is saved. The same page supports existing temporary-password recovery. Changing the password revokes prior sessions and issues fresh cookies.

Deploy the API and frontend together after applying migration 20261025235255_staff_default_password. This removes the password field from POST /staff; older clients sending it are rejected. The migration does not seed a credential or alter existing users.

## Verification

Run `pnpm exec vitest run features/staff --maxWorkers=4`. After `pnpm build`, run `node test/staff-modal-browser.cjs`. The browser scenario uses a loopback synthetic API and fictional staff only. It checks all five modals at 320/390/768/1440px in both themes, keyboard focus containment/return, dirty dismissal, failed-save recovery, profile/role/branch saves, one-time password display, deactivation and success feedback. Screenshots are saved under `test-results/staff-modal`.

Run `node test/staff-onboarding-browser.cjs` after building for the first-login redirect, direct-route protection, password change, initial admin setup, failed-save retry, keyboard focus and responsive theme checks. It uses synthetic credentials and no development records; captures are in `test-results/staff-onboarding`.
