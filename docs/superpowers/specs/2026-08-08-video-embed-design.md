# Markdown video embeds — design

Standalone Bilibili / YouTube links in post markdown render as full-width 16:9 players in the article body (and admin preview). Inline / mixed-paragraph links stay normal external links. Start-time query params are ignored.

## Goals

- Author writes a normal markdown link on its own paragraph, e.g.  
  `[title](https://www.bilibili.com/video/BVxxx/…)` or a YouTube watch / short / `youtu.be` URL.
- That paragraph becomes an embedded player: width matches the main prose column, aspect ratio 16:9.
- Public post page and admin markdown preview stay visually aligned (shared component map).
- Unrecognized or non-standalone video URLs keep today’s link behavior.

## Non-goals

- No editor UI for “insert video”.
- No raw HTML / `rehype-raw` / author-written `<iframe>`.
- No start-time (`t`, `start`) forwarding — always play from the beginning.
- No Vimeo or other providers in v1.
- No autoplay with sound; players use provider defaults with `autoplay=0` where applicable.
- No special handling for links inside lists, blockquotes, or headings (remain `<a>`).

## Approach

**A — detect in `mdx-components` paragraph override** (chosen over a rehype AST rewrite or raw HTML).

Shared map already drives both `MDXRenderer` (`next-mdx-remote`) and admin `MarkdownPreview` (`react-markdown`). Paragraph-level detection avoids invalid “block iframe inside `<p>`” nesting and matches the “standalone link only” rule without a new rehype plugin.

## Recognition

Pure helpers in `apps/web/src/lib/video-embed.ts`:

| Export | Role |
|--------|------|
| `parseVideoEmbed(href: string)` | Returns `{ provider: "bilibili" \| "youtube", id: string }` or `null` |
| `videoEmbedSrc(parsed)` | Canonical iframe `src` (no start time) |

**Bilibili**

- Hosts: `www.bilibili.com`, `bilibili.com`, `m.bilibili.com` (and www variants).
- Path: `/video/BVxxxxxxxx` (case-insensitive BV id).
- Optional: resolve `b23.tv` only if the final path already contains a BV id after normal URL parse; do **not** fetch short-link redirects at render time. If only a short path with no BV is present, return `null` (plain link).
- Embed: `https://player.bilibili.com/player.html?bvid={id}&autoplay=0`

**YouTube**

- `youtube.com` / `www.youtube.com` / `m.youtube.com`: `watch?v=`, `/shorts/{id}`, `/embed/{id}`
- `youtu.be/{id}`
- Embed: `https://www.youtube-nocookie.com/embed/{id}` (privacy-enhanced host)

Strip query/hash noise for matching; never pass `t` / `start` / `p` into the embed URL.

## Standalone paragraph rule

In `mdx-components` `p`:

1. Normalize `children` (unwrap single-element arrays / fragments as react-markdown / MDX typically produce).
2. Treat as standalone video when the paragraph’s only meaningful child is one `<a>` (or an anchor-shaped element with `href`) whose `href` parses via `parseVideoEmbed`.
3. Ignore pure whitespace text nodes if present beside that single link.
4. On match: return `<VideoEmbed … />` **instead of** `<p>…</p>`.
5. Otherwise: existing paragraph markup unchanged.

The `a` component stays a normal external link. Embeds are never triggered from `a` alone, so list items and mid-sentence links never become players.

## UI component

`apps/web/src/components/blog/video-embed.tsx`

- Props: `provider`, `id`, optional `title` (link text for iframe `title` / accessible name).
- Layout: `my-6 w-full overflow-hidden rounded-xl border border-border/60 shadow-lg` (align with post `img` chrome) + inner `aspect-video relative`.
- Iframe: `absolute inset-0 size-full`, `loading="lazy"`, `allowFullScreen`, `allow` suitable for both providers (e.g. fullscreen; YouTube needs typical embed allowlist). `referrerPolicy` as needed for Bilibili embeds.
- No poster/thumbnail layer in v1 — provider player UI is enough.

`VideoEmbed` is a `"use client"` component (same constraint as Mermaid: shared map is imported from the client admin preview). Keep `parseVideoEmbed` / `videoEmbedSrc` in a server-safe lib module with no React.

## Surfaces

| Surface | Behavior |
|---------|----------|
| Public post (`MDXRenderer`) | Standalone video paragraphs → embed |
| Admin preview (`MarkdownPreview`) | Same via shared `mdxComponents` |
| RSS / plain text extracts | Unaffected (source markdown stays a link) |

## Error / fallback

- `parseVideoEmbed` returns `null` → plain link / paragraph.
- Iframe load failures are left to the browser/provider (no custom error UI in v1).
- Malicious or non-http(s) hrefs never produce an embed URL; only constructed provider embed hosts are used as `src`.

## Testing

- Add unit tests for `parseVideoEmbed` / `videoEmbedSrc` if the repo already has a vitest/jest runner wired for `apps/web`; otherwise verify with a few fixture hrefs during implementation and skip introducing a new test harness in this change.
- Manual check: public post + admin preview with one standalone Bilibili link, one standalone YouTube link, and one inline “see [video](url) here” sentence (must stay a link).

## File touch list

| Path | Change |
|------|--------|
| `apps/web/src/lib/video-embed.ts` | New parsers + embed URL builders |
| `apps/web/src/components/blog/video-embed.tsx` | New player chrome |
| `apps/web/src/components/blog/mdx-components.tsx` | `p` standalone detection → `VideoEmbed` |

No changes to `mdx-pipeline.ts`, DB, or editor insert flows.
