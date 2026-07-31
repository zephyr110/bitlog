import { type Metadata } from "next"
import Link from "next/link"
import { getPublishedPosts } from "@bitlog/database"
import { Trans } from "@/components/layout/trans"

export const metadata: Metadata = {
  title: "时间轴",
  description: "按时间顺序浏览所有文章",
}

function groupByYear(posts: { date: string; slug: string; title: string }[]) {
  const map = new Map<number, typeof posts>()
  for (const post of posts) {
    const year = new Date(post.date).getFullYear()
    if (!Number.isFinite(year)) continue
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(post)
  }
  return Array.from(map.entries()).sort(([a], [b]) => b - a)
}

export default async function TimelinePage() {
  const posts = await getPublishedPosts()
  const grouped = groupByYear(posts)

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <section className="relative border-b bg-muted/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-3xl relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium">时间轴</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              时间轴
            </h1>
            <p className="text-muted-foreground">
              共 {posts.length} 篇文章
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <div className="relative">
          {/* Vertical line — subtle gradient, fading at edges */}
          <div className="absolute left-[19px] md:left-[27px] top-0 bottom-0 w-px">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
          </div>

          <div className="space-y-16">
            {grouped.map(([year, yearPosts], groupIdx) => (
              <YearSection
                key={year}
                year={year}
                posts={yearPosts}
                defaultOpen={groupIdx < 2}
              />
            ))}
          </div>

          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h2 className="text-2xl font-semibold mb-2">暂无文章</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function YearSection({
  year,
  posts,
  defaultOpen,
}: {
  year: number
  posts: { date: string; slug: string; title: string }[]
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex items-center gap-4 cursor-pointer list-none mb-6">
        {/* Year dot — nested rings with glow */}
        <div className="relative z-10 flex shrink-0 items-center justify-center ml-[3px] md:ml-[3px]">
          {/* Outer glow ring */}
          <div className="absolute size-4 rounded-full bg-primary/20 group-open:bg-primary/30 transition-colors" />
          {/* Ring */}
          <div className="absolute size-3 rounded-full border-2 border-primary/30 group-open:border-primary/50 group-open:scale-125 transition-all duration-300" />
          {/* Inner dot */}
          <div className="size-1.5 rounded-full bg-primary group-open:scale-110 transition-transform duration-300" />
        </div>

        {/* Horizontal tick connecting dot to content */}
        <div className="hidden md:block w-6 h-px bg-primary/15 group-open:bg-primary/25 transition-colors -ml-1" />

        <h2 className="text-2xl font-bold tracking-tight tabular-nums">{year}</h2>
        <span className="text-sm text-muted-foreground/70 font-medium tabular-nums">
          {posts.length} 篇
        </span>
        <div className="ml-auto text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block tabular-nums">
          {posts[0]?.date && (
            <>
              {posts[posts.length - 1]?.date?.split("-")[1]}月 —{" "}
              {posts[0]?.date?.split("-")[1]}月
            </>
          )}
        </div>
        {/* Chevron */}
        <svg
          className="shrink-0 size-4 text-muted-foreground/60 transition-transform duration-300 group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="relative ml-[27px] md:ml-[40px]">
        {/* Subtle horizontal connector line */}
        <div className="absolute -top-3 left-0 w-4 h-px bg-primary/10 hidden md:block" />

        <div className="space-y-0.5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${encodeURIComponent(post.slug)}`}
              className="group/link flex items-center gap-4 px-3 py-2 -mx-3 rounded-lg hover:bg-muted/40 transition-colors"
            >
              {/* Bullet */}
              <div className="shrink-0 size-1 rounded-full bg-primary/25 group-hover/link:bg-primary/50 transition-colors" />
              <time className="shrink-0 w-[3.5rem] text-xs text-muted-foreground/60 font-mono tabular-nums group-hover/link:text-muted-foreground transition-colors">
                {post.date.slice(5)}
              </time>
              <span className="text-sm font-medium truncate group-hover/link:text-primary transition-colors">
                {post.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </details>
  )
}
