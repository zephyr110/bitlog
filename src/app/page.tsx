import { getPublishedPosts, getAllTags } from "@/lib/content"
import { PostFeed } from "@/components/blog/post-feed"
import { HeroSection } from "@/components/blog/hero-section"

export default function HomePage() {
  const posts = getPublishedPosts()
  const allTags = getAllTags()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <HeroSection postCount={posts.length} />
      <PostFeed posts={posts} allTags={allTags} />
    </div>
  )
}
