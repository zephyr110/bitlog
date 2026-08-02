import { type Client } from "@libsql/client"
import { getDb } from "./db"

// ── Schema ──────────────────────────────────────────────────────────────
// Singleton row (id = 1) for editable site identity + social links.
// siteUrl stays in env (NEXT_PUBLIC_SITE_URL) — not stored here.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  twitter_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`

export interface SiteSettingsRecord {
  name: string
  title: string
  description: string
  authorName: string
  logoUrl: string
  githubUrl: string
  twitterUrl: string
}

export type SiteSettingsUpdate = Partial<SiteSettingsRecord>

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
    })().catch((err) => {
      tableReady = null
      throw err
    })
  }
  await tableReady
}

function rowToRecord(row: Record<string, unknown>): SiteSettingsRecord {
  return {
    name: String(row.name ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    authorName: String(row.author_name ?? ""),
    logoUrl: String(row.logo_url ?? ""),
    githubUrl: String(row.github_url ?? ""),
    twitterUrl: String(row.twitter_url ?? ""),
  }
}

/** Returns the singleton settings row, or null if not yet created. */
export async function getSiteSettings(): Promise<SiteSettingsRecord | null> {
  const db = requireDb()
  await ensureTable(db)
  const result = await db.execute("SELECT * FROM site_settings WHERE id = 1")
  const row = result.rows[0]
  if (!row) return null
  return rowToRecord(row as unknown as Record<string, unknown>)
}

/**
 * Upserts the singleton settings row. Only provided fields are written;
 * omitted fields keep their previous value (or '' on first insert).
 */
export async function upsertSiteSettings(
  patch: SiteSettingsUpdate
): Promise<SiteSettingsRecord> {
  const db = requireDb()
  await ensureTable(db)

  const existing = await getSiteSettings()
  const next: SiteSettingsRecord = {
    name: patch.name ?? existing?.name ?? "",
    title: patch.title ?? existing?.title ?? "",
    description: patch.description ?? existing?.description ?? "",
    authorName: patch.authorName ?? existing?.authorName ?? "",
    logoUrl: patch.logoUrl ?? existing?.logoUrl ?? "",
    githubUrl: patch.githubUrl ?? existing?.githubUrl ?? "",
    twitterUrl: patch.twitterUrl ?? existing?.twitterUrl ?? "",
  }

  await db.execute({
    sql: `INSERT INTO site_settings
            (id, name, title, description, author_name, logo_url, github_url, twitter_url, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            title = excluded.title,
            description = excluded.description,
            author_name = excluded.author_name,
            logo_url = excluded.logo_url,
            github_url = excluded.github_url,
            twitter_url = excluded.twitter_url,
            updated_at = excluded.updated_at`,
    args: [
      next.name,
      next.title,
      next.description,
      next.authorName,
      next.logoUrl,
      next.githubUrl,
      next.twitterUrl,
    ],
  })

  return next
}
