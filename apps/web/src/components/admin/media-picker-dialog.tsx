"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/api-client"
import { useT } from "@/components/layout/trans"
import { ImageIcon, Upload } from "lucide-react"

interface MediaFile {
  name: string
  url: string
}

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const { t } = useT()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await apiFetch("/api/upload")
        if (res.ok && !cancelled) {
          const data = await res.json()
          setFiles(data.images || [])
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("admin.media") as string}</DialogTitle>
          <DialogDescription>
            {t("admin.mediaPickDesc") as string}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <Spinner className="py-16" />
        ) : files.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon
              size={40}
              className="mx-auto text-muted-foreground mb-3"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-sm mb-2">
              {t("admin.noImages") as string}
            </p>
            {/* Hard navigation on purpose: fires the editor's beforeunload
                unsaved-changes guard when navigating away with edits. */}
            <a
              href="/admin/media"
              onClick={() => onOpenChange(false)}
              className="text-primary text-sm hover:underline"
            >
              {t("admin.goToMedia") as string}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map((file) => (
              <Tooltip key={file.url}>
                <TooltipTrigger>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(file.url)
                      onOpenChange(false)
                    }}
                    className="group relative aspect-video w-full rounded-lg border overflow-hidden bg-muted hover:border-primary/40 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1 text-left">
                  <span className="block text-[11px] text-white truncate">
                    {file.name}
                  </span>
                </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{file.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.mediaPickHint") as string}
          </p>
          {/* Hard navigation on purpose: fires the editor's beforeunload
              unsaved-changes guard when navigating away with edits. */}
          <a
            href="/admin/media"
            onClick={() => onOpenChange(false)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <Upload size={14} />
            {t("admin.uploadImage") as string}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
