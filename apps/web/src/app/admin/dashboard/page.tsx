"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardAction, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PostStats } from "@/components/admin/post-stats"
import { ContributionCalendar } from "@/components/admin/contribution-calendar"
import { FormattedDate } from "@/components/blog/formatted-date"
import { CardSkeleton, ListSkeleton } from "@/components/ui/loading"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useT } from "@/components/layout/trans"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { FileText, PenLine, Clock, Tag } from "lucide-react"
import { type PostSummary } from "@bitlog/database"

export default function AdminDashboardPage() {
  const { t } = useT()
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await apiFetch("/api/posts?includeDrafts=true")
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const published = posts.filter((p) => !p.draft)
  const drafts = posts.filter((p) => p.draft)
  const allTags = new Set(posts.flatMap((p) => p.tags))

  const stats = [
    {
      label: t("admin.totalPosts") as string,
      value: posts.length,
      icon: FileText,
      tile: "bg-muted text-foreground",
      href: "/admin/posts",
    },
    {
      label: t("admin.published") as string,
      value: published.length,
      icon: PenLine,
      tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      href: "/admin/posts?status=published",
    },
    {
      label: t("admin.drafts") as string,
      value: drafts.length,
      icon: Clock,
      tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      href: "/admin/posts?status=drafts",
    },
    {
      label: t("admin.tags") as string,
      value: allTags.size,
      icon: Tag,
      tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
  ]

  if (loading) {
    // Mirrors the loaded layout: Statistics (title + stat cards +
    // calendar card), the two chart cards, then recent posts.
    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <CardSkeleton count={4} />
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-[118px] w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <ListSkeleton items={5} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Statistics — stat cards + contribution calendar */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("admin.statistics") as string}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            const inner = (
              <>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <CardAction>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        stat.tile
                      )}
                    >
                      <Icon size={16} />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                </CardContent>
              </>
            )
            return stat.href ? (
              <Link
                key={stat.label}
                href={stat.href}
                className="block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-all hover:border-primary/20 hover:shadow-md hover:shadow-foreground/[0.04]">
                  {inner}
                </Card>
              </Link>
            ) : (
              <Card
                key={stat.label}
                className="transition-all hover:border-primary/10 hover:shadow-md hover:shadow-foreground/[0.04]"
              >
                {inner}
              </Card>
            )
          })}
        </div>

        {/* Contribution calendar — full width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("admin.postsCalendar") as string}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ContributionCalendar posts={posts} />
          </CardContent>
        </Card>
      </section>

      {/* Charts */}
      <PostStats posts={posts} />

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {t("admin.recentPosts") as string}
          </h2>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t("admin.viewAll") as string}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        {posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} className="text-muted-foreground" />}
            title={t("admin.noPostsYet") as string}
            description={t("admin.noPostsYetDesc") as string}
            action={
              <Link
                href="/admin/posts/new"
                className="inline-flex h-9 items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium px-3 hover:bg-primary/80"
              >
                {t("admin.createFirstPost") as string}
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 5).map((post) => (
              <Card
                key={post.slug}
                className="hover:border-primary/10 transition-colors"
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/posts/edit?slug=${encodeURIComponent(
                        post.slug
                      )}`}
                      className="font-medium hover:text-primary transition-colors truncate block"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      <FormattedDate date={post.date} month="short" /> ·{" "}
                      {(t("post.minRead") as (n: number) => string)(post.readingTime)}
                      {post.draft && (
                        <span className="ml-2 text-amber-600 font-medium">
                          {t("admin.draft") as string}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/admin/posts/edit?slug=${encodeURIComponent(
                      post.slug
                    )}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium px-2.5 hover:bg-muted transition-all shrink-0"
                  >
                    {t("admin.edit") as string}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
