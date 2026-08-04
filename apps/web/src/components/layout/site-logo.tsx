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
  /**
   * Render the mark inside an opaque tile (muted background + hairline
   * ring) that stands off any page background. The mark fills the tile
   * edge-to-edge and the tile's rounded clip rounds it in both themes —
   * an opaque square PNG gets rounded corners, and a rounded/transparent
   * PNG shows the muted tile behind its corners instead of bleeding the
   * page background through (e.g. black corner triangles on a dark
   * footer). `className` sizes the tile.
   */
  chip?: boolean
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
  chip = false,
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
  // Custom uploaded logos (logoInvertInDark) get invert(1) too — a
  // transparent PNG with dark glyphs would otherwise vanish on the dark
  // tile. The filter is safe there: every logo surface (chip tile, preview,
  // login card) has an opaque backdrop, so the filter's rasterized edge
  // artifacts land on the tile, not on the page background.
  const isBuiltIn = isBuiltInLogoSrc(effectiveSrc)
  const useDarkVariant = dark && isBuiltIn && failedSrc !== DEFAULT_SITE_LOGO_DARK
  const renderedSrc = useDarkVariant ? DEFAULT_SITE_LOGO_DARK : effectiveSrc

  function handleError() {
    setFailedSrc(renderedSrc)
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config
    <img
      src={renderedSrc}
      alt={alt}
      className={cn("object-contain", className)}
      style={dark && !useDarkVariant ? { filter: "invert(1)" } : undefined}
      onError={handleError}
    />
  )

  if (!chip) return img

  // The tile IS the logo display — the mark fills it edge-to-edge
  // (object-cover) and the tile's own clip rounds it. No padding and no
  // extra mark radius: a padded tile leaves gaps around small uploaded
  // images and can't round their corners anyway (they sit inside the
  // padding, past the tile's clip curve). Transparent mark corners show
  // the muted tile behind them — never the page background (the
  // black-triangle fix).
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border/60 dark:ring-white/15",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config */}
      <img
        src={renderedSrc}
        alt={alt}
        className="size-full object-cover"
        style={dark && !useDarkVariant ? { filter: "invert(1)" } : undefined}
        onError={handleError}
      />
    </div>
  )
}
