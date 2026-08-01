"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
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
import { MediaLightbox } from "@/components/admin/media-lightbox"
import { useT } from "@/components/layout/trans"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ImageIcon, Upload, Copy, FileCode, Trash2, LayoutGrid, List } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

interface MediaFile {
  name: string
  url: string
}

type ViewMode = "grid" | "list"

export default function AdminMediaPage() {
  const { t } = useT()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchMedia() {
    try {
      const res = await apiFetch("/api/upload")
      if (res.ok) {
        const data = await res.json()
        setFiles(data.images || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia() // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

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
        const data = await res.json()
        setFiles((prev) => [
          { name: data.filename || file.name, url: data.url },
          ...prev,
        ])
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
  }, [t])

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
        setFiles((prev) => prev.filter((f) => f.name !== deleteTarget.name))
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
    <div className="space-y-6">
      <HeaderActions>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
          id="media-file-input"
        />
        <div
          role="group"
          aria-label={t("admin.viewMode") as string}
          className="flex items-center rounded-lg border border-border bg-background p-0.5"
        >
          <IconButton
            size="sm"
            aria-label={t("admin.gridView") as string}
            aria-pressed={viewMode === "grid"}
            className={viewMode === "grid" ? "bg-muted text-foreground" : undefined}
            onClick={() => switchView("grid")}
          >
            <LayoutGrid size={14} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label={t("admin.listView") as string}
            aria-pressed={viewMode === "list"}
            className={viewMode === "list" ? "bg-muted text-foreground" : undefined}
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

      {loading ? (
        // Vertically centered within the media area (min-h keeps the
        // layout stable while the library loads).
        <div className="flex min-h-72 items-center justify-center">
          <Spinner />
        </div>
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
        // auto-fill: column count adapts to any viewport width; 4:3 tiles
        // keep the card height of the old 1:1 tiles (187 = 140 × 4/3)
        <div className="grid grid-cols-[repeat(auto-fill,minmax(187px,1fr))] gap-2.5">
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
                  <TooltipTrigger>
                    <p className="text-xs font-medium truncate">{file.name}</p>
                  </TooltipTrigger>
                  <TooltipContent>{file.name}</TooltipContent>
                </Tooltip>
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
