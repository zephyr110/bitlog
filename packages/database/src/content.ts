import { type Client } from "@libsql/client"
import { getDb } from "./db"
import { type Post, type PostSummary } from "./types"
import { toPostSummary } from "./mdx-utils"
import { safeSlug } from "./slug"

// ── Schema ──────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  date TEXT NOT NULL,
  updated TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  cover TEXT,
  draft INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_draft ON posts(draft);
`

// ── Helpers ─────────────────────────────────────────────────────────────

function requireDb(): Client {
  const db = getDb()
  if (!db) {
    throw new Error(
      "TURSO_DATABASE_URL environment variable is required. " +
        "Set it to a libsql:// or file: URL (and TURSO_AUTH_TOKEN for remote databases)."
    )
  }
  return db
}

let tableReady: Promise<void> | null = null

async function ensureTable(db: Client): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await db.executeMultiple(SCHEMA)

      // One-time fix: normalize dates that were stored as epoch millis
      const bad = await db.execute(
        "SELECT slug, date FROM posts WHERE date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'"
      )
      for (const row of bad.rows) {
        const corrected = normalizeDate(row.date as string)
        await db.execute({
          sql: "UPDATE posts SET date = ? WHERE slug = ?",
          args: [corrected, row.slug],
        })
      }

      // One-time fix: normalize tags to prefix format (e.g. ["css"] → ["frontend-css"])
      const tagMap: Record<string, string> = {
        css: "frontend", javascript: "frontend", js: "frontend", typescript: "frontend",
        react: "frontend", vue: "frontend", "design-pattern": "frontend",
        protocol: "frontend", framework: "frontend", node: "frontend", npm: "frontend",
        webpack: "frontend", babel: "frontend", eslint: "frontend", stylelint: "frontend",
        python: "backend", server: "backend", mysql: "backend", nginx: "backend",
        linux: "backend", mangodb: "backend",
        appium: "automator", jest: "automator", testing: "automator", automator: "automator",
        component: "components", components: "components", publish: "components",
        git: "gear", gear: "gear", terminal: "gear", iterm: "gear", vscode: "gear",
        webstorm: "gear", markdown: "gear", picgo: "gear", tree: "gear", yarn: "gear",
        storybook: "gear", ish: "gear",
        miniprogram: "miniprogram", "mini-program": "miniprogram",
        summary: "summary", vpn: "summary", scriptable: "summary",
        application: "frontend", tools: "gear",
      }
      const all = await db.execute("SELECT slug, tags FROM posts")
      for (const row of all.rows) {
        let tags: string[]
        try { tags = JSON.parse(row.tags as string) } catch { continue }
        if (!Array.isArray(tags)) continue
        const fixed = tags.map((t: string) => {
          const lower = t.toLowerCase()
          if (lower.includes("-")) return lower
          const prefix = tagMap[lower]
          return prefix ? `${prefix}-${lower}` : lower
        })
        if (JSON.stringify(tags) !== JSON.stringify(fixed)) {
          await db.execute({
            sql: "UPDATE posts SET tags = ? WHERE slug = ?",
            args: [JSON.stringify(fixed), row.slug as string],
          })
        }
      }

      // One-time cleanup: delete placeholder index pages (VuePress leftovers)
      const placeholders = await db.execute(
        "SELECT slug FROM posts WHERE (title = '首页' AND length(content) < 100) OR (title = '介绍' AND slug = 'about')"
      )
      for (const row of placeholders.rows) {
        await db.execute({ sql: "DELETE FROM posts WHERE slug = ?", args: [row.slug] })
      }
    })().catch((err) => {
      tableReady = null // reset on failure so next call retries
      throw err
    })
  }
  await tableReady
}

/** Normalize dates that were stored as epoch millis by the migration script. */
function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split("T")[0]
  // Already a valid YYYY-MM-DD string
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // Epoch millis float (e.g. "1704067200000.0") — gray-matter parsed unquoted YAML dates
  const ms = Number(raw)
  if (Number.isFinite(ms) && ms > 0) {
    return new Date(ms).toISOString().split("T")[0]
  }
  // Fallback: try to parse as-is
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0]
  // Last resort
  return new Date().toISOString().split("T")[0]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(row: any): Post {
  let tags: string[] = []
  try {
    tags = JSON.parse(row.tags || "[]")
  } catch {
    tags = []
  }

  return {
    slug: row.slug,
    title: row.title,
    date: normalizeDate(row.date),
    updated: row.updated ?? undefined,
    tags,
    description: row.description,
    cover: row.cover ?? undefined,
    draft: Boolean(row.draft),
    content: row.content,
    wordCount: row.word_count,
    readingTime: row.reading_time,
  }
}

function toParams(post: Post) {
  return {
    slug: safeSlug(post.slug),
    title: post.title,
    date: post.date,
    updated: post.updated ?? null,
    tags: JSON.stringify(post.tags),
    description: post.description,
    cover: post.cover ?? null,
    draft: post.draft ? 1 : 0,
    content: post.content,
    word_count: post.wordCount,
    reading_time: post.readingTime,
  }
}

/** Sort comparator: newest first, invalid dates sink to the end. */
function sortByDate(posts: Post[]): Post[] {
  posts.sort((a, b) => {
    const ta = new Date(a.date).getTime()
    const tb = new Date(b.date).getTime()
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return tb - ta
  })
  return posts
}

// ── Public API ──────────────────────────────────────────────────────────

export async function getAllPosts(includeDrafts = false): Promise<Post[]> {
  const db = requireDb()
  await ensureTable(db)

  let rows
  if (includeDrafts) {
    const result = await db.execute("SELECT * FROM posts")
    rows = result.rows
  } else {
    const result = await db.execute("SELECT * FROM posts WHERE draft = 0")
    rows = result.rows
  }

  return sortByDate(rows.map(rowToPost))
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const posts = await getAllPosts(false)
  return posts.map(toPostSummary)
}

export async function getPostBySlug(
  slug: string,
  includeDrafts = false
): Promise<Post | null> {
  const db = requireDb()
  await ensureTable(db)

  const clean = safeSlug(slug)

  let result
  if (includeDrafts) {
    result = await db.execute({
      sql: "SELECT * FROM posts WHERE slug = ?",
      args: [clean],
    })
  } else {
    result = await db.execute({
      sql: "SELECT * FROM posts WHERE slug = ? AND draft = 0",
      args: [clean],
    })
  }

  if (result.rows.length === 0) return null
  return rowToPost(result.rows[0])
}

export async function savePost(
  post: Post,
  previousSlug?: string
): Promise<void> {
  const db = requireDb()
  await ensureTable(db)

  const clean = safeSlug(post.slug)

  // If the slug changed, remove the old row to avoid duplicates.
  if (previousSlug && safeSlug(previousSlug) !== clean) {
    await db.execute({
      sql: "DELETE FROM posts WHERE slug = ?",
      args: [safeSlug(previousSlug)],
    })
  }

  const p = toParams(post)
  await db.execute({
    sql: `INSERT INTO posts (slug, title, date, updated, tags, description, cover, draft, content, word_count, reading_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            title=excluded.title, date=excluded.date, updated=excluded.updated,
            tags=excluded.tags, description=excluded.description, cover=excluded.cover,
            draft=excluded.draft, content=excluded.content,
            word_count=excluded.word_count, reading_time=excluded.reading_time,
            updated_at=datetime('now')`,
    args: [
      p.slug,
      p.title,
      p.date,
      p.updated,
      p.tags,
      p.description,
      p.cover,
      p.draft,
      p.content,
      p.word_count,
      p.reading_time,
    ],
  })
}

export async function deletePost(slug: string): Promise<boolean> {
  const db = requireDb()
  await ensureTable(db)

  const clean = safeSlug(slug)
  const result = await db.execute({
    sql: "DELETE FROM posts WHERE slug = ?",
    args: [clean],
  })

  return result.rowsAffected > 0
}

export async function movePost(
  slug: string,
  toDraft: boolean
): Promise<Post | null> {
  const post = await getPostBySlug(slug, true)
  if (!post) return null

  post.draft = toDraft
  await savePost(post)

  return post
}

export async function getAllTags(): Promise<string[]> {
  const db = requireDb()
  await ensureTable(db)

  const result = await db.execute("SELECT tags FROM posts")
  const tagSet = new Set<string>()

  for (const row of result.rows) {
    let tags: string[]
    try {
      tags = JSON.parse((row.tags as string) || "[]")
    } catch {
      continue
    }
    for (const tag of tags) {
      if (tag) tagSet.add(tag.toLowerCase())
    }
  }

  return Array.from(tagSet).sort()
}

export async function getAllCategories(): Promise<string[]> {
  const db = requireDb()
  await ensureTable(db)

  const result = await db.execute("SELECT tags FROM posts")
  const catSet = new Set<string>()

  for (const row of result.rows) {
    let tags: string[]
    try {
      tags = JSON.parse((row.tags as string) || "[]")
    } catch {
      continue
    }
    for (const tag of tags) {
      if (!tag) continue
      const dash = tag.indexOf("-")
      if (dash > 0) {
        catSet.add(tag.slice(0, dash).toLowerCase())
      }
    }
  }

  return Array.from(catSet).sort()
}

export async function getPostsByCategory(category: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts()
  const prefix = category.toLowerCase() + "-"
  return posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase().startsWith(prefix))
  )
}

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts()
  return posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}
