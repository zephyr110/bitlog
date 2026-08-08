# Homepage pin posts — design

Pin posts so they surface at the front of the homepage **Latest posts** grid, ordered by pin time. Featured spotlight stays date-based. Unpin is supported. Pinned cards show a corner triangle badge.

## Goals

- Admin can pin / unpin from the `admin/posts` Actions menu.
- Latest posts (6 cards): pinned first by `pinned_at` DESC (later pin = earlier in grid), then unpinned by `date` DESC.
- Featured card: unchanged — newest published by `date` DESC only.
- Pinned posts always eligible for the grid even if older than the natural top-6 by date.
- Featured slug is excluded from the Latest grid (no duplicate).
- Archive, sitemap, RSS, category/tag lists stay pure `date` DESC (no global reorder).

## Non-goals

- Pin does not affect Featured.
- No drag-and-drop reorder UI.
- No pin limit (practical limit is the 6-card grid).
- No pin badge on Featured or archive cards.

## Data model

Single nullable timestamp column (approach 1):

| Column | Type | Meaning |
|--------|------|---------|
| `pinned_at` | `TEXT NULL` | ISO/SQLite datetime when pinned; `NULL` = not pinned |

- Pin: set `pinned_at` to current UTC datetime (re-pin refreshes order).
- Unpin: set `pinned_at` to `NULL`.
- Migrate existing DBs via `ALTER TABLE posts ADD COLUMN pinned_at TEXT` in `ensureTable` (ignore duplicate-column errors), and add the column to `CREATE TABLE` schema for new DBs.

Types (`packages/core`):

- `Post.pinnedAt: string | null`
- `PostSummary.pinnedAt: string | null`
- Wire through `rowToPost`, `toParams`, `toPostSummary`, `savePost` as needed.

## Query

Do **not** change `getPublishedPosts` / `getAllPosts` default order.

Add a homepage-specific helper, e.g. `getHomepageLatestPosts(excludeSlug: string, limit: number)`:

1. Published only (`draft = 0`).
2. Exclude `excludeSlug` (the Featured post).
3. Order: `pinned_at IS NOT NULL DESC`, then `pinned_at DESC`, then `date DESC`.
4. `LIMIT limit`.

Homepage (`page.tsx`):

1. Featured = first of `getPublishedPosts(1)` (or equivalent date-DESC single fetch).
2. Latest = `getHomepageLatestPosts(featured.slug, 6)`.
3. Adjust fetch strategy so Featured + Latest do not rely on slicing one date-ordered list of 7.

## API

Extend existing `PATCH /api/posts?slug=` (same auth as draft toggle):

```ts
{ pinned: boolean }
```

- `pinned: true` → set `pinned_at` to now.
- `pinned: false` → clear `pinned_at`.
- Prefer a small dedicated updater (e.g. `setPostPinned(slug, pinned)`) rather than overloading `movePost`.
- Drafts may be pinned; they remain invisible on the homepage until published.

## Admin UI

`admin/posts` Actions dropdown:

- If `pinnedAt` is null: **Pin** (i18n key).
- If `pinnedAt` is set: **Unpin**.
- Calls `PATCH` with `{ pinned: true | false }`, then refreshes the list.
- Optional: small pin indicator in the table row is nice-to-have, not required for v1.

## Card badge

Only on homepage `PostCard` when `post.pinnedAt` is set:

- Position: top-left of the cover/gradient area.
- Shape: right triangle (or clipped corner) hugging `rounded-xl` outer corner.
- Icon: Lucide `ArrowUpToLine`, small, centered in the visible triangle area.
- Color: high-contrast zinc outside `gradientPairs` (rose/orange, violet, cyan, emerald, amber, pink, indigo, fuchsia):
  - Light: `bg-zinc-900` + white icon
  - Dark: `bg-zinc-100` + zinc-900 icon
- Must remain readable on both photo covers and gradient fallbacks.

## i18n

Add admin strings for Pin / Unpin (zh + en) under `admin` translations. No public-facing label required on the badge (icon-only); optional `aria-label` via site/post i18n if needed for a11y.

## Acceptance

1. Pin A, then pin B → Latest grid order starts with B, then A, then date-ordered unpinned (excluding Featured).
2. Unpin B → A leads pinned group; B returns to date order among unpinned.
3. Pin an old post → it appears in the 6-card grid ahead of newer unpinned posts.
4. Newest-by-date Featured is never displaced by pin; if that post is also pinned, it does not also appear in Latest.
5. Archive / feed / tags / categories order unchanged.
6. GitHub Pages build still works (column present; pin state baked at build time like other Turso fields).
