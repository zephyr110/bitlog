"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import { ImageIcon, Upload, Copy, FileCode } from "lucide-react"
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

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(`${window.location.origin}${url}`).then(() => {
      setCopied(url)
      toast.success(t("admin.urlCopied") as string)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function copyMarkdown(url: string) {
    navigator.clipboard
      .writeText(`![alt text](${window.location.origin}${url})`)
      .then(() => {
        toast.success(t("admin.markdownCopied") as string)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.media") as string}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.mediaDesc") as string}
          </p>
        </div>
        <div>
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
        </div>
      </div>

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
            Drag & drop or click to upload
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
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name || "Uploaded image"}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <CardContent className="p-3 space-y-2">
                <p
                  className="text-sm font-medium truncate"
                  title={file.name}
                >
                  {file.name}
                </p>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
