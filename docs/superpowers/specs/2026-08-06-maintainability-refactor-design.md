# Maintainability refactor (depth C) — design

**Date:** 2026-08-06  
**Status:** Approved  
**Approach:** Layered commits (方案 2)

## Goal

Improve robustness and long-term maintainability of `apps/web` via shared primitives, admin UI reuse, oversized-file splits, and typed i18n — **without UX or behavior changes**.

## Layers

1. **Shared primitives** — prose classes, UTC year grouping, upload helpers, `useStaleRequest`, `useDebouncedValue`, extend `EmptyState`
2. **Admin UI reuse** — `ConfirmDeleteDialog`, `ChangePasswordForm`, admin posts fetch helper
3. **Split oversized files** — media page, post-editor, comment-section (extract only; same UX)
4. **Typed i18n** — path unions for `t` / `useT` / `Trans`; dedupe `commentReplyingTo`

## Non-goals

- MDX pipeline rewrite
- Unifying admin vs public comment display names
- New state libraries / full admin data-layer rewrite
- Visual redesign or copy changes (except key path aliases)

## Success criteria

- `tsc --noEmit` and `check:i18n` pass
- Public and admin flows behave as before
- Duplicated constants/loops/dialogs reduced; three large files become readable shells
- Call sites rely less on `as string` casts where typed i18n lands
