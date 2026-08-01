export {
  getAllPosts,
  getPublishedPosts,
  getPostBySlug,
  savePost,
  deletePost,
  movePost,
  getAllTags,
  getAllCategories,
  getPostsByCategory,
  getPostsByTag,
} from "./content"
export { getUserByUsername, setUserPassword } from "./users"
// Re-export domain logic from core for backwards compatibility.
export { safeSlug, slugify, computeReadingStats, toPostSummary } from "@bitlog/core"
export type { Post, PostSummary, AuthUser } from "@bitlog/core"
export type { UserRecord } from "./users"
