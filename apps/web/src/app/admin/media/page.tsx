"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api-client"
import { HeaderActions } from "@/components/admin/header-actions"
import { PaginationBar } from "@/components/admin/pagination-bar"
import { MediaLightbox } from "@/components/admin/media-lightbox"
import { useT } from "@/components/layout/trans"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ImageIcon, Upload, Copy, FileCode, Trash2, LayoutGrid, List, X } from "lucide-react"
import { useLocale } from "@/components/layout/i18n-provider"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { IconButton } from "@/components/ui/icon-button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatUtcDateTime } from "@/lib/date"

interface MediaFile {
  name: string
  url: string
  /** SQLite datetime("now") — UTC "YYYY-MM-DD HH:MM:SS" */
  createdAt?: string
}

/** Local "YYYY-MM-DD" → exact UTC timestamp at the day boundary
 *  ("YYYY-MM-DD HH:MM:SS", matching created_at's format). Converting the
 *  local window start/end to UTC keeps the filter exact in any timezone. */
function toUtcTimestamp(
  localDay: string,
  endOfDay: boolean
): string | undefined {
  if (!localDay) return undefined
  const d = new Date(endOfDay ? `${localDay}T23:59:59` : `${localDay}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().replace("T", " ").slice(0, 19)
}

type ViewMode = "grid" | "list"

export default function AdminMediaPage() {
  const { t } = useT()
  const { locale } = useLocale()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [pageSize, setPageSize] = useState(20)
  // Stale-response guard: rapid page changes only let the newest fetch win.
  const fetchSeq = useRef(0)
  // Refetch indicator (page/filter changes) — distinct from `loading`,
  // which only covers the initial skeleton.
  const [refreshing, setRefreshing] = useState(false)

  const fetchMedia = useCallback(async (targetPage: number) => {
    const seq = ++fetchSeq.current
    setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      })
      const from = toUtcTimestamp(dateFrom, false)
      const to = toUtcTimestamp(dateTo, true)
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const res = await apiFetch(`/api/upload?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (seq === fetchSeq.current) {
          setFiles(data.images || [])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 1)
        }
      }
    } catch {
      // silent
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [dateFrom, dateTo, pageSize])

  useEffect(() => {
    fetchMedia(page) // eslint-disable-line react-hooks/set-state-in-effect
  }, [page, fetchMedia])

  // Filter/page-size changes reset to page 1 — the [page, fetchMedia]
  // effect above refetches on its own (fetchMedia's identity changes with
  // the filter values), so no manual fetch is needed here.
  function updateDateRange(range: { from: string; to: string }) {
    setDateFrom(range.from)
    setDateTo(range.to)
    setPage(1)
  }

  function clearDateFilter() {
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  function changePageSize(next: number) {
    setPageSize(next)
    setPage(1)
  }

  // Restore the user's last view once mounted (localStorage is client-only;
  // SSR always renders the grid so there is no hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem("media-view")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of the saved view on mount
    if (saved === "grid" || saved === "list") setViewMode(saved)
  }, [])

  function switchView(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem("media-view", mode)
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("admin.uploadFailed") as string)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("admin.fileTooLarge") as string)
      return
    }
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
        // Uploads include compression + a GitHub push to a CN-direct
        // api.github.com — can take 10-60s. The default 15s would abort
        // mid-flight (server still finishes → "failed" upload that exists).
        timeout: 120_000,
      })

      if (res.ok) {
        // New uploads are newest-first → jump back to page 1 to see them.
        // If we're already on page 1 the effect won't refire, so fetch here.
        if (page === 1) {
          await fetchMedia(1)
        } else {
          setPage(1)
        }
        toast.success(t("admin.uploadSuccess") as string)
      } else {
        const err = await res.json()
        toast.error(err.error || (t("admin.uploadFailed") as string))
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setUploading(false)
      const input = document.getElementById("media-file-input") as HTMLInputElement
      if (input) input.value = ""
    }
  }, [t, page, fetchMedia])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file) await uploadFile(file)
    },
    [uploadFile]
  )

  // Backend now returns absolute jsdelivr URLs — only prepend the site
  // origin for legacy relative paths.
  function fullUrl(url: string) {
    return url.startsWith("http") ? url : `${window.location.origin}${url}`
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(fullUrl(url)).then(() => {
      toast.success(t("admin.urlCopied") as string)
    })
  }

  function copyMarkdown(url: string) {
    navigator.clipboard
      .writeText(`![alt text](${fullUrl(url)})`)
      .then(() => {
        toast.success(t("admin.markdownCopied") as string)
      })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const res = await apiFetch(
        `/api/upload?filename=${encodeURIComponent(deleteTarget.name)}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        // Refetch the page: the row is gone (so totals shift). If this was
        // the last item on a page > 1, step back a page instead.
        if (files.length === 1 && page > 1) {
          setPage(page - 1)
        } else {
          await fetchMedia(page)
        }
        toast.success(t("admin.imageDeleted") as string)
        if (previewFile?.name === deleteTarget.name) setPreviewFile(null)
      } else {
        toast.error(t("admin.deleteImageFailed") as string)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <HeaderActions>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
          id="media-file-input"
        />
        {/* Date range filter — one trigger opens a two-month range
            calendar; local dates, converted to exact UTC timestamps on
            the wire */}
        <div className="flex items-center gap-1.5">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={updateDateRange}
            ariaLabel={t("admin.dateRange") as string}
            placeholder={t("admin.dateRange") as string}
            locale={locale === "zh" ? "zh" : "en"}
          />
          {(dateFrom || dateTo) && (
            <IconButton
              size="sm"
              aria-label={t("admin.clearFilter") as string}
              onClick={clearDateFilter}
            >
              <X size={14} />
            </IconButton>
          )}
        </div>
        {/* Segmented view toggle — fixed h-8 to match the date picker and
            upload button; inner buttons fill the container's inner height
            (32px − border − p-0.5 ≈ 26px). */}
        <div
          role="group"
          aria-label={t("admin.viewMode") as string}
          className="flex h-8 items-center rounded-lg border border-border bg-background p-0.5"
        >
          <IconButton
            size="sm"
            aria-label={t("admin.gridView") as string}
            aria-pressed={viewMode === "grid"}
            className={cn("h-full w-7", viewMode === "grid" && "bg-muted text-foreground")}
            onClick={() => switchView("grid")}
          >
            <LayoutGrid size={14} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label={t("admin.listView") as string}
            aria-pressed={viewMode === "list"}
            className={cn("h-full w-7", viewMode === "list" && "bg-muted text-foreground")}
            onClick={() => switchView("list")}
          >
            <List size={14} />
          </IconButton>
        </div>
        <Button
          disabled={uploading}
          onClick={() => document.getElementById("media-file-input")?.click()}
        >
          {uploading
            ? (t("admin.uploading") as string)
            : (t("admin.uploadImage") as string)}
        </Button>
      </HeaderActions>

      {/* Drop zone */}
      {files.length === 0 && !loading && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("media-file-input")?.click()}
          className={cn(
            "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <Upload
            size={40}
            className="mx-auto text-muted-foreground mb-4"
          />
          <p className="font-medium">{t("admin.uploadImage") as string}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.dragDropToUpload") as string}
          </p>
        </div>
      )}

      <div className="relative">
      {loading ? (
        // Skeletons mirror the real card/row layout so the page doesn't
        // jump when the data lands.
        viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border bg-card">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-2 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-7 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden sm:block h-3.5 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
        )
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="mb-4">
              <ImageIcon size={48} className="mx-auto text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("admin.noImages") as string}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("admin.noImagesDesc") as string}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        // auto-fill: column count adapts to any viewport width. 200px min
        // keeps tiles in the 200–230px sweet spot for scanning thumbnails
        // (≈ Google Drive tile width); 4:3 image area at 4/3 of the tile.
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {files.map((file) => (
            <Card
              key={file.url}
              className="overflow-hidden group hover:border-primary/20 transition-colors"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={t("admin.viewFullImage") as string}
                onClick={() => setPreviewFile(file)}
                onKeyDown={(e) => {
                  // Ignore keydowns from nested interactive elements
                  // (e.g. the delete button) so they don't also open preview.
                  if (e.target !== e.currentTarget) return
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setPreviewFile(file)
                  }
                }}
                className="block w-full aspect-[4/3] bg-muted relative cursor-zoom-in"
              >
                {/* absolute positioning: a percentage-height img would
                    defeat the container's aspect-ratio (h-full on an img
                    whose parent height comes from aspect-ratio resolves to
                    auto → the img's intrinsic ratio wins) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name || (t("admin.uploadedImageAlt") as string)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {/* Delete button on hover */}
                <button
                  type="button"
                  aria-label={t("admin.deleteImage") as string}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(file)
                  }}
                  className="absolute top-2 right-2 inline-flex items-center justify-center size-8 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <CardContent className="p-2 space-y-1.5">
                <Tooltip>
                  <TooltipTrigger
                    render={<p className="text-xs font-medium truncate">{file.name}</p>}
                  />
                  <TooltipContent>{file.name}</TooltipContent>
                </Tooltip>
                <p
                  className="text-[11px] text-muted-foreground"
                  title={file.createdAt}
                >
                  {file.createdAt ? formatUtcDateTime(file.createdAt) : " "}
                </p>
                <MediaRowActions
                  file={file}
                  onCopyUrl={copyToClipboard}
                  onCopyMarkdown={copyMarkdown}
                  onDelete={setDeleteTarget}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List view — compact rows with small thumbnails
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.url}
              className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-primary/20"
            >
              <button
                type="button"
                aria-label={t("admin.viewFullImage") as string}
                onClick={() => setPreviewFile(file)}
                className="shrink-0 cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name || (t("admin.uploadedImageAlt") as string)}
                  className="size-10 rounded-md object-cover bg-muted"
                  loading="lazy"
                />
              </button>
              <button
                type="button"
                onClick={() => setPreviewFile(file)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium cursor-pointer hover:underline"
              >
                {file.name}
              </button>
              <span
                className="hidden sm:block w-24 shrink-0 text-xs text-muted-foreground text-right"
                title={file.createdAt}
              >
                {file.createdAt ? formatUtcDateTime(file.createdAt) : ""}
              </span>
              <MediaRowActions
                file={file}
                onCopyUrl={copyToClipboard}
                onCopyMarkdown={copyMarkdown}
                onDelete={setDeleteTarget}
              />
            </div>
          ))}
        </div>
      )}

      {/* Refetch indicator — page/filter changes keep the list mounted,
          just dim it while the new page loads (initial load uses the
          skeletons above). */}
      {refreshing && !loading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40">
          <Spinner />
        </div>
      )}
      </div>

      {/* Clearance so the sticky bar never covers the last row when the
          page is scrolled to the bottom. */}
      <div aria-hidden="true" className="h-10" />

      {/* Pagination — PaginationBar carries its own sticky bottom styling,
          shared with the posts list. */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        itemLabel={t("admin.images") as string}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={changePageSize}
      />

      {/* Full image preview — custom lightbox (not Dialog: no width caps,
          single close button, long-edge sizing, download action) */}
      <MediaLightbox
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onCopyUrl={copyToClipboard}
        onCopyMarkdown={copyMarkdown}
        onDelete={setDeleteTarget}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deleteImage") as string}</DialogTitle>
            <DialogDescription>
              {t("admin.deleteImageConfirm") as string}
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
              {deleting
                ? (t("admin.deletingImage") as string)
                : (t("admin.deleteImage") as string)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Compact icon action row (copy URL / copy MD / delete), shared by the
 *  grid cards and the list rows. */
function MediaRowActions({
  file,
  onCopyUrl,
  onCopyMarkdown,
  onDelete,
}: {
  file: MediaFile
  onCopyUrl: (url: string) => void
  onCopyMarkdown: (url: string) => void
  onDelete: (file: MediaFile) => void
}) {
  const { t } = useT()
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Tooltip>
        <TooltipTrigger
          render={
            <IconButton
              size="sm"
              aria-label={t("admin.copyURL") as string}
              onClick={() => onCopyUrl(file.url)}
            >
              <Copy size={14} />
            </IconButton>
          }
        />
        <TooltipContent>{t("admin.copyURL") as string}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <IconButton
              size="sm"
              aria-label={t("admin.copyMD") as string}
              onClick={() => onCopyMarkdown(file.url)}
            >
              <FileCode size={14} />
            </IconButton>
          }
        />
        <TooltipContent>{t("admin.copyMD") as string}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <IconButton
              size="sm"
              aria-label={t("admin.deleteImage") as string}
              className="ml-auto hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(file)}
            >
              <Trash2 size={14} />
            </IconButton>
          }
        />
        <TooltipContent>{t("admin.deleteImage") as string}</TooltipContent>
      </Tooltip>
    </div>
  )
}
