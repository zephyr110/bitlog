import { type Metadata } from "next"
import Link from "next/link"
import { getPublishedPosts } from "@bitlog/database"
import { siteConfig } from "@/lib/site-config"
import { Trans } from "@/components/layout/trans"
import { FormattedDate } from "@/components/blog/formatted-date"

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
          {/* Vertical line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-12">
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
      <summary className="flex items-center gap-3 cursor-pointer list-none mb-6">
        {/* Year dot on the line */}
        <div className="relative z-10 flex size-3 shrink-0 items-center justify-center ml-[2px] md:ml-[6px]">
          <div className="size-3 rounded-full bg-primary ring-4 ring-background group-open:scale-125 transition-transform" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{year}</h2>
        <span className="text-sm text-muted-foreground">
          {posts.length} 篇
        </span>
        <div className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {posts[0]?.date && (
            <>
              {posts[posts.length - 1]?.date.split("-")[1]}月 —{" "}
              {posts[0]?.date.split("-")[1]}月
            </>
          )}
        </div>
      </summary>

      <div className="ml-[22px] md:ml-[30px] space-y-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${encodeURIComponent(post.slug)}`}
            className="group/link flex items-center gap-4 px-3 py-2 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <time className="shrink-0 w-[4.5rem] text-xs text-muted-foreground font-mono tabular-nums">
              <FormattedDate date={post.date} month="short" />
            </time>
            <span className="text-sm font-medium truncate group-hover/link:text-primary transition-colors">
              {post.title}
            </span>
          </Link>
        ))}
      </div>
    </details>
  )
}
