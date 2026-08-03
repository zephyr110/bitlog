"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { PostCard } from "@/components/blog/post-card"
import { YearNavBar, BackToTopButton } from "@/components/blog/year-nav"
import { useT } from "@/components/layout/trans"
import { FileText, Search, X, ChevronDown } from "lucide-react"
import { type PostSummary } from "@zlog/database"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { resolveCategory, getCategoryLabel } from "@/lib/categories"
import { cn } from "@/lib/utils"

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

/** The years that should start collapsed on load / after clearing filters:
 *  every year except the default-expanded one. Computed from the full
 *  `posts` prop so it is filter-independent. */
function defaultCollapsedYears(posts: PostSummary[], expandYear: number): Set<number> {
  const collapsed = new Set<number>()
  for (const post of posts) {
    const year = new Date(post.date).getFullYear()
    if (Number.isFinite(year) && year !== expandYear) collapsed.add(year)
  }
  return collapsed
}

export function PostFeed({ posts, allTags }: PostFeedProps) {
  const { t } = useT()
  const searchParams = useSearchParams()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Year-group collapse/expand. Default: the newest year with posts (the
  // current year when the blog has this year's posts) expanded, all older
  // years collapsed. Filtering expands everything so results are visible;
  // clearing the filter restores the default.
  const initialExpandYear = useMemo(() => {
    const thisYear = new Date().getFullYear()
    let newest = -Infinity
    for (const post of posts) {
      const y = new Date(post.date).getFullYear()
      if (Number.isFinite(y) && y > newest) newest = y
    }
    return newest === thisYear ? thisYear : newest
  }, [posts])
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(() =>
    defaultCollapsedYears(posts, initialExpandYear)
  )
  // Years whose cards are actually in the DOM. Collapsed years stay
  // unmounted until first expanded, so an entry to the page with many
  // posts only renders the default-expanded year's cards (cheap first
  // paint — no card DOM, no cover images, no hydration). Collapsing
  // keeps the content around for the collapse animation, then unmounts
  // it. Mirrored into a ref for the delayed-unmount check.
  const [mountedYears, setMountedYears] = useState<Set<number>>(() =>
    new Set([initialExpandYear])
  )
  const collapsedRef = useRef(collapsedYears)
  useEffect(() => {
    collapsedRef.current = collapsedYears
  }, [collapsedYears])

  function toggleYear(year: number) {
    if (collapsedYears.has(year)) {
      // Expanding — mount the cards this render so the grid-rows
      // animation can unfold them.
      setCollapsedYears((prev) => {
        const next = new Set(prev)
        next.delete(year)
        return next
      })
      setMountedYears((prev) => new Set(prev).add(year))
    } else {
      // Collapsing — keep the cards mounted through the collapse
      // animation, then unmount them.
      setCollapsedYears((prev) => {
        const next = new Set(prev)
        next.add(year)
        return next
      })
      window.setTimeout(() => {
        // Re-expanded while animating? Keep the cards.
        if (!collapsedRef.current.has(year)) return
        setMountedYears((prev) => {
          const next = new Set(prev)
          next.delete(year)
          return next
        })
      }, 340)
    }
  }

  function resetCollapse() {
    setCollapsedYears(defaultCollapsedYears(posts, initialExpandYear))
  }

  // Keep the search box in sync with ?q= — fires on mount and on any
  // URL change (e.g. header search submits via router.push).
  const urlQuery = searchParams?.get("q") ?? ""
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setSearchQuery(urlQuery)
    // Searching — show every match, so expanded results are all visible.
    setCollapsedYears(new Set())
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

  // Year groups (newest first) — the sticky YearNavBar jumps between
  // them, and an IntersectionObserver keeps the bar's highlight on the
  // section currently in view.
  const grouped = useMemo(() => {
    const map = new Map<number, PostSummary[]>()
    for (const post of filteredPosts) {
      const year = new Date(post.date).getFullYear()
      if (!Number.isFinite(year)) continue
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(post)
    }
    return Array.from(map.entries())
  }, [filteredPosts])

  // Adjust during render (React pattern, same as the ?q= sync above):
  // a group that is expanded but not mounted yet — e.g. a year group
  // that only exists after a search/filter — must mount its cards.
  if (
    grouped.some(
      ([year]) => !collapsedYears.has(year) && !mountedYears.has(year)
    )
  ) {
    setMountedYears((prev) => {
      const next = new Set(prev)
      for (const [year] of grouped) {
        if (!collapsedYears.has(year)) next.add(year)
      }
      return next
    })
  }

  const years = grouped.map(([year]) => year)
  const [activeYear, setActiveYear] = useState<number | null>(null)
  // Derived fallback instead of a state write: after a filter/search the
  // stored year may not exist anymore — highlight the first visible group.
  // Collapsed groups never count, so folding the highlighted section moves
  // the highlight to the first expanded one.
  const currentYear =
    activeYear !== null &&
    years.includes(activeYear) &&
    !collapsedYears.has(activeYear)
      ? activeYear
      : (years.find((year) => !collapsedYears.has(year)) ?? null)
  const sectionRefs = useRef(new Map<number, HTMLElement>())

  useEffect(() => {
    if (grouped.length < 2) return
    const observer = new IntersectionObserver(
      (entries) => {
        let best: Element | null = null
        let bestTop = Infinity
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // Collapsed sections are just their header — they must not
          // become the highlighted year.
          if (collapsedYears.has(Number((entry.target as HTMLElement).dataset.year))) {
            continue
          }
          if (entry.boundingClientRect.top < bestTop) {
            bestTop = entry.boundingClientRect.top
            best = entry.target
          }
        }
        if (best) {
          setActiveYear(Number((best as HTMLElement).dataset.year))
        }
      },
      // Detection band just below the site header + sticky year bar;
      // the bottom -70% keeps it narrow so only one section is active.
      { rootMargin: "-108px 0px -70% 0px", threshold: 0 }
    )
    sectionRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [grouped, collapsedYears])

  function jumpToYear(year: number) {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // Expand the target group first (the pill may point at a collapsed
    // year), then wait for the expand animation to settle before
    // scrolling, so the target has its final height.
    const wasCollapsed = collapsedYears.has(year)
    if (wasCollapsed) {
      setCollapsedYears((prev) => {
        const next = new Set(prev)
        next.delete(year)
        return next
      })
      // Mount the target year's cards so the section has content to
      // scroll into once the expand animation settles.
      setMountedYears((prev) => new Set(prev).add(year))
    }
    window.setTimeout(
      () => {
        document
          .getElementById(`year-${year}`)
          ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
      },
      wasCollapsed && !reduce ? 340 : 0
    )
  }

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
                // Searching — expand every group so matches are visible.
                setCollapsedYears(new Set())
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
                  setCollapsedYears(new Set())
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
                onClick={() => {
                  setActiveTag(activeTag === cat ? null : cat)
                  // Filtering — expand every group so matches are visible.
                  setCollapsedYears(new Set())
                }}
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
              // Back to browsing — restore the default collapse state.
              resetCollapse()
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

      {/* Sticky year-jump bar — hidden until there are 2+ year groups */}
      <YearNavBar years={years} activeYear={currentYear} onSelect={jumpToYear} />

      {/* Posts Grid — grouped by year */}
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
        <div className="space-y-12">
          {grouped.map(([year, yearPosts]) => {
            const expanded = !collapsedYears.has(year)
            return (
              <section
                key={year}
                id={`year-${year}`}
                data-year={year}
                ref={(el) => {
                  if (el) sectionRefs.current.set(year, el)
                  else sectionRefs.current.delete(year)
                }}
                className="scroll-mt-28"
              >
                <h2 className="mb-5 border-b border-border/60 animate-in fade-in duration-500">
                  <button
                    type="button"
                    onClick={() => toggleYear(year)}
                    aria-expanded={expanded}
                    aria-controls={`year-posts-${year}`}
                    aria-label={`${
                      (expanded
                        ? t("site.yearCollapse")
                        : t("site.yearExpand")) as string
                    } ${year}`}
                    className="group flex w-full items-center gap-3 rounded-md pb-2 text-left -mx-1 px-1 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-2xl font-bold tracking-tight tabular-nums">
                      {year}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(t("site.yearPosts") as (n: number) => string)(
                        yearPosts.length
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className={cn(
                        "ml-auto text-muted-foreground transition-transform duration-300 group-hover:text-foreground motion-reduce:transition-none",
                        expanded ? "rotate-180" : ""
                      )}
                    />
                  </button>
                </h2>
                {/* grid-template-rows 0fr→1fr — animatable collapse
                    without measuring heights; content fades on top. */}
                <div
                  id={`year-posts-${year}`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    {/* Cards of collapsed years are unmounted until first
                        expanded (lazy load). */}
                    {mountedYears.has(year) && (
                      <div
                        className={cn(
                          "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 [&>div]:h-full transition-opacity duration-200 motion-reduce:transition-none",
                          expanded ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {yearPosts.map((post, index) => (
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
                </div>
              </section>
            )
          })}
        </div>
      )}

      <BackToTopButton />
    </div>
  )
}
