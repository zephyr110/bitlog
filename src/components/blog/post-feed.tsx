"use client"

import { useState, useMemo } from "react"
import { PostCard } from "@/components/blog/post-card"
import { useT } from "@/components/layout/trans"
import { FileText, X } from "lucide-react"
import { type PostSummary } from "@/types"

interface PostFeedProps {
  posts: PostSummary[]
  allTags: string[]
}

export function PostFeed({ posts, allTags }: PostFeedProps) {
  const { t } = useT()
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts
    return posts.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
    )
  }, [posts, activeTag])

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="text-sm font-medium text-muted-foreground mr-1">
            {t("site.topics") as string}
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                activeTag === tag
                  ? "border-primary/40 bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results count when filtered */}
      {activeTag && (
        <div className="flex items-center gap-2 mb-6 animate-in fade-in duration-300">
          <button
            onClick={() => setActiveTag(null)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary hover:bg-primary/15 transition-all"
          >
            <X size={12} />
            {t("site.clearFilter") as string}
          </button>
          <span className="text-xs text-muted-foreground">
            {(t("site.articlesPublished") as (n: number) => string)(filteredPosts.length)}
          </span>
        </div>
      )}

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-6">
            <FileText size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {activeTag ? (t("site.noMatchPosts") as string) : (t("site.noPosts") as string)}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {activeTag
              ? (t("site.noMatchPostsDesc") as (tag: string) => string)(activeTag)
              : (t("site.noPostsDesc") as string)}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
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
  )
}
