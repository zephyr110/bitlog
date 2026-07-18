import matter from "gray-matter"
import { type Post, type PostFrontmatter, type PostSummary } from "@/types"
import { READING_SPEED_WPM } from "@/lib/constants"

export function parsePostFromFile(
  rawContent: string,
  fileSlug: string
): Post {
  const { data, content } = matter(rawContent)

  const frontmatter = data as Partial<PostFrontmatter>

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM))

  return {
    slug: frontmatter.slug || fileSlug,
    title: frontmatter.title || "Untitled",
    date: frontmatter.date || new Date().toISOString().split("T")[0],
    updated: frontmatter.updated,
    tags: frontmatter.tags || [],
    description: frontmatter.description || "",
    cover: frontmatter.cover,
    draft: frontmatter.draft ?? false,
    content,
    wordCount,
    readingTime,
  }
}

export function serializeFrontmatter(post: Post): string {
  const fm: Record<string, unknown> = {
    title: post.title,
    slug: post.slug,
    date: post.date,
    tags: post.tags,
    description: post.description,
    draft: post.draft,
  }

  if (post.updated) fm.updated = post.updated
  if (post.cover) fm.cover = post.cover

  return matter.stringify(post.content, fm)
}

export function toPostSummary(post: Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    updated: post.updated,
    tags: post.tags,
    description: post.description,
    cover: post.cover,
    draft: post.draft,
    wordCount: post.wordCount,
    readingTime: post.readingTime,
  }
}
