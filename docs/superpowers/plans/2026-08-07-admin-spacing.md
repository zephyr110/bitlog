# Admin Spacing Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Apply shadcn flex/gap spacing on admin dashboard and restructure comments inbox cards.

**Architecture:** Local className-only changes; keep Card default `--card-spacing`; mirror loading skeletons.

**Tech Stack:** Next.js app router, Tailwind, existing shadcn Card.

## Global Constraints

- Prefer `flex flex-col gap-*` over `space-y-*` / ad-hoc `mt-*`/`mb-*` for vertical stacks.
- Page rhythm `gap-6`; within-section / grids `gap-4`; tight lists `gap-2` or `gap-3`.
- Do not change `apps/web/src/app/admin/layout.tsx` padding.
- Do not invent new design tokens.

---

### Task 1: Dashboard page spacing

**Files:**
- Modify: `apps/web/src/app/admin/dashboard/page.tsx`

- [x] Replace page `space-y-8` → `flex flex-col gap-6` (loaded + loading)
- [x] Statistics section `space-y-4` → `flex flex-col gap-4`
- [x] Drop CardHeader `pb-2` / `pb-3` overrides; drop recent-post `py-4` / `mb-4`
- [x] Recent posts block → `flex flex-col gap-4`; list → `flex flex-col gap-2`
- [x] Align loading skeleton gaps/paddings to match

### Task 2: PostStats chart grid

**Files:**
- Modify: `apps/web/src/components/admin/post-stats.tsx`

- [x] Chart grid `gap-6` → `gap-4`
- [x] Update dashboard loading chart grid to `gap-4`

### Task 3: Comments inbox cards

**Files:**
- Modify: `apps/web/src/app/admin/comments/page.tsx`
- Modify: `apps/web/src/components/ui/loading.tsx`

- [x] List `space-y-3` → `flex flex-col gap-4`
- [x] Restructure each comment into CardHeader / CardContent / CardFooter
- [x] Remove `CardContent className="p-4"`; use default horizontal padding
- [x] Content stack `flex flex-col gap-3` (no `mt-*`)
- [x] Footer `justify-end gap-2 bg-transparent`
- [x] Mirror structure in `CommentInboxCardSkeleton` (ring chrome, gap rhythm)

### Task 4: Verify

- [x] Spot-check class consistency (no leftover `space-y` on these surfaces)
- [x] Loading skeletons still mirror live layouts
