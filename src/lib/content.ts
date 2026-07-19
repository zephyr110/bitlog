import fs from "fs"
import path from "path"
import { POSTS_DIR, DRAFTS_DIR } from "@/lib/constants"
import { type Post, type PostSummary } from "@/types"
import {
  parsePostFromFile,
  toPostSummary,
  serializeFrontmatter,
} from "@/lib/mdx-utils"

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** Sanitize a slug: lowercase, strip path traversal, keep only safe chars. */
function safeSlug(slug: string): string {
  if (!slug.trim()) return `untitled-${Date.now()}`
  return (
    slug
      .toLowerCase()
      .replace(/\.\./g, "")
      .replace(/[\/\\]/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 100) || `untitled-${Date.now()}`
  )
}

/** Generate a slug from a title with non-ASCII fallback */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80)
  return slug || `post-${Date.now()}`
}

export function getAllPosts(includeDrafts = false): Post[] {
  ensureDir(POSTS_DIR)
  ensureDir(DRAFTS_DIR)

  const posts: Post[] = []

  const readDir = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const files = fs.readdirSync(dir)
    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue
      const filePath = path.join(dir, file)
      const rawContent = fs.readFileSync(filePath, "utf-8")
      const slug = file.replace(/\.(mdx|md)$/, "")
      const post = parsePostFromFile(rawContent, slug)
      posts.push(post)
    }
  }

  readDir(POSTS_DIR)
  if (includeDrafts) {
    readDir(DRAFTS_DIR)
  }

  // Sort by date, newest first. Invalid dates fall to the end.
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

export function getPublishedPosts(): PostSummary[] {
  const allPosts = getAllPosts(false)
  return allPosts.filter((p) => !p.draft).map(toPostSummary)
}

export function getPostBySlug(
  slug: string,
  includeDrafts = false
): Post | null {
  const clean = safeSlug(slug)
  const extensions = [".mdx", ".md"]

  for (const ext of extensions) {
    for (const dir of [POSTS_DIR, ...(includeDrafts ? [DRAFTS_DIR] : [])]) {
      const filePath = path.join(dir, `${clean}${ext}`)
      if (fs.existsSync(filePath)) {
        const rawContent = fs.readFileSync(filePath, "utf-8")
        return parsePostFromFile(rawContent, clean)
      }
    }
  }

  return null
}

export function savePost(post: Post, previousSlug?: string): void {
  ensureDir(POSTS_DIR)
  ensureDir(DRAFTS_DIR)

  const clean = safeSlug(post.slug)
  const targetDir = post.draft ? DRAFTS_DIR : POSTS_DIR
  const filePath = path.join(targetDir, `${clean}.mdx`)

  // If the slug changed, remove the old file to avoid duplicates.
  if (previousSlug && safeSlug(previousSlug) !== clean) {
    deletePost(previousSlug)
  }

  fs.writeFileSync(filePath, serializeFrontmatter(post), "utf-8")
}

export function deletePost(slug: string): boolean {
  const clean = safeSlug(slug)
  const extensions = [".mdx", ".md"]
  let deleted = false

  for (const ext of extensions) {
    for (const dir of [POSTS_DIR, DRAFTS_DIR]) {
      const filePath = path.join(dir, `${clean}${ext}`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        deleted = true
      }
    }
  }

  return deleted
}

export function movePost(slug: string, toDraft: boolean): Post | null {
  const post = getPostBySlug(slug, true)
  if (!post) return null

  // Use the filesystem-resolved slug for deletion and saving.
  const resolvedSlug = safeSlug(post.slug)

  // Delete from current location(s).
  deletePost(resolvedSlug)

  // Update draft status and save to new location.
  post.draft = toDraft
  savePost(post)

  return post
}

export function getAllTags(): string[] {
  const posts = getAllPosts(true)
  const tagSet = new Set<string>()

  for (const post of posts) {
    for (const tag of post.tags) {
      if (tag) tagSet.add(tag.toLowerCase())
    }
  }

  return Array.from(tagSet).sort()
}

export function getPostsByTag(tag: string): PostSummary[] {
  const posts = getPublishedPosts()
  return posts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}
