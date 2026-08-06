"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardAction, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PostStats } from "@/components/admin/post-stats"
import { ContributionCalendar } from "@/components/admin/contribution-calendar"
import { FormattedDate } from "@/components/blog/formatted-date"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { fetchAdminPosts } from "@/lib/admin-posts"
import { useCommentUnread } from "@/components/admin/comment-unread"
import { cn } from "@/lib/utils"
import { FileText, PenLine, Clock, Tag, MessageSquare } from "lucide-react"
import { type PostSummary } from "@zlog/database"

export default function AdminDashboardPage() {
  const { t } = useT()
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const { unread: unreadComments } = useCommentUnread()

  useEffect(() => {
    async function fetchPosts() {
      const result = await fetchAdminPosts()
      if (result.ok) {
        setPosts(result.posts)
      } else {
        toast.error(t("admin.loadFailed") as string)
      }
      setLoading(false)
    }
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once fetch; adding `t` (new identity per render) would refetch on every render
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
    {
      label: t("admin.unreadComments") as string,
      value: unreadComments,
      icon: MessageSquare,
      tile: "bg-primary/10 text-primary",
      href: "/admin/comments",
    },
  ]

  if (loading) {
    // Mirrors the loaded layout 1:1 — Statistics (title + stat cards +
    // calendar card), the two chart cards, then recent posts — same grid
    // columns, card chrome, and content heights so the swap to real data
    // causes no layout shift.
    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <Skeleton className="h-7 w-32" />

          {/* Stat cards — same 5-up grid as the loaded view */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-card ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between p-4 pb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="size-8 rounded-lg" />
                </div>
                <div className="p-4 pt-0">
                  <Skeleton className="h-9 w-10" />
                </div>
              </div>
            ))}
          </div>

          {/* Contribution calendar card */}
          <div className="rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="p-4 pb-3">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-4 pt-0">
              <div className="mb-3 flex justify-end">
                <Skeleton className="h-8 w-36 rounded-md" />
              </div>
              <Skeleton className="h-[118px] w-full" />
              <div className="mt-2.5 flex items-center justify-end gap-1.5">
                <Skeleton className="h-2.5 w-8" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="size-2.5 rounded-[3px]" />
                ))}
                <Skeleton className="h-2.5 w-8" />
              </div>
            </div>
          </div>
        </section>

        {/* Charts — same 2-up grid, 240px plot area as the loaded view */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-card ring-1 ring-foreground/10"
            >
              <div className="flex items-center justify-between p-4 pb-0">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-7 w-28 rounded-md" />
              </div>
              <div className="p-4">
                <Skeleton className="h-[240px] w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent posts — section header + list */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-8 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
