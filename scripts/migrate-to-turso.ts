/**
 * Migrate existing MDX posts from content/posts/ and content/drafts/ into Turso.
 *
 * Usage:
 *   pnpm migrate --dry-run    # parse and print, no writes
 *   pnpm migrate              # write to Turso
 *
 * Requires TURSO_DATABASE_URL in .env.local.
 */

import fs from "fs"
import path from "path"
import { createClient } from "@libsql/client"
import { parsePostFromFile } from "../src/lib/mdx-utils"
import { ensureTable } from "../src/lib/content"

// ── .env.local loader (tsx does not auto-load .env files) ──────────────

function loadEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

const POSTS_DIR = "content/posts"
const DRAFTS_DIR = "content/drafts"

function readPostsFromDir(dir: string): { slug: string; raw: string; draft: boolean }[] {
  if (!fs.existsSync(dir)) return []

  const results: { slug: string; raw: string; draft: boolean }[] = []
  const files = fs.readdirSync(dir)

  for (const file of files) {
    if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue
    const filePath = path.join(dir, file)
    const raw = fs.readFileSync(filePath, "utf-8")
    const slug = file.replace(/\.(mdx|md)$/, "")
    results.push({
      slug,
      raw,
      draft: dir === DRAFTS_DIR,
    })
  }

  return results
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  loadEnv(".env.local")

  const dryRun = process.argv.includes("--dry-run")

  console.log(dryRun ? "🔍 DRY RUN — no writes will be made\n" : "📦 Migrating posts to Turso\n")

  // Connect
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    console.error("❌ TURSO_DATABASE_URL is not set. Add it to .env.local or set it in the environment.")
    process.exit(1)
  }

  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  await ensureTable(db)
  console.log("✅ Turso connected and table ready\n")

  // Read all posts
  const published = readPostsFromDir(POSTS_DIR)
  const drafts = readPostsFromDir(DRAFTS_DIR)

  console.log(`Found ${published.length} published posts, ${drafts.length} drafts (${published.length + drafts.length} total)\n`)

  // Check for duplicate slugs across dirs
  const slugMap = new Map<string, string[]>()
  for (const { slug } of published) {
    const seen = slugMap.get(slug) || []
    seen.push("posts")
    slugMap.set(slug, seen)
  }
  for (const { slug } of drafts) {
    const seen = slugMap.get(slug) || []
    seen.push("drafts")
    slugMap.set(slug, seen)
  }

  const duplicates: string[] = []
  for (const [slug, dirs] of slugMap) {
    if (dirs.length > 1) {
      duplicates.push(slug)
      console.warn(`⚠ Duplicate slug "${slug}" found in: ${dirs.join(", ")}`)
    }
  }
  if (duplicates.length > 0) {
    console.warn(`⚠ ${duplicates.length} duplicate slug(s) — the last one inserted will win\n`)
  }

  // Parse and insert
  const allPosts = [...published, ...drafts]
  let inserted = 0
  const slugs: string[] = []

  for (const { slug, raw, draft } of allPosts) {
    try {
      const post = parsePostFromFile(raw, slug)
      // Ensure the draft flag matches the source directory (source of truth for migration)
      post.draft = draft

      if (dryRun) {
        console.log(`  ${draft ? "[DRAFT]" : "[PUB]  "} ${post.slug} — "${post.title}" (${post.tags.length} tags, ${post.wordCount} words)`)
      } else {
        await db.execute({
          sql: `INSERT OR REPLACE INTO posts (slug, title, date, updated, tags, description, cover, draft, content, word_count, reading_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            post.slug,
            post.title,
            post.date,
            post.updated ?? null,
            JSON.stringify(post.tags),
            post.description,
            post.cover ?? null,
            post.draft ? 1 : 0,
            post.content,
            post.wordCount,
            post.readingTime,
          ],
        })
      }
      inserted++
      slugs.push(post.slug)
    } catch (err) {
      console.error(`❌ Failed to parse ${slug}:`, err instanceof Error ? err.message : err)
    }
  }

  if (dryRun) {
    console.log(`\n🔍 Dry run complete. ${inserted} posts would be inserted.`)
    return
  }

  // Validate
  const result = await db.execute("SELECT COUNT(*) AS n FROM posts")
  const rowCount = (result.rows[0] as unknown as { n: number }).n
  console.log(`\n✅ Inserted ${inserted} posts (database now has ${rowCount} rows)`)

  if (rowCount !== inserted) {
    console.warn(`⚠ Row count mismatch: inserted ${inserted} but DB has ${rowCount}`)
  }

  // Spot-check a few slugs
  const samples = slugs.slice(0, 3)
  for (const s of samples) {
    const r = await db.execute({ sql: "SELECT 1 FROM posts WHERE slug = ?", args: [s] })
    console.log(r.rows.length > 0 ? `  ✓ ${s}` : `  ✗ ${s} — NOT FOUND`)
  }

  console.log("\n🎉 Migration complete.")
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("❌ Migration failed:", err)
    process.exit(1)
  }
)
