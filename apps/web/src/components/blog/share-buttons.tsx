"use client"

import { Share2, Link } from "lucide-react"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export function ShareButton({
  url,
  title,
}: {
  url: string
  title: string
}) {
  const { t } = useT()

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          aria-label={t("post.shareOnX") as string}
          onClick={() => {
            const fullUrl = window.location.origin + url
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
            window.open(shareUrl, "_blank", "noopener,noreferrer")
          }}
          className="inline-flex items-center justify-center size-8 rounded-md border hover:bg-muted transition-colors"
        >
          <Share2 size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("post.shareOnX") as string}</TooltipContent>
    </Tooltip>
  )
}

export function CopyLinkButton({ url }: { url: string }) {
  const { t } = useT()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + url)
      toast.success(t("post.linkCopied") as string)
    } catch {
      toast.error(t("post.copyFailed") as string)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          aria-label={t("post.copyLink") as string}
          onClick={handleCopy}
          className="inline-flex items-center justify-center size-8 rounded-md border hover:bg-muted transition-colors"
        >
          <Link size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("post.copyLink") as string}</TooltipContent>
    </Tooltip>
  )
}
