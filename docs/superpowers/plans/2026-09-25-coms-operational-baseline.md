# Operational redesign baseline

- Starting commit: `a7a0b9bad6269215384853e2daedaeef4c1ed018` on `dev`; working tree was clean.
- Frontend tests: `pnpm test` — 379/379 across 100 files.
- Lint: `pnpm lint` — pass.
- Production build: `pnpm build` — pass; all 18 existing routes compile.
- TypeScript: `pnpm typecheck` — pass.
- Design references: user-supplied examples are archived under `Obsidian Vault/Projects/COMS/Design/References/` and linked from the COMS design note.

## SHA-256 protection baseline

| Protected file | Starting SHA-256 |
|---|---|
| `app/(authenticated)/dashboard/page.tsx` | `D5FC2E136A34A40C9AB8539A819AC78A37B201F5C857A00483281152955A36CD` |
| `app/(authenticated)/dashboard/data.json` | `A8DCFBE6D014AB33ADB4BE2CCC221313D0BBF5D1D69A06BC08527B66148E849A` |
| `components/section-cards.tsx` | `1E5D739062B8BE7D2B9248A032076B4D970536D57022663C536C1A2F8B599B80` |
| `components/chart-area-interactive.tsx` | `84288A4CBF269800FE9A7D7DCEF7CC8542CEA2EA35C41291E963FAD3EAC80E66` |
| `components/data-table.tsx` | `6139EF2F8D3F61B0D9F8DAABCABF026C77C68975A6C4C6222619F678A8CA7CEA` |
| `components/app-sidebar.tsx` | `7ADDE3B8EF72BE112E8D6E99FC559815ACCC453F365C33A2CB52F5B1AFB17E2E` |
| `components/site-header.tsx` | `7BF53792096DFBBAE88402F3851F5679DFA349DA707C3BCE036FC168B020523D` |
| `app/globals.css` | `B664FB7ED35395CDF1F9E46F54A7F4124C28FE4A3242A38C481480F1FADC4E8D` |

The stylesheet hash is expected to change only for additive opt-in operational recipes. All other protected hashes must match at completion. Do not store browser screenshots containing real account details. Capture visual comparisons from disposable test fixtures.
