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
 *  date + title rows grouped under year headings, each collapsible via
 *  a toggle button. Collapsed sections are inert and hidden from the
   *  accessibility tree. */
export function ArchiveFeed({ posts, allTags }: ArchiveFeedProps) {
  const { t, locale } = useT()
  const searchParams = useSearchParams()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  // Year collapse state — a year in this Set means it is collapsed.
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  // The ?q= URL param is the single source of truth for the search term.
  const urlQuery = searchParams?.get("q") ?? ""
  const [searchQuery, setSearchQuery] = useState(urlQuery)

  // Sync from URL changes (header search, browser back/forward).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external URL state
    setSearchQuery(urlQuery)
  }, [urlQuery])

  // Debounce typing: the input is uncontrolled (key held in a local ref)
  // so keystrokes are never lost by React re-renders; only filtering and
  // the URL are throttled.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset collapse state when filters change so search results are never
  // silently hidden inside collapsed year sections.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset collapse when filters change
    setCollapsedYears(new Set())
  }, [searchQuery, activeTag])

  // Clean up the pending debounce on unmount so a stale timer can't
  // corrupt the URL of whatever page the user navigated to next.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function onSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/immutability -- standard debounce ref pattern
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
      syncSearchUrl(value)
    }, 150)
  }
  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchQuery("")
    syncSearchUrl("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const categories = useMemo(
    () => [...new Set(allTags.map(resolveCategory))],
    [allTags]
  )

  const filteredPosts = useMemo(() => {
    let result = posts
    // `!== null` (not truthiness): an empty-string category must still
    // filter — the pill would otherwise show pressed but filter nothing.
    if (activeTag !== null) {
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
  // section currently in view. Dates are UTC calendar dates, so the
  // group year must use the UTC calendar year (local getFullYear() on a
  // UTC-midnight date misgroups Dec-31/Jan-1 posts for negative-offset
  // timezones).
  const grouped = useMemo(() => {
    const map = new Map<number, PostSummary[]>()
    for (const post of filteredPosts) {
      const year = parseUtcDate(post.date).getUTCFullYear()
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
    const lastYear = grouped[grouped.length - 1]?.[0]
    // A short final section can never enter the narrow detection band —
    // at the bottom of the page the last group is the active one.
    const onScroll = () => {
      if (
        lastYear !== undefined &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 8
      ) {
        setActiveYear(lastYear)
      }
    }
    sectionRefs.current.forEach((el) => observer.observe(el))
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [grouped])

  function jumpToYear(year: number) {
    // Auto-expand a collapsed year so the user actually sees its content.
    setCollapsedYears((prev) => {
      if (!prev.has(year)) return prev
      const next = new Set(prev)
      next.delete(year)
      return next
    })
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    sectionRefs.current
      .get(year)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }

  function toggleYear(year: number) {
    setCollapsedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  const allCollapsed = collapsedYears.size > 0 && years.every((y) => collapsedYears.has(y))
  function toggleAll() {
    if (allCollapsed) {
      setCollapsedYears(new Set())
    } else {
      setCollapsedYears(new Set(years))
    }
  }

  return (
    <div>
      {/* Search & Topics — one toolbar row, controls share the h-8 height
          and the pill language of the year-nav below. The search box is
          independent of the topic pills: a tagless site must still be
          searchable (the header search routes here too). */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="relative w-full lg:max-w-xs lg:shrink-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            ref={inputRef}
            defaultValue={urlQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("site.searchPosts") as string}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
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
        )}
      </div>

      {/* Results count when filtered */}
      {(activeTag !== null || searchQuery.trim() !== "") && (
        <div className="flex items-center gap-2 mb-6 animate-in fade-in duration-300">
          <button
            onClick={() => {
              setActiveTag(null)
              clearSearch()
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

      {/* Sticky year-jump bar — hidden until there are 2+ year groups.
          The collapse-all toggle rides on the same row: it stays fixed
          (shrink-0) while the year pills scroll on narrow screens. */}
      <YearNavBar years={years} activeYear={currentYear} onSelect={jumpToYear}>
        {years.length >= 2 && filteredPosts.length > 0 && (
          <button
            onClick={toggleAll}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
          >
            <svg
              className={`size-3 transition-transform duration-300 ${allCollapsed ? "" : "rotate-180"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            {allCollapsed
              ? (t("site.yearExpandAll") as string)
              : (t("site.yearCollapseAll") as string)}
          </button>
        )}
      </YearNavBar>

      {/* Dense year-grouped index */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-6">
            <FileText size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {activeTag !== null || searchQuery.trim() !== ""
              ? (t("site.noMatchPosts") as string)
              : (t("site.noPosts") as string)}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {activeTag !== null
              ? (t("site.noMatchPostsDesc") as (tag: string) => string)(activeTag)
              : searchQuery.trim() !== ""
                ? (t("site.noSearchMatchDesc") as (q: string) => string)(
                    searchQuery.trim()
                  )
                : (t("site.noPostsDesc") as string)}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(([year, yearPosts]) => {
            const collapsed = collapsedYears.has(year)
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
              {/* Year heading — h2 wraps the collapse toggle so the document
                   outline is preserved for assistive technology. */}
              <h2 className="mb-4 animate-in fade-in duration-500">
                <button
                  onClick={() => toggleYear(year)}
                  aria-expanded={!collapsed}
                  className="flex w-full items-center gap-3 text-left cursor-pointer group/heading"
                >
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
                  {/* Chevron — down when collapsed, up when expanded */}
                  <span className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground/60 transition-all duration-300 group-hover/heading:border-border group-hover/heading:text-muted-foreground">
                    <svg
                      className={`size-3.5 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
              </h2>

              {/* Collapsible post list — animated via grid-rows.
                   When collapsed the inner wrapper is made inert so keyboard
                   focus and screen readers skip the hidden links. */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                }`}
              >
                <div className="overflow-hidden" inert={collapsed || undefined}>
                  <ul className="divide-y divide-border/50 border-y border-border/50">
                    {yearPosts.map((post) => (
                      <li key={post.slug}>
                        <Link
                          href={`/posts/${encodeURIComponent(post.slug)}`}
                          className="group flex items-baseline gap-3 px-2 py-3.5 -mx-2 rounded-md transition-colors hover:bg-muted/50 sm:gap-4"
                        >
                          <time
                            dateTime={post.date}
                            className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground"
                          >
                            {formatMonthDay(post.date, locale)}
                          </time>
                          <span className="min-w-0 flex-1 text-sm font-medium leading-relaxed transition-colors group-hover:text-primary">
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
                </div>
              </div>
            </section>
          )})}
        </div>
      )}

      <BackToTopButton />
    </div>
  )
}
