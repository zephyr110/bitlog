import { HeroSection } from "@/components/blog/hero-section"
import { PostFeedSkeleton } from "@/components/ui/loading"

export default function HomeLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Keep hero visible — it has no dynamic data */}
      <HeroSection postCount={0} />
      <PostFeedSkeleton count={6} />
    </div>
  )
}
