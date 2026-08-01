"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { EllipsisVertical, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/ui/loading"
import { HeaderActions } from "@/components/admin/header-actions"
import { PaginationBar } from "@/components/admin/pagination-bar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { type PostSummary } from "@bitlog/database"

function AdminPostsContent() {
  const { t } = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams?.get("status")
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "drafts">(
    initialStatus === "published" || initialStatus === "drafts" ? initialStatus : "all"
  )
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  const allTags = useMemo(
    () => [...new Set(posts.flatMap((p) => p.tags))].sort(),
    [posts]
  )

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

  // Sync filter when arriving via ?status= query (same-route navigation
  // does not remount the component, so the initial state would be stale).
  // Adjusting state during render is the React-recommended alternative
  // to setState-in-effect for prop-driven state resets.
  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus)
  if (prevInitialStatus !== initialStatus) {
    setPrevInitialStatus(initialStatus)
    if (initialStatus === "published" || initialStatus === "drafts") {
      setStatusFilter(initialStatus)
      setPage(1)
    }
  }

  const filteredPosts = useMemo(() => {
    let result = posts
    if (statusFilter === "published") result = result.filter((p) => !p.draft)
    if (statusFilter === "drafts") result = result.filter((p) => p.draft)
    if (tagFilter !== "all") {
      result = result.filter((p) =>
        p.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase())
      )
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(query))
    }
    return result
  }, [posts, searchQuery, statusFilter, tagFilter])

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredPosts.slice(start, start + pageSize)
  }, [filteredPosts, page, pageSize])

  const totalPages = Math.ceil(filteredPosts.length / pageSize)

  // Keep the page in bounds when the list shrinks — deleting a post,
  // toggling its draft (moves it out of the filtered view), or narrowing
  // a filter can leave page > totalPages, which renders an empty table
  // with a bogus "Page N/M" summary. Adjusting state during render is the
  // React-recommended alternative to setState-in-effect for derived resets.
  const [prevTotalPages, setPrevTotalPages] = useState(totalPages)
  if (prevTotalPages !== totalPages) {
    setPrevTotalPages(totalPages)
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }

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
        <TableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <HeaderActions>
        <Link
          href="/admin/posts/new"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium px-2.5 hover:bg-primary/80 transition-all"
        >
          {t("admin.newPost") as string}
        </Link>
      </HeaderActions>

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
                  onClick={() => {
                    setStatusFilter(s)
                    setPage(1)
                    // Keep the URL in sync so back/forward doesn't
                    // silently override the user's filter choice.
                    router.replace(
                      s === "all"
                        ? "/admin/posts"
                        : `/admin/posts?status=${s}`
                    )
                  }}
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

            {/* Tag filter */}
            <Select
              value={tagFilter}
              onValueChange={(v) => { setTagFilter(v || "all"); setPage(1) }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("admin.allTags") as string} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allTags") as string}</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
            {(searchQuery || tagFilter !== "all") && (
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} / {posts.length} {t("admin.posts") as string}
              </p>
            )}
          </div>

          {/* Table — body scrolls vertically, header stays pinned (the
              Table container owns the scroll, so the sticky thead works). */}
          <div className="border rounded-lg bg-card">
            <Table containerClassName="max-h-[calc(100vh-20rem)] overflow-y-auto">
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
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

          {/* Clearance so the sticky bar never covers the last row when
              the page is scrolled to the bottom. */}
          <div aria-hidden="true" className="h-10" />

          {/* Pagination — shared with the media library */}
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={filteredPosts.length}
            itemLabel={t("admin.posts") as string}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
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

export default function AdminPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <TableSkeleton rows={5} />
        </div>
      }
    >
      <AdminPostsContent />
    </Suspense>
  )
}
