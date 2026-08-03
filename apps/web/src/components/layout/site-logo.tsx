"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { DEFAULT_SITE_LOGO } from "@/lib/site-config"

type SiteLogoProps = {
  src: string
  /**
   * Invert black↔white in dark mode (white circle, dark Z).
   * Defaults to true — the built-in mark and typical uploaded marks are
   * monochrome; pass false only for full-color custom logos.
   */
  invertInDark?: boolean
  className?: string
  alt?: string
}

/**
 * Site mark. Uses next-themes `resolvedTheme` + inline `filter` so inversion
 * does not depend on Tailwind `dark:` variants or `html.dark` CSS selectors.
 */
export function SiteLogo({
  src,
  invertInDark = true,
  className,
  alt = "",
}: SiteLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect -- theme is only known client-side
  }, [])

  const invert = invertInDark && mounted && resolvedTheme === "dark"
  // A stored logo URL can dangle (e.g. the file was deleted from the media
  // library, which removes it from the CDN but can't clear settings) —
  // fall back to the built-in mark instead of showing a broken image.
  const effectiveSrc = failedSrc === src ? DEFAULT_SITE_LOGO : src

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config
    <img
      src={effectiveSrc}
      alt={alt}
      className={cn("object-contain", className)}
      style={invert ? { filter: "invert(1)" } : undefined}
      onError={() => setFailedSrc(src)}
    />
  )
}
