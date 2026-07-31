import { getPublishedPosts, getAllTags } from "@bitlog/database"
import { PostFeed } from "@/components/blog/post-feed"
import { HeroSection } from "@/components/blog/hero-section"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const posts = await getPublishedPosts()
  const allTags = await getAllTags()
  const { q } = await searchParams

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <HeroSection postCount={posts.length} />
      <PostFeed posts={posts} allTags={allTags} initialSearch={q || ""} />
    </div>
  )
}
