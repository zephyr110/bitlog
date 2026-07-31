import { type Client } from "@libsql/client"
import { getDb } from "./db"
import { type Post, type PostSummary } from "./types"
import { toPostSummary } from "./mdx-utils"
import { safeSlug, slugify } from "./slug"

export { slugify }

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
      // execute() only runs the first statement; use executeMultiple() for the full schema
      await db.executeMultiple(SCHEMA)
    })().catch((err) => {
      tableReady = null // reset on failure so next call retries
      throw err
    })
  }
  await tableReady
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
    date: row.date,
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

export async function getPostsByTag(tag: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts()
  return posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}
