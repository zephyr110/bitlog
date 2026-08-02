"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect -- theme is only known client-side
  }, [])

  const invert = invertInDark && mounted && resolvedTheme === "dark"

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote/uploaded logos; avoid next/image domain config
    <img
      src={src}
      alt={alt}
      className={cn("object-contain", className)}
      style={invert ? { filter: "invert(1)" } : undefined}
    />
  )
}
