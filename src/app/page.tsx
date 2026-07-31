import { getPublishedPosts, getAllTags } from "@/lib/content"
import { PostFeed } from "@/components/blog/post-feed"
import { HeroSection } from "@/components/blog/hero-section"

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const allTags = await getAllTags()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <HeroSection postCount={posts.length} />
      <PostFeed posts={posts} allTags={allTags} />
    </div>
  )
}
