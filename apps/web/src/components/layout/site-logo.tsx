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
  /**
   * Non-chip mode: sizes/styles the mark itself (object-contain base).
   * Chip mode: sizes the tile — the mark fills it edge-to-edge, so pass
   * a square size (e.g. size-9); without one the tile has no intrinsic
   * size and collapses.
   */
  className?: string
  alt?: string
  /**
   * Render the mark inside an opaque tile (muted background + hairline
   * ring) that stands off any page background. The mark fills the tile
   * edge-to-edge and carries its own rounded-lg, so it reads as rounded
   * in both themes — an opaque square PNG gets rounded corners, and a
   * rounded/transparent PNG shows the muted tile behind its corners
   * instead of bleeding the page background through (e.g. black corner
   * triangles on a dark footer).
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
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect -- theme is only known client-side
  }, [])

  const dark = invertInDark && mounted && resolvedTheme === "dark"

  // A stored logo URL can dangle (e.g. the file was deleted from the media
  // library, which removes it from the CDN but can't clear settings) —
  // fall back to the built-in mark instead of showing a broken image.
  // A URL that ever failed is never retried (a failed-set, not a latch):
  // the old code flip-flopped src → fallback → src once the fallback also
  // failed, re-firing img onError on every render; and a latch that pins
  // the fallback for good would ignore a NEW src after one built-in hiccup
  // (e.g. an admin re-uploading a logo). The machine always settles:
  // renderedSrc only changes when an error adds a URL to the set.
  const effectiveSrc = failed.has(src) ? DEFAULT_SITE_LOGO : src
  // In dark mode the built-in mark gets a white-glyph variant (crisp vector,
  // no CSS filter needed); if the dark variant fails, fall through to the
  // light mark + invert(1) instead of a dead recovery loop. Custom uploaded
  // logos (logoInvertInDark) get invert(1) too — a transparent PNG with
  // dark glyphs would otherwise vanish on the dark tile. The filter is safe
  // because the mark always renders on an opaque surface (the chip tile, or
  // an opaque caller tile in non-chip mode): the filter's rasterized edge
  // artifacts land on that surface, never on a page background.
  const isBuiltIn = isBuiltInLogoSrc(effectiveSrc)
  const useDarkVariant =
    dark && isBuiltIn && !failed.has(DEFAULT_SITE_LOGO) && !failed.has(DEFAULT_SITE_LOGO_DARK)
  const renderedSrc = useDarkVariant ? DEFAULT_SITE_LOGO_DARK : effectiveSrc
  const needsInvert = dark && !useDarkVariant

  function handleError() {
    setFailed((prev) => new Set(prev).add(renderedSrc))
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config
    <img
      src={renderedSrc}
      alt={alt}
      className={cn(
        chip ? "size-full rounded-lg object-cover" : "object-contain",
        !chip && className
      )}
      style={needsInvert ? { filter: "invert(1)" } : undefined}
      onError={handleError}
    />
  )

  if (!chip) return img

  // The tile IS the logo display — the mark fills it edge-to-edge with no
  // padding (a padded tile leaves gaps around small uploaded images), and
  // transparent mark corners show the muted tile behind them — never the
  // page background (the black-triangle fix).
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border/60 dark:ring-white/15",
        className
      )}
    >
      {img}
    </div>
  )
}
