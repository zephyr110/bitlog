"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, Trash2, Check } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListSkeleton } from "@/components/ui/loading"
import { EmptyState } from "@/components/ui/empty-state"
import { PaginationBar } from "@/components/admin/pagination-bar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AdminComment = {
  id: number
  postSlug: string
  authorName: string
  authorEmail: string
  content: string
  createdAt: string
  isRead: boolean
}

type CommentPage = {
  items: AdminComment[]
  total: number
  page: number
  pageSize: number
  unreadCount: number
}

/** Comment inbox — new comments land here (unread-first) with the
 *  sidebar badge; spam gets deleted, legit comments marked read. */
export default function AdminCommentsPage() {
  const { t } = useT()
  const [comments, setComments] = useState<AdminComment[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(
        `/api/admin/comments?page=${page}&pageSize=${pageSize}`
      )
      if (!res.ok) return
      const data = (await res.json()) as CommentPage
      setComments(data.items)
      setTotal(data.total)
      setUnreadCount(data.unreadCount)
      setTotalPages(Math.max(1, Math.ceil(data.total / data.pageSize)))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void load() // eslint-disable-line react-hooks/set-state-in-effect -- async fetch, same pattern as admin/media
  }, [load])

  /** True only when the server actually applied the change — the delete
   *  route answers 200 with {ok:false} for a missing id, so res.ok alone
   *  is not enough. */
  async function applied(res: Response): Promise<boolean> {
    if (!res.ok) return false
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
    return data?.ok !== false
  }

  async function markRead(id: number) {
    setBusyId(id)
    try {
      const res = await apiFetch(`/api/admin/comments/${id}/read`, {
        method: "POST",
      })
      if (!(await applied(res))) {
        toast.error(t("admin.loadFailed") as string)
        return
      }
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isRead: true } : c))
      )
      setUnreadCount((n) => Math.max(0, n - 1))
    } catch {
      toast.error(t("admin.loadFailed") as string)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: number) {
    if (!window.confirm(t("admin.commentDeleteConfirm") as string)) return
    setBusyId(id)
    try {
      const res = await apiFetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      })
      if (!(await applied(res))) {
        toast.error(t("admin.loadFailed") as string)
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== id))
      setTotal((n) => Math.max(0, n - 1))
      // Re-clamp the page if the last item on the last page was deleted.
      if (comments.length === 1 && page > 1) setPage(page - 1)
      else void load()
    } catch {
      toast.error(t("admin.loadFailed") as string)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("admin.commentsPage") as string}
        </h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            {(t("admin.unreadComments") as string)} · {unreadCount}
          </span>
        )}
      </div>

      {loading ? (
        <ListSkeleton items={3} />
      ) : comments.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState
            icon={<MessageSquare size={32} className="text-muted-foreground" />}
            title={t("admin.commentsEmpty") as string}
          />
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3">
            {comments.map((comment) => (
              <Card
                key={comment.id}
                className={cn(
                  "transition-colors",
                  !comment.isRead && "border-primary/30 bg-primary/[0.03]"
                )}
              >
                <CardContent className="py-4">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-semibold">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    <Link
                      href={`/posts/${encodeURIComponent(comment.postSlug)}`}
                      className="text-xs text-primary hover:underline truncate"
                    >
                      {comment.postSlug}
                    </Link>
                    {comment.authorEmail && (
                      <span className="text-xs text-muted-foreground/70">
                        {comment.authorEmail}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {!comment.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void markRead(comment.id)}
                        disabled={busyId === comment.id}
                      >
                        <Check size={14} className="mr-1.5" />
                        {t("admin.markRead") as string}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void remove(comment.id)}
                      disabled={busyId === comment.id}
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      {t("admin.delete") as string}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel={t("admin.comments") as string}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  )
}
