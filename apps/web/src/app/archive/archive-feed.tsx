"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FileText, Search, X } from "lucide-react"
import { type PostSummary } from "@zlog/database"
import { YearNavBar, BackToTopButton } from "@/components/blog/year-nav"
import { TagBadge } from "@/components/blog/tag-badge"
import { useT } from "@/components/layout/trans"
import { Input } from "@/components/ui/input"
import { resolveCategory, getCategoryLabel } from "@/lib/categories"
import { parseUtcDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface ArchiveFeedProps {
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

/** "8月3日" / "Aug 3" — dates are UTC calendar dates (parseUtcDate), so
 *  this renders identically on the build machine and in the browser. */
function formatMonthDay(dateStr: string, locale: string): string {
  const d = parseUtcDate(dateStr)
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/** The archive feed: a dense, retrieval-oriented index of every post —
 *  filter toolbar on top, sticky year-jump pills, then compact
 *  date + title rows grouped under year headings. No collapsing: this
 *  page exists so readers can scan and search the whole catalog. */
export function ArchiveFeed({ posts, allTags }: ArchiveFeedProps) {
  const { t, locale } = useT()
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

  const years = grouped.map(([year]) => year)
  const [activeYear, setActiveYear] = useState<number | null>(null)
  // Derived fallback: after a filter/search the stored year may not exist
  // anymore — highlight the first visible group.
  const currentYear =
    activeYear !== null && years.includes(activeYear)
      ? activeYear
      : (years[0] ?? null)
  const sectionRefs = useRef(new Map<number, HTMLElement>())

  useEffect(() => {
    if (grouped.length < 2) return
    const observer = new IntersectionObserver(
      (entries) => {
        let best: Element | null = null
        let bestTop = Infinity
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
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
  }, [grouped])

  function jumpToYear(year: number) {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document
      .getElementById(`year-${year}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }

  return (
    <div>
      {/* Search & Topics — one toolbar row, controls share the h-8 height
          and the pill language of the year-nav below */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative w-full lg:max-w-xs lg:shrink-0">
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
              className="pl-9 pr-8"
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

          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => {
              const active = activeTag === cat
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTag(active ? null : cat)}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                      : "border-border/60 bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  )}
                >
                  {getCategoryLabel(cat, t)}
                </button>
              )
            })}
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

      {/* Sticky year-jump bar — hidden until there are 2+ year groups */}
      <YearNavBar years={years} activeYear={currentYear} onSelect={jumpToYear} />

      {/* Dense year-grouped index */}
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
        <div className="space-y-10">
          {grouped.map(([year, yearPosts]) => (
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
              <h2 className="mb-3 flex items-center gap-3 animate-in fade-in duration-500">
                <span
                  aria-hidden
                  className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary/70 to-primary/20"
                />
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {year}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(t("site.yearPosts") as (n: number) => string)(
                    yearPosts.length
                  )}
                </span>
              </h2>

              <ul className="divide-y divide-border/50 border-y border-border/50">
                {yearPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/posts/${encodeURIComponent(post.slug)}`}
                      className="group flex items-baseline gap-3 px-2 py-2.5 -mx-2 rounded-md transition-colors hover:bg-muted/50 sm:gap-4"
                    >
                      <time
                        dateTime={post.date}
                        className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground"
                      >
                        {formatMonthDay(post.date, locale)}
                      </time>
                      <span className="min-w-0 flex-1 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
                        {post.title}
                      </span>
                      {post.tags.length > 0 && (
                        <span className="hidden shrink-0 gap-1.5 md:flex">
                          {post.tags.slice(0, 2).map((tag) => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BackToTopButton />
    </div>
  )
}
