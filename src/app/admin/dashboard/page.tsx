"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PostStats } from "@/components/admin/post-stats"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/components/layout/trans"
import { apiFetch } from "@/lib/api-client"
import { type PostSummary } from "@/types"

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.dashboard") as string}</h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.dashboardWelcome") as string}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium px-3 hover:bg-primary/80 transition-all"
        >
          {t("admin.newPost") as string}
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.totalPosts") as string}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.published") as string}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {published.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.drafts") as string}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {drafts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.tags") as string}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allTags.size}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <PostStats posts={posts} />

      {/* Recent Posts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("admin.recentPosts") as string}</h2>
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("admin.noPostsYet") as string}{" "}
              <Link
                href="/admin/posts/new"
                className="text-primary hover:underline"
              >
                {t("admin.createFirstPost") as string}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 5).map((post) => (
              <Card key={post.slug}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <Link
                      href={`/admin/posts/edit?slug=${post.slug}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.date).toLocaleDateString()} ·{" "}
                      {post.readingTime} {(t("post.minRead") as (n:number)=>string)(post.readingTime)}
                      {post.draft && (
                        <span className="ml-2 text-amber-600 font-medium">
                          {t("admin.draft") as string}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/admin/posts/edit?slug=${post.slug}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium px-2.5 hover:bg-muted transition-all"
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
