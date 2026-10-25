# Staff management

The Staff row menu opens a centered modal for viewing and managing an account. It uses the same width, header spacing, close control, and bounded scrolling as Add staff. Profile fields are immediately visible; role and branch access retain separate saves. The footer stays visible while the content scrolls on smaller screens.

- Close, Done, Escape, and outside dismissal preserve unsaved-change confirmation. Closing is blocked while a profile, role, or branch save is pending. Focus returns to the row action trigger.
- Successful creation, profile edits, role changes, and branch changes use the shared bottom-right Sileo success toast in both themes. Creation closes its modal; editing refreshes account data while keeping management open.
- Failed requests keep the draft and display the existing inline error without a success message. Account permissions, self-management restrictions, and destructive confirmations remain unchanged.

## Verification

Run the staff tests with `pnpm exec vitest run features/staff --maxWorkers=4`. After `pnpm build`, run `node test/staff-modal-browser.cjs`. The browser scenario uses a loopback synthetic API and fictional staff only, with no development database writes. It checks 320/390/768/1440px layouts in both themes, keyboard focus containment/return, dirty dismissal, failed-save recovery, success toasts, and refreshed data. Screenshots are saved under `test-results/staff-modal`.
