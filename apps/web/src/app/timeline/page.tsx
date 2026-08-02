import { type Metadata } from "next"
import { History } from "lucide-react"
import { getPublishedPosts } from "@zlog/database"
import { Trans } from "@/components/layout/trans"
import { defaultLocale, t } from "@/lib/i18n"
import { PageHeader } from "@/components/layout/page-header"
import { Container } from "@/components/ui/container"
import { YearSection } from "./year-section"

export const metadata: Metadata = {
  title: t(defaultLocale, "timeline.title") as string,
  description: t(defaultLocale, "timeline.description") as string,
}

function groupByYear(posts: { date: string; slug: string; title: string }[]) {
  const map = new Map<number, typeof posts>()
  for (const post of posts) {
    // Dates are UTC calendar dates — the UTC year is the authored year,
    // timezone-independent.
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
      <PageHeader
        breadcrumb={[{ href: "/", label: <Trans k="site.home" /> }]}
        icon={<History size={22} className="text-primary" />}
        title={<Trans k="timeline.title" />}
        description={
          (t(defaultLocale, "timeline.total") as (n: number) => string)(posts.length)
        }
      />

      {/* Timeline */}
      <Container size="lg">
        <div className="relative">
          {/* Vertical line — centered on the year-dot rail (w-10 md:w-12) */}
          <div className="absolute left-5 md:left-6 top-2 bottom-2 -translate-x-1/2 w-[2px] rounded-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
          </div>

          <div className="space-y-14">
            {grouped.map(([year, yearPosts], groupIdx) => (
              <div
                key={year}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{
                  animationDelay: `${Math.min(groupIdx, 6) * 120}ms`,
                  animationFillMode: "both",
                }}
              >
                <YearSection
                  year={year}
                  posts={yearPosts}
                  defaultOpen={groupIdx < 2}
                />
              </div>
            ))}
          </div>

          {/* Terminal cap */}
          {grouped.length > 0 && (
            <div className="mt-14 flex items-center gap-2 md:gap-3">
              <span className="flex w-10 md:w-12 shrink-0 justify-center">
                <span className="size-2 rotate-45 rounded-[2px] border border-primary/30 bg-primary/10" />
              </span>
            </div>
          )}

          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {t(defaultLocale, "timeline.empty") as string}
              </h2>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
