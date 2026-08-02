"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { PostCard } from "@/components/blog/post-card"
import { useT } from "@/components/layout/trans"
import { FileText, Search, X } from "lucide-react"
import { type PostSummary } from "@zlog/database"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { resolveCategory, getCategoryLabel } from "@/lib/categories"

interface PostFeedProps {
  posts: PostSummary[]
  allTags: string[]
}

/** Update the ?q= URL param (replaceState — no navigation, no server round-trip). */
function syncSearchUrl(q: string): void {
  const url = new URL(window.location.href)
  const trimmed = q.trim()
  if (trimmed) url.searchParams.set("q", trimmed)
  else url.searchParams.delete("q")
  window.history.replaceState(null, "", url)
}

export function PostFeed({ posts, allTags }: PostFeedProps) {
  const { t } = useT()
  const searchParams = useSearchParams()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Keep the search box in sync with ?q= — fires on mount and on any
  // URL change (e.g. header search submits via router.push).
  const urlQuery = searchParams?.get("q") ?? ""
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setSearchQuery(urlQuery)
  }

  const categories = useMemo(
    () => [...new Set(allTags.map(resolveCategory))],
    [allTags]
  )

  const filteredPosts = useMemo(() => {
    let result = posts
    if (activeTag) {
      result = result.filter((p) =>
        p.tags.some((tag) => resolveCategory(tag).toLowerCase() === activeTag.toLowerCase())
      )
    }
    const query = searchQuery.trim()
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
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
              onChange={(e) => {
                setSearchQuery(e.target.value)
                // Keep the URL shareable without a server round-trip.
                syncSearchUrl(e.target.value)
              }}
              placeholder={t("site.searchPosts") as string}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  syncSearchUrl("")
                }}
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
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTag(activeTag === cat ? null : cat)}
              >
                <Badge
                  variant={activeTag === cat ? "default" : "secondary"}
                  className="cursor-pointer transition-all"
                >
                  {getCategoryLabel(cat, t)}
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
              syncSearchUrl("")
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
