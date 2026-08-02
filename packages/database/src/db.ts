import { createClient, type Client } from "@libsql/client"

let client: Client | null = null

export function getDb(): Client | null {
  if (client) return client
  const url = process.env.TURSO_DATABASE_URL
  if (!url) return null
  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return client
}

/**
 * Shared "database must exist" gate for all modules. Throws with the same
 * env-var hint so a missing TURSO_DATABASE_URL surfaces identically
 * everywhere.
 */
export function requireDb(): Client {
  const db = getDb()
  if (!db) {
    throw new Error(
      "TURSO_DATABASE_URL environment variable is required. " +
        "Set it to a libsql:// or file: URL (and TURSO_AUTH_TOKEN for remote databases)."
    )
  }
  return db
}

/**
 * Module-level init-once guard with retry-on-failure, shared by every
 * table module (users, lockout, ...). Returns an async function that
 * runs `init` once and caches the promise; a failed init resets so the
 * next call retries.
 */
export function createTableGuard(init: () => Promise<void>): () => Promise<void> {
  let ready: Promise<void> | null = null
  return () => {
    if (!ready) {
      ready = init().catch((err) => {
        ready = null // reset on failure so next call retries
        throw err
      })
    }
    return ready
  }
}
