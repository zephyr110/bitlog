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
import { Input } from "@/components/ui/input"
import { useT } from "@/components/layout/trans"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ImageIcon, Upload, Copy, FileCode, Trash2, LayoutGrid, List, X, Search, TriangleAlert } from "lucide-react"
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

/** Simple async semaphore limiting concurrent uploads — GitHub pushes are
 *  IO-bound (10-60s each), so 3 in flight hides most of the latency while
 *  staying well within GitHub's API rate budget. */
function createSemaphore(max: number) {
  let current = 0
  const queue: Array<() => void> = []
  return {
    acquire(): Promise<void> {
      if (current < max) {
        current++
        return Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        queue.push(() => {
          current++
          resolve()
        })
      })
    },
    release(): void {
      current--
      queue.shift()?.()
    },
  }
}

const UPLOAD_CONCURRENCY = 3
/** Batch cap — a stray 200-file drop would otherwise lock the page for
 *  half an hour (30s × 67 slots). Generous for any realistic selection. */
const MAX_BATCH_SIZE = 30
const MAX_FILE_SIZE = 5 * 1024 * 1024

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
  // Batch progress — null while idle. total includes files rejected in the
  // pre-check so the counter matches what the user picked.
  const [uploadStats, setUploadStats] = useState<{
    total: number
    done: number
    failed: number
  } | null>(null)
  // Ref mirror of the same state — uploadFiles reads it so its identity
  // doesn't depend on uploadStats (which changes on every progress tick,
  // and would ripple through handleDrop's dependency array).
  const uploadingRef = useRef(false)
  const isUploading = uploadStats !== null
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
  const [searchInput, setSearchInput] = useState("")
  // Debounced query — the fetch below keys on this, so typing only hits
  // the API after a pause.
  const [searchQuery, setSearchQuery] = useState("")
  // API unreachable (static deployment, server error, network) — was
  // previously swallowed silently, leaving an empty library with no
  // explanation and a dead-feeling upload button. Boolean so the fetch
  // callback doesn't depend on `t` (whose identity changes every render
  // and would refetch on each keystroke).
  const [apiError, setApiError] = useState(false)
  // Stale-response guard: rapid page changes only let the newest fetch win.
  const fetchSeq = useRef(0)
  // Refetch indicator (page/filter changes) — distinct from `loading`,
  // which only covers the initial skeleton.
  const [refreshing, setRefreshing] = useState(false)

  // Debounce the search input, then reset to page 1 — the [page,
  // fetchMedia] effect refetches automatically. Page 1 is only forced
  // when the query actually changed, so a stale timer can't override a
  // page/pageSize/date change made within the debounce window.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== searchQuery) {
        setSearchQuery(next)
        setPage(1)
      }
    }, 400)
    return () => clearTimeout(id)
  }, [searchInput, searchQuery])

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
      if (searchQuery) params.set("q", searchQuery)
      const res = await apiFetch(`/api/upload?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (seq === fetchSeq.current) {
          setFiles(data.images || [])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 1)
          setApiError(false)
        }
      } else if (seq === fetchSeq.current) {
        setApiError(true)
      }
    } catch {
      if (seq === fetchSeq.current) {
        setApiError(true)
      }
    } finally {
      if (seq === fetchSeq.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [dateFrom, dateTo, pageSize, searchQuery])

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

  /** Batch upload — pre-checks every file, then runs the POSTs through a
   *  concurrency-capped worker pool. Failures are isolated per file; the
   *  summary toast at the end reports the overall result. */
  const uploadFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      if (!fileList || fileList.length === 0) return
      // One batch at a time — a drop landing mid-upload is ignored (the
      // disabled buttons/tile cover most paths; the drop zone is the rest).
      if (uploadingRef.current) return

      const files = Array.from(fileList)
      if (files.length > MAX_BATCH_SIZE) {
        toast.error(t("admin.uploadFailed") as string)
        files.length = MAX_BATCH_SIZE
      }

      // Pre-check: separate valid files from rejections so the progress
      // total reflects the whole selection from the start.
      const valid: File[] = []
      let preCheckFailed = 0
      for (const file of files) {
        if (!file.type.startsWith("image/") || file.size > MAX_FILE_SIZE) {
          preCheckFailed++
        } else {
          valid.push(file)
        }
      }
      if (valid.length === 0) {
        toast.error(t("admin.uploadFailed") as string)
        return
      }

      const total = valid.length + preCheckFailed
      // Mutable counters — the state updates they drive may not have been
      // flushed by the time Promise.all resolves, so the summary toast
      // reads the refs, not the state.
      const statsRef = { done: 0, failed: preCheckFailed }

      uploadingRef.current = true
      setUploadStats({ total, done: 0, failed: preCheckFailed })

      const sem = createSemaphore(UPLOAD_CONCURRENCY)
      const worker = async (file: File) => {
        await sem.acquire()
        try {
          const formData = new FormData()
          formData.append("file", file)
          const res = await apiFetch("/api/upload", {
            method: "POST",
            body: formData,
            // Uploads include compression + a GitHub push to a CN-direct
            // api.github.com — can take 10-60s. The default 15s would
            // abort mid-flight (server still finishes → "failed" upload
            // that exists).
            timeout: 120_000,
          })
          if (res.ok) {
            statsRef.done++
          } else {
            statsRef.failed++
          }
        } catch {
          statsRef.failed++
        } finally {
          setUploadStats({ total, done: statsRef.done, failed: statsRef.failed })
          sem.release()
        }
      }

      await Promise.all(valid.map(worker))

      // New uploads are newest-first → jump to page 1 to see them. A
      // no-op setPage(1) would never refire the effect (React bails out
      // on the same value), so fetch directly when already on page 1.
      if (page === 1) {
        await fetchMedia(1)
      } else {
        setPage(1)
      }

      const { done, failed } = statsRef
      if (failed === 0) {
        toast.success(
          (t("admin.uploadBatchSuccess") as (n: number) => string)(done)
        )
      } else if (done === 0) {
        toast.error(t("admin.uploadFailed") as string)
      } else {
        toast.error(
          (t("admin.uploadBatchPartial") as (
            ok: number,
            fail: number
          ) => string)(done, failed)
        )
      }

      uploadingRef.current = false
      setUploadStats(null)
      const input = document.getElementById("media-file-input") as HTMLInputElement
      if (input) input.value = ""
    },
    [t, page, fetchMedia]
  )

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    await uploadFiles(e.target.files)
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
      await uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles]
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
    // Capture the target so the finally below only closes THIS confirm:
    // if the user dismissed it and opened another delete confirm while
    // the request was in flight, a stale unconditional close would kill
    // the new dialog without deleting its file.
    const target = deleteTarget
    setDeleting(true)

    try {
      const res = await apiFetch(
        `/api/upload?filename=${encodeURIComponent(target.name)}`,
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
        if (previewFile?.name === target.name) {
          // Close the dialog first — its deferred scroll-lock restore runs
          // while the lightbox still holds body overflow:hidden — then drop
          // the lightbox a frame later. Closing both in the same tick makes
          // the lightbox's cleanup clear the lock first, and the dialog's
          // restore then re-applies the stale hidden, locking body scroll
          // until a reload.
          requestAnimationFrame(() => setPreviewFile(null))
        }
      } else {
        toast.error(t("admin.deleteImageFailed") as string)
      }
    } catch {
      toast.error(t("admin.networkError") as string)
    } finally {
      setDeleting(false)
      setDeleteTarget((cur) => (cur === target ? null : cur))
    }
  }

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <HeaderActions>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
          id="media-file-input"
        />
        {/* Filename search — debounced, resets to page 1 on query */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin.searchMedia") as string}
            className="h-8 w-44 pl-8 text-xs"
          />
        </div>
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
          disabled={isUploading}
          onClick={() => document.getElementById("media-file-input")?.click()}
        >
          {isUploading && uploadStats
            ? (t("admin.uploadProgress") as (
                done: number,
                total: number
              ) => string)(uploadStats.done, uploadStats.total)
            : (t("admin.uploadImage") as string)}
        </Button>
      </HeaderActions>

      {/* API failure banner — a failed list fetch used to be swallowed
          into a silently empty library; the banner surfaces it (with a
          dismiss, since a later refetch clears it anyway). */}
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{t("admin.mediaApiError") as string}</span>
          <button
            type="button"
            aria-label={t("admin.dismiss") as string}
            onClick={() => setApiError(false)}
            className="rounded-md p-0.5 text-destructive/70 transition-colors hover:text-destructive"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drop zone — only when the library is genuinely empty; a filter
          with zero matches gets the no-results card below instead.
          Suppressed while apiError shows: inviting an upload against a
          dead API is contradictory. */}
      {files.length === 0 && !loading && !apiError && !searchQuery && !dateFrom && !dateTo && (
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

      <div className="relative min-h-0 flex-1 overflow-y-auto">
      {loading ? (
        // Skeletons mirror the real card/row layout so the page doesn't
        // jump when the data lands.
        viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-4 gap-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex aspect-[4/3] flex-col overflow-hidden rounded-xl border bg-card"
              >
                <Skeleton className="min-h-0 flex-1 rounded-none" />
                <div className="shrink-0 space-y-1 border-t p-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
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
              {searchQuery || dateFrom || dateTo
                ? (t("admin.noMatchMedia") as string)
                : (t("admin.noImages") as string)}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || dateFrom || dateTo
                ? (t("admin.noMatchMediaDesc") as string)
                : (t("admin.noImagesDesc") as string)}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        // Whole tile is 4:3 (flat) — image + meta share the box so upload
        // and media cards stay the same size. auto-fill ~200px min.
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-4 gap-y-5">
          {/* Upload tile — same 4:3 footprint as media cards */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => document.getElementById("media-file-input")?.click()}
            className="group flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground disabled:opacity-60 cursor-pointer"
          >
            <Upload
              size={22}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xs font-medium">
              {t("admin.uploadImage") as string}
            </span>
          </button>
          {files.map((file) => (
            <Card
              key={file.url}
              size="sm"
              className="group aspect-[4/3] gap-0 py-0 hover:ring-foreground/20 transition-colors"
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
                className="relative min-h-0 flex-1 cursor-zoom-in bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name || (t("admin.uploadedImageAlt") as string)}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                <button
                  type="button"
                  aria-label={t("admin.deleteImage") as string}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(file)
                  }}
                  className="absolute top-2 right-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <CardContent className="shrink-0 space-y-1 border-t p-2">
                <Tooltip>
                  <TooltipTrigger
                    render={<p className="truncate text-xs font-medium">{file.name}</p>}
                  />
                  <TooltipContent>{file.name}</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-1">
                  <p
                    className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground"
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List view — compact rows with small thumbnails. h-14 matches
        // py-2 + size-10 thumb so the upload row is equal width & height.
        <div className="flex flex-col gap-1.5">
          {/* Upload row — first position, same footprint as media rows */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => document.getElementById("media-file-input")?.click()}
            className="flex h-14 w-full items-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-card px-3 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground disabled:opacity-60 cursor-pointer"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/30">
              <Upload size={15} />
            </span>
            <span className="text-sm font-medium">
              {t("admin.uploadImage") as string}
            </span>
          </button>
          {files.map((file) => (
            <div
              key={file.url}
              className="group flex h-14 w-full items-center gap-3 rounded-lg border bg-card px-3 transition-colors hover:border-primary/20"
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
        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-background/40">
          <Spinner size="md" fill />
        </div>
      )}
      </div>

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
    </div>

      {/* Outside the gap flex column so overlays cannot steal spacing */}
      <MediaLightbox
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onCopyUrl={copyToClipboard}
        onCopyMarkdown={copyMarkdown}
        onDelete={setDeleteTarget}
      />
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
    </>
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
