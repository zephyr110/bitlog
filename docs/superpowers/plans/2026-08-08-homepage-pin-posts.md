# Homepage Pin Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins pin/unpin posts so pinned items lead the homepage Latest posts grid by pin time, with a corner badge on pinned cards.

**Architecture:** Store pin state as nullable `posts.pinned_at`. Homepage uses a dedicated query that orders pinned rows first; Featured and archive/feed keep date-only ordering. Admin toggles via extended `PATCH /api/posts`.

**Tech Stack:** Turso/libSQL (`@zlog/database`), Next.js App Router, Lucide icons, existing admin i18n + `apiFetch` patterns.

**Spec:** `docs/superpowers/specs/2026-08-08-homepage-pin-posts-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/core/src/types.ts` | Add `pinnedAt: string \| null` to `Post` and `PostSummary` |
| `packages/core/src/mdx-utils.ts` | Pass `pinnedAt` in `toPostSummary` |
| `packages/database/src/content.ts` | Schema + migrate column; map fields; `setPostPinned`; `getHomepageLatestPosts`; preserve pin on `savePost` |
| `packages/database/src/index.ts` | Re-export new helpers |
| `apps/web/src/app/api/posts/route.ts` | Extend PATCH for `{ pinned: boolean }` |
| `apps/web/src/app/page.tsx` | Featured by date; Latest via pin-aware query |
| `apps/web/src/components/blog/post-card.tsx` | Triangle pin badge when `pinnedAt` set |
| `apps/web/src/app/admin/posts/page.tsx` | Pin/Unpin menu item + handler |
| `apps/web/src/lib/i18n/admin.ts` | zh/en strings for pin/unpin (+ toasts) |

No new packages. Repo has no unit-test runner — verify with `tsc` / `check:i18n` and manual QA.

---

### Task 1: Types + `toPostSummary`

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/mdx-utils.ts`

- [ ] **Step 1: Add `pinnedAt` to both interfaces**

In `packages/core/src/types.ts`, add to `Post` and `PostSummary` (after `draft`):

```ts
pinnedAt: string | null
```

- [ ] **Step 2: Map in `toPostSummary`**

In `packages/core/src/mdx-utils.ts`:

```ts
export function toPostSummary(post: Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    updated: post.updated,
    tags: post.tags,
    description: post.description,
    cover: post.cover,
    draft: post.draft,
    pinnedAt: post.pinnedAt,
    wordCount: post.wordCount,
    readingTime: post.readingTime,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/mdx-utils.ts
git commit -m "feat(core): add pinnedAt to Post and PostSummary"
```

---

### Task 2: Database schema, mapping, helpers

**Files:**
- Modify: `packages/database/src/content.ts`
- Modify: `packages/database/src/index.ts`

- [ ] **Step 1: Schema + migration**

In `SCHEMA` (`CREATE TABLE posts`), add after `draft`:

```sql
  pinned_at TEXT,
```

In `ensureTable`, after `executeMultiple(SCHEMA)`, migrate existing DBs (same pattern as `site-settings.ts`):

```ts
try {
  await db.execute("ALTER TABLE posts ADD COLUMN pinned_at TEXT")
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  if (!/duplicate column/i.test(msg)) throw err
}
```

- [ ] **Step 2: `rowToPost` / `toParams` / `savePost`**

In `rowToPost`:

```ts
pinnedAt: (row.pinned_at as string | null) ?? null,
```

In `toParams`, include:

```ts
pinned_at: post.pinnedAt,
```

Update `savePost` INSERT/UPSERT to include `pinned_at` so edits preserve pin state:

```sql
INSERT INTO posts (slug, title, date, updated, tags, description, cover, draft, pinned_at, content, word_count, reading_time)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(slug) DO UPDATE SET
  title=excluded.title, date=excluded.date, updated=excluded.updated,
  tags=excluded.tags, description=excluded.description, cover=excluded.cover,
  draft=excluded.draft, pinned_at=excluded.pinned_at, content=excluded.content,
  word_count=excluded.word_count, reading_time=excluded.reading_time,
  updated_at=datetime('now')
```

Pass `p.pinned_at` in the args array in the matching position. Any `Post` construction site that builds a full object (API POST/PUT) must set `pinnedAt: existingPost.pinnedAt` or `null` for new posts — handled in Task 3 for API create path if needed; PUT already spreads `existingPost`.

- [ ] **Step 3: Add `setPostPinned` and `getHomepageLatestPosts`**

```ts
/** Pin (sets pinned_at to now) or unpin (clears pinned_at). Returns updated post or null. */
export async function setPostPinned(
  slug: string,
  pinned: boolean
): Promise<Post | null> {
  const db = requireDb()
  await ensureTable(db)
  const clean = safeSlug(slug)
  const existing = await getPostBySlug(clean, true)
  if (!existing) return null

  await db.execute({
    sql: `UPDATE posts SET pinned_at = ?, updated_at = datetime('now') WHERE slug = ?`,
    args: [pinned ? new Date().toISOString() : null, clean],
  })
  return getPostBySlug(clean, true)
}

/**
 * Homepage Latest posts grid: pinned first by pinned_at DESC, then date DESC.
 * Excludes the Featured slug. Does not change archive/feed ordering.
 */
export async function getHomepageLatestPosts(
  excludeSlug: string,
  limit: number
): Promise<PostSummary[]> {
  const db = requireDb()
  await ensureTable(db)
  const clean = safeSlug(excludeSlug)
  const result = await db.execute({
    sql: `SELECT * FROM posts
          WHERE draft = 0 AND slug != ?
          ORDER BY (pinned_at IS NULL) ASC, pinned_at DESC, date DESC
          LIMIT ?`,
    args: [clean, limit],
  })
  return result.rows.map((row) => toPostSummary(rowToPost(row)))
}
```

Note: SQLite `(pinned_at IS NULL) ASC` puts non-null pins first (0 before 1).

- [ ] **Step 4: Export from package index**

In `packages/database/src/index.ts`, add `setPostPinned` and `getHomepageLatestPosts` to the content re-export list.

- [ ] **Step 5: Typecheck database package consumers**

From repo root:

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: failures only at call sites that construct `Post` / `PostSummary` literals without `pinnedAt` — fix those in this task if they live outside the API route (grep `as Post` / object literals). Prefer `pinnedAt: null` for new posts and preserve on updates.

- [ ] **Step 6: Commit**

```bash
git add packages/database/src/content.ts packages/database/src/index.ts
# plus any call-site fixes from Step 5 that are not API/admin/homepage
git commit -m "feat(database): pinned_at column and homepage pin queries"
```

---

### Task 3: API PATCH + create/update Post literals

**Files:**
- Modify: `apps/web/src/app/api/posts/route.ts`

- [ ] **Step 1: Import helpers**

Add `setPostPinned` to the `@zlog/database` import. Ensure every `Post` object literal includes `pinnedAt` (`null` on create; `existingPost.pinnedAt` on update — spread already covers PUT if `existingPost` has the field).

On POST create, after building the post object, set:

```ts
pinnedAt: null,
```

- [ ] **Step 2: Extend PATCH**

Replace the draft-only schema with:

```ts
const parseResult = z
  .object({
    draft: z.boolean().optional(),
    pinned: z.boolean().optional(),
  })
  .refine((b) => b.draft !== undefined || b.pinned !== undefined, {
    message: "draft or pinned is required",
  })
  .safeParse(await request.json())

if (!parseResult.success) {
  return NextResponse.json(
    { error: parseResult.error.issues[0]?.message || "Invalid input" },
    { status: 400 }
  )
}

const { draft, pinned } = parseResult.data
let updatedPost: Post | null = existingPost

if (draft !== undefined) {
  updatedPost = await movePost(slug, draft)
  if (!updatedPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
}

if (pinned !== undefined) {
  updatedPost = await setPostPinned(slug, pinned)
  if (!updatedPost) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
}

return NextResponse.json({ post: updatedPost })
```

Update the PATCH comment to mention pin/unpin.

- [ ] **Step 3: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: PASS (or only unrelated pre-existing errors).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/posts/route.ts
git commit -m "feat(api): PATCH posts supports pin toggle"
```

---

### Task 4: Homepage fetch

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Split Featured vs Latest fetches**

```tsx
import {
  getPublishedPosts,
  getPublishedCount,
  getHomepageLatestPosts,
} from "@zlog/database"
// ...
const LATEST_GRID_COUNT = 6

export default async function HomePage() {
  const [featuredList, postCount] = await Promise.all([
    getPublishedPosts(1),
    getPublishedCount(),
  ])
  const featured = featuredList[0]
  const latest = featured
    ? await getHomepageLatestPosts(featured.slug, LATEST_GRID_COUNT)
    : []

  // ... rest unchanged; FeaturedPostCard still gets `featured`
  // PostCard grid still maps `latest`
}
```

Update the comment above Featured: still “newest by date”; Latest ordering is pin-aware inside the helper.

- [ ] **Step 2: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(home): order Latest posts by pin then date"
```

---

### Task 5: Pin badge on `PostCard`

**Files:**
- Modify: `apps/web/src/components/blog/post-card.tsx`

- [ ] **Step 1: Import icon and render badge**

```tsx
import { Calendar, ArrowUpToLine } from "lucide-react"
```

Inside the cover `div.relative.h-48` (before the reading-time badge), when pinned:

```tsx
{post.pinnedAt && (
  <span
    className="pointer-events-none absolute left-0 top-0 z-10 size-10 overflow-hidden rounded-tl-xl"
    aria-hidden
  >
    <span className="absolute left-0 top-0 size-0 border-t-[40px] border-r-[40px] border-t-zinc-900 border-r-transparent dark:border-t-zinc-100" />
    <ArrowUpToLine
      className="absolute left-1 top-1 size-3.5 text-white dark:text-zinc-900"
      strokeWidth={2.5}
    />
  </span>
)}
```

Uses a CSS border-triangle in the top-left, clipped by `rounded-tl-xl` to match the card. Zinc colors sit outside `gradientPairs`.

- [ ] **Step 2: Visual check in browser**

Pin a post (after Task 6) or temporarily hardcode `pinnedAt` on one card — confirm triangle hugs the corner on cover and gradient cards, light and dark.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/blog/post-card.tsx
git commit -m "feat(ui): pin corner badge on homepage PostCard"
```

---

### Task 6: Admin Actions menu + i18n

**Files:**
- Modify: `apps/web/src/lib/i18n/admin.ts`
- Modify: `apps/web/src/app/admin/posts/page.tsx`

- [ ] **Step 1: Add i18n keys (zh + en)**

Near `publish` / `unpublish` in both locales:

```ts
// zh
pin: "置顶",
unpin: "取消置顶",
pinSuccess: "已置顶到首页",
unpinSuccess: "已取消置顶",

// en
pin: "Pin to homepage",
unpin: "Unpin",
pinSuccess: "Pinned to homepage",
unpinSuccess: "Unpinned",
```

- [ ] **Step 2: Handler next to `handleToggleDraft`**

```ts
async function handleTogglePin(slug: string, pinnedAt: string | null) {
  const nextPinned = !pinnedAt
  try {
    const res = await apiFetch(
      `/api/posts?slug=${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      }
    )
    if (res.ok) {
      const data = (await res.json()) as { post?: { pinnedAt: string | null } }
      setPosts(
        posts.map((p) =>
          p.slug === slug
            ? { ...p, pinnedAt: data.post?.pinnedAt ?? (nextPinned ? new Date().toISOString() : null) }
            : p
        )
      )
      toast.success(nextPinned ? t("admin.pinSuccess") : t("admin.unpinSuccess"))
    } else {
      toast.error(t("admin.updateFailed"))
    }
  } catch {
    toast.error(t("admin.networkError"))
  }
}
```

- [ ] **Step 3: Menu item**

Import `Pin` (or `ArrowUpToLine`) from `lucide-react`. After the publish/unpublish item, add:

```tsx
<DropdownMenuItem
  onClick={() => handleTogglePin(post.slug, post.pinnedAt)}
>
  <Pin />
  {post.pinnedAt ? t("admin.unpin") : t("admin.pin")}
</DropdownMenuItem>
```

- [ ] **Step 4: i18n check + typecheck**

```bash
cd apps/web && pnpm run check:i18n && pnpm exec tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/i18n/admin.ts apps/web/src/app/admin/posts/page.tsx
git commit -m "feat(admin): pin/unpin posts from Actions menu"
```

---

### Task 7: Manual acceptance QA

- [ ] **Step 1: Run through acceptance from the spec**

With `pnpm dev` and Turso (or `file:` DB):

1. Pin post A, then pin post B → Latest grid starts B, then A, then date-ordered unpinned (Featured excluded).
2. Unpin B → A leads pinned group.
3. Pin an old post → it appears in the 6-card grid ahead of newer unpinned posts.
4. Newest-by-date Featured unchanged by pins; if Featured is also pinned, it does not duplicate in Latest.
5. `/archive` order still by date only.
6. Badge visible on pinned Latest cards; contrast OK on gradient + cover, light + dark.

- [ ] **Step 2: Final commit if QA required small fixes** (only if needed)

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| `pinned_at` column + migrate | Task 2 |
| Types / summary | Task 1–2 |
| `setPostPinned` / re-pin refreshes time | Task 2–3 |
| `getHomepageLatestPosts` order + exclude Featured | Task 2, 4 |
| Featured stays date-only | Task 4 |
| Archive/feed unchanged | Task 2 (no change to `getPublishedPosts` order) |
| PATCH `{ pinned }` | Task 3 |
| Admin Pin/Unpin menu | Task 6 |
| Triangle badge + zinc contrast | Task 5 |
| i18n | Task 6 |
| Acceptance cases | Task 7 |
