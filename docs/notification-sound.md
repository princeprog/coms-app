# Notification sound

New unread notifications play one brief two-note chime in the focused, visible COMS tab. The existing 30-second notification polling is reused; this is not push delivery and does not run when the app is closed. The unread badge remains the visual cue.

Sound defaults to on. The bell popover has a **Sound on / Sound off** toggle, saved per signed-in user in this browser and synchronized between its tabs. Storage restrictions fall back to a tab-only preference. Sound starts only after a click or keypress in COMS, following browser autoplay restrictions. Unsupported or blocked audio never interrupts notification loading.

Initial unread items, page reloads, navigation, marking items read, and re-enabling sound are silent. A persistent shell observer compares the latest unread timestamp, so an arrival is detected even when the total unread count stays the same. Alerts received by an unfocused tab are not replayed when that already-observed response is reused. Only the focused tab sounds. Failed polling preserves the last successful baseline; recovery can announce newly discovered unread items.

The API adds optional `latest_unread_at` to the existing unread-count response; no migration or extra polling endpoint is required. Older API responses fall back to increases in unread count (which cannot distinguish simultaneous arrivals and reads). No notification content or credentials are saved in browser storage, and reading/counting behavior is unchanged.

Checks: notification feature tests, types/lint/formatting/build, API notification integration tests, and `node test/notification-sound-browser.cjs` against a production build with synthetic loopback data. Browser checks exercise actual Web Audio oscillator starts, a real poll interval, mute persistence, no repeated sound, and desktop/mobile controls. They do not send real notifications or assert the physical speaker volume.
