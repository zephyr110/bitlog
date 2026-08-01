"use client"

import { Share2, Link } from "lucide-react"
import { useT } from "@/components/layout/trans"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/icon-button"

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
        <IconButton
          size="sm"
          bordered
          aria-label={t("post.shareOnX") as string}
          onClick={() => {
            const fullUrl = window.location.origin + url
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
            window.open(shareUrl, "_blank", "noopener,noreferrer")
          }}
        >
          <Share2 size={14} />
        </IconButton>
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
        <IconButton
          size="sm"
          bordered
          aria-label={t("post.copyLink") as string}
          onClick={handleCopy}
        >
          <Link size={14} />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>{t("post.copyLink") as string}</TooltipContent>
    </Tooltip>
  )
}
