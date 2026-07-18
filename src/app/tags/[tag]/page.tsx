import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getPostsByTag, getAllTags } from "@/lib/content"
import { PostCard } from "@/components/blog/post-card"

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const tags = getAllTags()
  return tags.map((tag) => ({ tag }))
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  return {
    title: `Posts tagged "${decodedTag}"`,
    description: `All blog posts tagged with "${decodedTag}".`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const allTags = getAllTags()

  if (!allTags.some((t) => t.toLowerCase() === decodedTag.toLowerCase())) {
    notFound()
  }

  const posts = getPostsByTag(decodedTag)

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-4xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground/70">Tags</span>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium">{decodedTag}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              <span className="text-primary">#</span>
              {decodedTag}
            </h1>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"} with this tag
            </p>
          </div>
        </div>
      </section>

      {/* Tags bar */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">
            All tags:
          </span>
          {allTags.map((t) => {
            const isActive = t.toLowerCase() === decodedTag.toLowerCase()
            return (
              <Link
                key={t}
                href={`/tags/${encodeURIComponent(t.toLowerCase())}`}
                className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {t}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Posts */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-semibold mb-2">No posts found</h2>
            <p className="text-muted-foreground">
              No posts with the tag &quot;{decodedTag}&quot; yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <div
                key={post.slug}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDuration: "500ms",
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: "both",
                }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
