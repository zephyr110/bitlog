"use client"

import { useState, useMemo } from "react"
import { PostCard } from "@/components/blog/post-card"
import { useT } from "@/components/layout/trans"
import { FileText, Search, X } from "lucide-react"
import { type PostSummary } from "@bitlog/database"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface PostFeedProps {
  posts: PostSummary[]
  allTags: string[]
  initialSearch?: string
}

export function PostFeed({ posts, allTags, initialSearch = "" }: PostFeedProps) {
  const { t } = useT()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Tags look like "frontend--css" — collapse to major categories ("frontend")
  const majorTag = (tag: string) => tag.split("--")[0]
  const categories = useMemo(
    () => [...new Set(allTags.map(majorTag))],
    [allTags]
  )

  const filteredPosts = useMemo(() => {
    let result = posts
    if (activeTag) {
      result = result.filter((p) =>
        p.tags.some((tag) => majorTag(tag).toLowerCase() === activeTag.toLowerCase())
      )
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    }
    return result
  }, [posts, activeTag, searchQuery])

  return (
    <div id="post-feed" className="container mx-auto px-4 py-12 max-w-5xl 2xl:max-w-7xl scroll-mt-16">
      {/* Search & Tags Filter */}
      {allTags.length > 0 && (
        <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("site.searchPosts") as string}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">
              {t("site.topics") as string}
            </span>
            {categories.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                <Badge
                  variant={activeTag === tag ? "default" : "secondary"}
                  className="cursor-pointer transition-all"
                >
                  {tag}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count when filtered */}
      {(activeTag || searchQuery) && (
        <div className="flex items-center gap-2 mb-6 animate-in fade-in duration-300">
          <button
            onClick={() => {
              setActiveTag(null)
              setSearchQuery("")
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-xs font-medium text-primary hover:bg-primary/15 transition-all"
          >
            <X size={12} />
            {t("site.clearFilter") as string}
          </button>
          <span className="text-xs text-muted-foreground">
            {(t("site.articlesPublished") as (n: number) => string)(
              filteredPosts.length
            )}
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
            {activeTag || searchQuery
              ? (t("site.noMatchPosts") as string)
              : (t("site.noPosts") as string)}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {activeTag || searchQuery
              ? (t("site.noMatchPostsDesc") as (tag: string) => string)(
                  activeTag || searchQuery
                )
              : (t("site.noPostsDesc") as string)}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>div]:h-full">
          {filteredPosts.map((post, index) => (
            <div
              key={post.slug}
              className="h-full animate-in fade-in slide-in-from-bottom-4"
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
