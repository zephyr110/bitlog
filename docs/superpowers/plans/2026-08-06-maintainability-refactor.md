# Maintainability Refactor Implementation Plan

> **For agentic workers:** Implement layer-by-layer. Verify with `tsc` after each layer. Checkbox tasks track progress.

**Goal:** Surgical maintainability improvements across apps/web without UX changes.

**Architecture:** Extract shared primitives first, then reuse admin UI, then split oversized modules, then type i18n paths.

**Tech Stack:** Next.js 16, React 19, TypeScript, existing `@/lib` and `@/components` patterns.

---

### Task 1: Layer 1 — Shared primitives

**Files:**
- Create: `apps/web/src/lib/prose.ts`
- Create: `apps/web/src/hooks/use-stale-request.ts`
- Create: `apps/web/src/hooks/use-debounced-value.ts`
- Create: `apps/web/src/lib/upload.ts`
- Modify: `apps/web/src/lib/date.ts` (add `groupPostsByUtcYear`)
- Modify: `apps/web/src/components/ui/empty-state.tsx`
- Wire callers: post page, post-editor, archive-feed, timeline, media, media-picker, site-info-form, upload API, comments pages, comment-section, public empty states

- [ ] Add helpers / hooks
- [ ] Replace call sites
- [ ] `tsc --noEmit`

### Task 2: Layer 2 — Admin UI reuse

**Files:**
- Create: `apps/web/src/components/admin/confirm-delete-dialog.tsx`
- Create: `apps/web/src/components/admin/change-password-form.tsx`
- Create: `apps/web/src/lib/admin-posts.ts` (or hook)
- Modify: posts page, media page, settings page, settings-dialog, dashboard

- [ ] Extract + wire
- [ ] `tsc --noEmit`

### Task 3: Layer 3 — Split oversized files

**Files:**
- Split under `components/admin/media/*`, `components/admin/post-editor/*`, `components/blog/comment-*`
- Leave thin page/shell entrypoints

- [ ] Media split
- [ ] Post-editor split
- [ ] Comment-section split
- [ ] `tsc --noEmit`

### Task 4: Layer 4 — Typed i18n

**Files:**
- Modify: `apps/web/src/lib/i18n.ts`, `components/layout/trans.tsx`
- Dedupe `commentReplyingTo`
- Remove casts where inference allows

- [ ] Path types + overloads
- [ ] Dedupe keys
- [ ] `tsc` + `check:i18n`
