"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EllipsisVertical, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { type PostSummary } from "@/types"

export default function AdminPostsPage() {
  const { t } = useT()
  const router = useRouter()
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "drafts">("all")
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const PAGE_SIZE = 20

  async function fetchPosts() {
    try {
      const res = await apiFetch("/api/posts?includeDrafts=true")
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      toast.error(t("admin.loadFailed") as string)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts() // eslint-disable-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredPosts = useMemo(() => {
    let result = posts
    if (statusFilter === "published") result = result.filter((p) => !p.draft)
    if (statusFilter === "drafts") result = result.filter((p) => p.draft)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(query))
    }
    return result
  }, [posts, searchQuery, statusFilter])

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredPosts.slice(start, start + PAGE_SIZE)
  }, [filteredPosts, page])

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE)

  const paginationItems = useMemo<(number | "ellipsis")[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages]
    }
    if (page >= totalPages - 2) {
      return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages]
  }, [page, totalPages])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const res = await apiFetch(
        `/api/posts?slug=${encodeURIComponent(deleteTarget.slug)}`,
        {
          method: "DELETE",
        }
      )
      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== deleteTarget.slug))
        toast.success(t("admin.deleteSuccess") as string)
      } else {
        toast.error(t("admin.deleteFailed") as string)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleToggleDraft(slug: string, currentDraft: boolean) {
    try {
      const res = await apiFetch(
        `/api/posts?slug=${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: !currentDraft }),
        }
      )

      if (res.ok) {
        setPosts(
          posts.map((p) =>
            p.slug === slug ? { ...p, draft: !currentDraft } : p
          )
        )
        toast.success(
          currentDraft ? (t("admin.publishSuccess") as string) : (t("admin.unpublishSuccess") as string)
        )
      } else {
        toast.error(t("admin.updateFailed") as string)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.posts") as string}</h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.postsDesc") as string}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium px-2.5 hover:bg-primary/80 transition-all"
        >
          {t("admin.newPost") as string}
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
        <>
          {/* Search & Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status tabs */}
            <div className="inline-flex rounded-lg border p-0.5 bg-muted/30">
              {(["all", "published", "drafts"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    statusFilter === s
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all"
                    ? (t("admin.all") as string)
                    : s === "published"
                    ? (t("admin.published") as string)
                    : (t("admin.drafts") as string)}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder={t("admin.searchPosts") as string}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} / {posts.length} {t("admin.posts") as string}
              </p>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.title") as string}</TableHead>
                  <TableHead>{t("admin.status") as string}</TableHead>
                  <TableHead>{t("admin.date") as string}</TableHead>
                  <TableHead>{t("admin.tags") as string}</TableHead>
                  <TableHead className="text-right">{t("admin.actions") as string}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {t("admin.noMatchSearch") as string}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPosts.map((post) => (
                    <TableRow key={post.slug}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/posts/edit?slug=${encodeURIComponent(
                            post.slug
                          )}`}
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={post.draft ? "secondary" : "default"}
                          className={
                            post.draft
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }
                        >
                          {post.draft
                            ? (t("admin.draft") as string)
                            : (t("admin.publishedStatus") as string)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(post.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors">
                            <EllipsisVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/posts/edit?slug=${encodeURIComponent(
                                    post.slug
                                  )}`
                                )
                              }
                            >
                              {t("admin.edit") as string}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleDraft(post.slug, post.draft)
                              }
                            >
                              {post.draft ? (t("admin.publish") as string) : (t("admin.unpublish") as string)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/posts/${encodeURIComponent(post.slug)}`
                                )
                              }
                            >
                              {t("admin.view") as string}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(post)}
                            >
                              {t("admin.delete") as string}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} {t("admin.posts") as string} · {t("admin.page") as string} {page}/{totalPages}
              </p>
              <div className="flex items-center gap-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        size="default"
                        className="gap-1 pl-2.5"
                      >
                        <ChevronLeft className="size-4" />
                        <span>{t("admin.prev") as string}</span>
                      </PaginationLink>
                    </PaginationItem>
                    {paginationItems.map((item, index) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            isActive={page === item}
                            onClick={() => setPage(item)}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        size="default"
                        className="gap-1 pr-2.5"
                      >
                        <span>{t("admin.next") as string}</span>
                        <ChevronRight className="size-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.delete") as string}</DialogTitle>
            <DialogDescription>
              {t("admin.deleteConfirm") as string}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t("admin.cancel") as string}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (t("admin.deleting") as string) : (t("admin.delete") as string)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
