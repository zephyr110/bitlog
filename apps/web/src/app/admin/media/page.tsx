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
import { useT } from "@/components/layout/trans"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ImageIcon, Upload, Copy, FileCode, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaFile {
  name: string
  url: string
}

export default function AdminMediaPage() {
  const { t } = useT()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
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
      setCopied(url)
      toast.success(t("admin.urlCopied") as string)
      setTimeout(() => setCopied(null), 2000)
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
        <Spinner className="py-20" />
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="block w-full aspect-video bg-muted relative cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name || (t("admin.uploadedImageAlt") as string)}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
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
              <CardContent className="p-3 space-y-2">
                <Tooltip>
                  <TooltipTrigger>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                  </TooltipTrigger>
                  <TooltipContent>{file.name}</TooltipContent>
                </Tooltip>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => copyToClipboard(file.url)}
                  >
                    <Copy size={12} />
                    {copied === file.url
                      ? (t("admin.copied") as string)
                      : (t("admin.copyURL") as string)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => copyMarkdown(file.url)}
                  >
                    <FileCode size={12} />
                    {t("admin.copyMD") as string}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1 ml-auto text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(file)}
                  >
                    <Trash2 size={12} />
                    {t("admin.deleteImage") as string}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full image preview */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewFile?.url}
              alt={previewFile?.name || ""}
              className="w-full max-h-[70vh] object-contain bg-muted"
            />
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-3 right-3 inline-flex items-center justify-center size-8 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-t">
            <p className="text-sm font-medium truncate">{previewFile?.name}</p>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewFile && copyToClipboard(previewFile.url)}
              >
                <Copy size={12} className="mr-1" />
                {t("admin.copyURL") as string}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => previewFile && setDeleteTarget(previewFile)}
              >
                <Trash2 size={12} className="mr-1" />
                {t("admin.deleteImage") as string}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
