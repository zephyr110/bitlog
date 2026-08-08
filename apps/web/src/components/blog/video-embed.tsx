"use client"

import {
  type VideoEmbed as VideoEmbedDesc,
  videoEmbedSrc,
} from "@/lib/video-embed"

type VideoEmbedProps = VideoEmbedDesc & {
  title?: string
}

export function VideoEmbed({ provider, id, title }: VideoEmbedProps) {
  const src = videoEmbedSrc({ provider, id })
  const label =
    title?.trim() ||
    (provider === "bilibili" ? "Bilibili video" : "YouTube video")

  return (
    <div className="my-6 w-full overflow-hidden rounded-xl border border-border/60 shadow-lg">
      <div className="relative aspect-video w-full bg-muted">
        <iframe
          src={src}
          title={label}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
