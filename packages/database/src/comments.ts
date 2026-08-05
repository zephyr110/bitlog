import { type Client } from "@libsql/client"
import { requireDb, createTableGuard } from "./db"

// ── Schema ──────────────────────────────────────────────────────────────
// Self-hosted comments (replaces giscus). Guest comments are public on
// arrival (no moderation queue — spam is filtered before insert by the
// API), so a deleted comment is a hard delete, not a hide flag.
// ip_hash is a SHA-256 of the visitor IP — stored only so rate limiting
// can be enforced in the DB (serverless instances share no memory).

const COMMENTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_unread ON comments(is_read);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
`

// Fixed sliding windows for the three rate-limit scopes. A window is
// keyed by floor(now / windowMs), so the counter resets naturally when
// the clock crosses a boundary — no eviction/cleanup needed. Scopes:
//   ip:<hash>    — one visitor, 15 min
//   post:<slug>  — one article, 1 h (concentrated flooding of a post)
//   global       — the whole site, 1 h (script flood peak)
const RATE_LIMIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS comment_rate_limit (
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, window_start)
);
`

export const RATE_LIMIT_IP_WINDOW_MS = 15 * 60 * 1000
export const RATE_LIMIT_IP_MAX = 5
export const RATE_LIMIT_POST_WINDOW_MS = 60 * 60 * 1000
export const RATE_LIMIT_POST_MAX = 20
export const RATE_LIMIT_GLOBAL_WINDOW_MS = 60 * 60 * 1000
export const RATE_LIMIT_GLOBAL_MAX = 200

// ── Types ───────────────────────────────────────────────────────────────

export interface CommentRecord {
  id: number
  postSlug: string
  authorName: string
  authorEmail: string
  content: string
  ipHash: string
  isRead: boolean
  createdAt: string
}

export interface AdminCommentPage {
  items: CommentRecord[]
  total: number
  page: number
  pageSize: number
  unreadCount: number
}

// ── Helpers ─────────────────────────────────────────────────────────────

const ensureTables = createTableGuard(async () => {
  const db = requireDb()
  await db.executeMultiple(COMMENTS_SCHEMA)
  await db.executeMultiple(RATE_LIMIT_SCHEMA)
})

function rowToComment(row: Record<string, unknown>): CommentRecord {
  return {
    id: Number(row.id),
    postSlug: String(row.post_slug),
    authorName: String(row.author_name),
    authorEmail: String(row.author_email ?? ""),
    content: String(row.content),
    ipHash: String(row.ip_hash),
    isRead: Number(row.is_read) !== 0,
    createdAt: String(row.created_at),
  }
}

// ── Comment CRUD ────────────────────────────────────────────────────────

/** Public list for one post, oldest first (conversation order).
 *  Selects only the public columns — author_email and ip_hash never
 *  leave the DB on the read path. */
export async function getCommentsByPost(
  postSlug: string
): Promise<CommentRecord[]> {
  const db = requireDb()
  await ensureTables()
  const result = await db.execute(
    `SELECT id, post_slug, author_name, author_email, content, ip_hash, is_read, created_at
     FROM comments WHERE post_slug = ? ORDER BY created_at ASC`,
    [postSlug]
  )
  return result.rows.map((r) => rowToComment(r as unknown as Record<string, unknown>))
}

export async function createComment(input: {
  postSlug: string
  authorName: string
  authorEmail: string
  content: string
  ipHash: string
}): Promise<CommentRecord> {
  const db = requireDb()
  await ensureTables()
  const result = await db.execute(
    `INSERT INTO comments (post_slug, author_name, author_email, content, ip_hash)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`,
    [
      input.postSlug,
      input.authorName,
      input.authorEmail,
      input.content,
      input.ipHash,
    ]
  )
  return rowToComment(result.rows[0] as unknown as Record<string, unknown>)
}

/**
 * Admin list — unread first, then newest. Returns pagination metadata
 * plus the total unread count (for the sidebar badge) in one query batch.
 */
export async function listAdminComments(input: {
  page: number
  pageSize: number
}): Promise<AdminCommentPage> {
  const db = requireDb()
  await ensureTables()
  const { page, pageSize } = input
  const offset = (page - 1) * pageSize

  const result = await db.batch([
    {
      sql: `SELECT * FROM comments
            ORDER BY is_read ASC, created_at DESC
            LIMIT ? OFFSET ?`,
      args: [pageSize, offset],
    },
    {
      sql: `SELECT COUNT(*) AS total FROM comments`,
      args: [],
    },
    {
      sql: `SELECT COUNT(*) AS unread FROM comments WHERE is_read = 0`,
      args: [],
    },
  ])

  return {
    items: result[0].rows.map((r) => rowToComment(r as unknown as Record<string, unknown>)),
    total: Number(result[1].rows[0]?.total ?? 0),
    page,
    pageSize,
    unreadCount: Number(result[2].rows[0]?.unread ?? 0),
  }
}

/** Lightweight unread count for the sidebar badge polling. */
export async function countUnreadComments(): Promise<number> {
  const db = requireDb()
  await ensureTables()
  const result = await db.execute(
    `SELECT COUNT(*) AS unread FROM comments WHERE is_read = 0`
  )
  return Number(result.rows[0]?.unread ?? 0)
}

export async function markCommentRead(id: number): Promise<boolean> {
  const db = requireDb()
  await ensureTables()
  const result = await db.execute(
    `UPDATE comments SET is_read = 1 WHERE id = ?`,
    [id]
  )
  return Number(result.rowsAffected) > 0
}

export async function deleteComment(id: number): Promise<boolean> {
  const db = requireDb()
  await ensureTables()
  const result = await db.execute(`DELETE FROM comments WHERE id = ?`, [id])
  return Number(result.rowsAffected) > 0
}

// ── Rate limiting ───────────────────────────────────────────────────────

/**
 * Increment the counter for a scope/window and report whether the
 * window's budget is still available. Returns false (and still counts
 * the attempt) once the budget is exhausted — the caller rejects with
 * 429. Race-tolerant: a burst can momentarily over-count, which is the
 * safe direction for a spam gate.
 */
export async function consumeRateLimit(
  scope: string,
  windowMs: number,
  max: number
): Promise<boolean> {
  const db = requireDb()
  await ensureTables()
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs

  // Single statement: upsert the counter and read the new value in one
  // round trip via RETURNING.
  const result = await db.execute(
    `INSERT INTO comment_rate_limit (scope, window_start, count)
     VALUES (?, ?, 1)
     ON CONFLICT(scope, window_start) DO UPDATE SET count = count + 1
     RETURNING count`,
    [scope, windowStart]
  )
  const count = Number(result.rows[0]?.count ?? 0)
  return count <= max
}

/** Reusable scope keys. */
export function ipRateScope(ipHash: string): string {
  return `ip:${ipHash}`
}
export function postRateScope(postSlug: string): string {
  return `post:${postSlug}`
}
export const GLOBAL_RATE_SCOPE = "global"
