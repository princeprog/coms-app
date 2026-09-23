# COMS frontend instructions

## Required project skill

Before creating, modifying, reviewing, or refactoring Next.js frontend code, read and follow:

`../.agents/skills/nextjs-clean-architecture/SKILL.md`

## Context recovery after compaction

When a conversation is compacted, resumed from a summary, or prior context is uncertain, reread this file and the complete applicable frontend skill from `../.agents/skills/` before continuing. Recheck the current repository state afterward; summaries describe prior work but do not replace these instructions or live source files.

## Repository expectations

- Inspect the existing routes, components, styling, and package scripts before making changes.
- Preserve the established frontend architecture and UI conventions.
- Keep changes scoped to the requested feature and avoid unrelated refactoring.
- Reuse existing components and utilities before introducing new abstractions.
- Keep loading, empty, error, and responsive states in mind for user-facing changes.
- Run the focused checks relevant to the files changed before considering the work complete.

## COMS Obsidian project knowledge

For COMS work, read `C:\Users\Al Prince\Documents\Obsidian Vault\Projects\COMS\Home.md` first. Then read the linked architecture or workflow notes relevant to the change, plus `Delivery/Progress.md` and `Decisions/Architecture Decisions.md` when planning or changing implementation. Update the Obsidian progress notes as implementation milestones are completed. Never put credentials, tokens, or database backups in the vault.
