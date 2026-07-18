"use client"

import { Share2, Link } from "lucide-react"
import { toast } from "sonner"

export function ShareButton({
  url,
  title,
}: {
  url: string
  title: string
}) {
  return (
    <button
      onClick={() => {
        const fullUrl = window.location.origin + url
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
        window.open(shareUrl, "_blank", "noopener,noreferrer")
      }}
      className="inline-flex items-center justify-center size-8 rounded-md border hover:bg-muted transition-colors"
      title="Share on X"
    >
      <Share2 size={14} />
    </button>
  )
}

export function CopyLinkButton({ url }: { url: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + url)
      toast.success("Link copied!")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center size-8 rounded-md border hover:bg-muted transition-colors"
      title="Copy link"
    >
      <Link size={14} />
    </button>
  )
}
