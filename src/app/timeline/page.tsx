import { type Metadata } from "next"
import Link from "next/link"
import { getPublishedPosts } from "@bitlog/database"
import { Trans } from "@/components/layout/trans"
import { YearSection } from "./year-section"

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
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl relative">
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
      <div className="container mx-auto px-4 py-16 md:py-20 max-w-5xl">
        <div className="relative">
          {/* Vertical line */}
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
