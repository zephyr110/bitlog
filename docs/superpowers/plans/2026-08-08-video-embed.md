# Markdown Video Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standalone Bilibili/YouTube markdown links in post body (and admin preview) render as full-width 16:9 iframes.

**Architecture:** Pure URL parsers in `lib/video-embed.ts`; client `VideoEmbed` player chrome; `mdxComponents.p` detects a single video `<a>` child and swaps the paragraph for the embed. Shared map covers public MDX + admin preview. No rehype/raw HTML.

**Tech Stack:** Next.js App Router, existing `mdx-components` + `next-mdx-remote` / `react-markdown`.

**Spec:** `docs/superpowers/specs/2026-08-08-video-embed-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/src/lib/video-embed.ts` | `parseVideoEmbed`, `videoEmbedSrc` |
| `apps/web/src/components/blog/video-embed.tsx` | 16:9 iframe chrome (`"use client"`) |
| `apps/web/src/components/blog/mdx-components.tsx` | Standalone-`p` → `VideoEmbed` |

No new packages. Repo has no unit-test runner — verify with typecheck + manual QA.

---

### Task 1: URL helpers

**Files:**
- Create: `apps/web/src/lib/video-embed.ts`

- [x] **Step 1: Implement parsers**

```ts
export type VideoProvider = "bilibili" | "youtube"
export type VideoEmbed = { provider: VideoProvider; id: string }

export function parseVideoEmbed(href: string): VideoEmbed | null
export function videoEmbedSrc(embed: VideoEmbed): string
```

Rules from the spec: Bilibili `/video/BV…`; YouTube watch/shorts/embed/youtu.be; ignore start times; construct only known embed hosts.

- [x] **Step 2: Commit** (bundled with Tasks 2–3)

---

### Task 2: VideoEmbed component

**Files:**
- Create: `apps/web/src/components/blog/video-embed.tsx`

- [x] **Step 1: Client iframe chrome**

`"use client"`; props `{ provider, id, title? }`; `aspect-video` + rounded border matching post images; lazy iframe via `videoEmbedSrc`.

- [x] **Step 2: Commit** (bundled with Tasks 1–3)

---

### Task 3: Wire into mdx-components

**Files:**
- Modify: `apps/web/src/components/blog/mdx-components.tsx`

- [x] **Step 1: Standalone paragraph detection**

Helper: `Children.toArray`, drop whitespace-only text, require exactly one element with `href` that `parseVideoEmbed` accepts; extract title from link children text.

- [x] **Step 2: Update `p`**

On match return `<VideoEmbed />` (no wrapping `<p>`); else existing paragraph.

- [x] **Step 3: Typecheck**

```bash
pnpm --filter @zlog/web exec tsc --noEmit
```

- [x] **Step 4: Commit**

---

## Manual QA

1. Standalone Bilibili + YouTube paragraphs → players, content-width, 16:9.
2. Inline `see [video](url) here` → stays a link.
3. Admin preview matches public post.
