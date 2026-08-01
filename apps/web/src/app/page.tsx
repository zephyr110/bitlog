import { Suspense } from "react"
import { getPublishedPosts, getAllTags } from "@bitlog/database"
import { PostFeed } from "@/components/blog/post-feed"
import { HeroSection } from "@/components/blog/hero-section"
import { PostFeedSkeleton } from "@/components/ui/loading"

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const allTags = await getAllTags()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <HeroSection postCount={posts.length} />
      {/* Suspense is required for the client-side useSearchParams in
          the static export build. */}
      <Suspense fallback={<PostFeedSkeleton count={6} />}>
        <PostFeed posts={posts} allTags={allTags} />
      </Suspense>
    </div>
  )
}
