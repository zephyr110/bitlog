import { apiFetch } from "@/lib/api-client"
import { type PostSummary } from "@zlog/database"

export type AdminPostsResult =
  | { ok: true; posts: PostSummary[] }
  | { ok: false }

/** Fetch all posts including drafts for admin list/dashboard views. */
export async function fetchAdminPosts(): Promise<AdminPostsResult> {
  try {
    const res = await apiFetch("/api/posts?includeDrafts=true")
    if (!res.ok) return { ok: false }
    const data = (await res.json()) as { posts?: PostSummary[] }
    return { ok: true, posts: data.posts || [] }
  } catch {
    return { ok: false }
  }
}
