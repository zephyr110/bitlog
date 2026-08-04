"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { DEFAULT_SITE_LOGO, DEFAULT_SITE_LOGO_DARK, isBuiltInLogoSrc } from "@/lib/site-config"

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
 * Site mark. Dark mode for the BUILT-IN mark swaps to a white-glyph
 * variant file (crisp vector in every engine); custom uploaded logos
 * still use a CSS invert filter, since no dark variant exists for them.
 * Theme comes from next-themes `resolvedTheme` rather than `dark:`
 * variants so it also works for the filter fallback.
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

  const dark = invertInDark && mounted && resolvedTheme === "dark"
  // A stored logo URL can dangle (e.g. the file was deleted from the media
  // library, which removes it from the CDN but can't clear settings) —
  // fall back to the built-in mark instead of showing a broken image.
  const effectiveSrc = failedSrc === src ? DEFAULT_SITE_LOGO : src
  // In dark mode the built-in mark gets a white-glyph variant (crisp vector,
  // no CSS filter needed). If the dark variant itself fails, fall through to
  // the light mark + invert(1) filter instead of a dead recovery loop.
  const isBuiltIn = isBuiltInLogoSrc(effectiveSrc)
  const useDarkVariant = dark && isBuiltIn && failedSrc !== DEFAULT_SITE_LOGO_DARK
  const renderedSrc = useDarkVariant ? DEFAULT_SITE_LOGO_DARK : effectiveSrc

  function handleError() {
    setFailedSrc(renderedSrc)
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config
    <img
      src={renderedSrc}
      alt={alt}
      className={cn("object-contain", className)}
      style={dark && isBuiltIn && !useDarkVariant ? { filter: "invert(1)" } : undefined}
      onError={handleError}
    />
  )
}
