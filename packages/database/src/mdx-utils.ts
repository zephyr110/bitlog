import { type Post, type PostSummary } from "./types"

const READING_SPEED_WPM = 200 // Chinese/English average

export function computeReadingStats(content: string): {
  wordCount: number
  readingTime: number
} {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM))
  return { wordCount, readingTime }
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
