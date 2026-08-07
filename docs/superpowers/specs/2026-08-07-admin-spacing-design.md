# Admin Dashboard & Comments Spacing Design

**Date:** 2026-08-07  
**Status:** Approved (user: continue + expand to comments)

## Goal

Unify admin dashboard and comments inbox spacing to shadcn dashboard rhythm: `flex` + `gap-*` (no `space-y-*`), consistent 4/6 scale, full Card composition for comment cards.

## Dashboard

| Layer | Before | After |
|-------|--------|-------|
| Page root | `space-y-8` | `flex flex-col gap-6` |
| Statistics section | `space-y-4` | `flex flex-col gap-4` |
| Stat / chart grids | `gap-4` / `gap-6` | both `gap-4` |
| Recent posts | `mb-4` + `space-y-2` | `flex flex-col gap-4`; list `flex flex-col gap-2` |
| Card internals | ad-hoc `pb-2` / `pb-3` / `py-4` | default `--card-spacing` |

Files: `apps/web/src/app/admin/dashboard/page.tsx`, `apps/web/src/components/admin/post-stats.tsx`  
Loading skeleton mirrors loaded layout 1:1. Layout chrome (`p-4 md:p-8`) unchanged.

## Comments inbox cards

Problems:
- Everything dumped in `CardContent` with `p-4` (double-pads against Card’s `py`)
- Vertical rhythm via `mt-*` instead of `gap`
- List uses `space-y-3`
- Skeleton uses `border` + flat `p-4` instead of Card chrome

Target structure per card:

```
Card
  CardHeader — avatar + name (CardTitle) + unread dot + time (CardDescription)
  CardContent flex flex-col gap-3 — thread context, body, source meta
  CardFooter justify-end — mark read / delete (bg-transparent; keep border-t)
```

List: `flex flex-col gap-4`. Skeleton mirrors the same slots/heights.

Files: `apps/web/src/app/admin/comments/page.tsx`, `apps/web/src/components/ui/loading.tsx`

## Out of scope

Global admin layout padding, other admin pages, Card primitive changes.
