#!/usr/bin/env node
/**
 * Create or update an admin user in the Turso database.
 *
 * Usage:
 *   node scripts/create-admin.mjs --username admin --password "your-password"
 *   node scripts/create-admin.mjs --password "new-password"   # updates the existing ADMIN_USERNAME user
 *
 * Environment: TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for remote DBs)
 * are loaded from .env.local automatically.
 */
import { createRequire } from "module"
import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

// pnpm workspaces: resolve deps from the packages that declare them.
const requireDb = createRequire(resolve(root, "packages/database/package.json"))
const requireAuth = createRequire(resolve(root, "packages/auth/package.json"))
const { createClient } = requireDb("@libsql/client")
const bcrypt = requireAuth("bcryptjs")

// Load .env.local (simple parser — no dotenv dependency)
const envPath = resolve(root, ".env.local")
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "")
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      out[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : ""
      if (args[i + 1] && !args[i + 1].startsWith("--")) i++
    }
  }
  return out
}

async function main() {
  const { username: argUsername, password } = parseArgs()

  if (!password) {
    console.error("Usage: node scripts/create-admin.mjs --username <name> --password <password>")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.")
    process.exit(1)
  }

  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    console.error("TURSO_DATABASE_URL is not set (check .env.local).")
    process.exit(1)
  }

  const username = argUsername || process.env.ADMIN_USERNAME
  if (!username) {
    console.error("No username provided and ADMIN_USERNAME is not set.")
    process.exit(1)
  }

  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
    `)

    const hash = await bcrypt.hash(password, 10)
    const existing = await db.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    )

    if (existing.rows.length > 0) {
      await db.execute(
        "UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE username = ?",
        [hash, username]
      )
      console.log(`✓ Updated password for "${username}" (existing JWTs invalidated).`)
    } else {
      await db.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        [username, hash]
      )
      console.log(`✓ Created admin user "${username}".`)
    }
  } catch (error) {
    console.error("Failed to create/update user:", error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
