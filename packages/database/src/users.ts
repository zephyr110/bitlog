import { type Client } from "@libsql/client"
import { getDb } from "./db"

// ── Schema ──────────────────────────────────────────────────────────────

const USERS_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`

// ── Types ───────────────────────────────────────────────────────────────

export interface UserRecord {
  username: string
  passwordHash: string
  /** Opaque version token — changes whenever the password changes. */
  passwordVersion: string
}

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

let usersTableReady: Promise<void> | null = null

async function ensureUsersTable(db: Client): Promise<void> {
  if (!usersTableReady) {
    usersTableReady = (async () => {
      await db.executeMultiple(USERS_SCHEMA)
    })().catch((err) => {
      usersTableReady = null // reset on failure so next call retries
      throw err
    })
  }
  await usersTableReady
}

/** .env stores the bcrypt hash base64-encoded to survive $-expansion. */
function decodeEnvHash(hash: string | undefined): string | undefined {
  if (!hash) return undefined
  try {
    return Buffer.from(hash, "base64").toString("utf8")
  } catch {
    return hash
  }
}

// Seed once: if the users table is empty, create the default admin from env.
let seedPromise: Promise<void> | null = null

function ensureSeeded(db: Client): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await ensureUsersTable(db)
      const count = await db.execute("SELECT COUNT(*) AS c FROM users")
      if (Number(count.rows[0]?.c ?? 0) === 0) {
        const username = process.env.ADMIN_USERNAME
        const hash = decodeEnvHash(process.env.ADMIN_PASSWORD_HASH)
        if (username && hash) {
          await db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            [username, hash]
          )
        }
      }
    })().catch((err) => {
      seedPromise = null // reset so next call retries
      throw err
    })
  }
  return seedPromise
}

// ── Public API ──────────────────────────────────────────────────────────

/** Returns the user record, or null if the database is unavailable. */
export async function getUserByUsername(
  username: string
): Promise<UserRecord | null> {
  try {
    const db = requireDb()
    await ensureSeeded(db)

    const result = await db.execute(
      "SELECT username, password_hash, updated_at FROM users WHERE username = ?",
      [username]
    )
    const row = result.rows[0]
    if (!row) return null

    return {
      username: row.username as string,
      passwordHash: row.password_hash as string,
      passwordVersion: row.updated_at as string,
    }
  } catch {
    // Database unavailable — caller falls back to env-based auth.
    return null
  }
}

/** Updates the password hash for a user; bumps updated_at to invalidate old JWTs. */
export async function setUserPassword(
  username: string,
  passwordHash: string
): Promise<boolean> {
  try {
    const db = requireDb()
    await ensureSeeded(db)

    const result = await db.execute(
      "UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE username = ?",
      [passwordHash, username]
    )
    return Number(result.rowsAffected) > 0
  } catch {
    return false
  }
}
