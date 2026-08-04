import { NextResponse } from "next/server"
import { getSiteConfig } from "@/lib/get-site-config"

// Always run at request time — the logo can change whenever a settings
// save lands (the PUT revalidates SITE_CONFIG_TAG), so build-time
// caching would freeze the favicon on the first logo forever.
export const dynamic = "force-dynamic"

/**
 * Favicon passthrough. The layout links /icon only while a custom site
 * logo is set (with a ?u= cache-busting query), so this route proxies the
 * uploaded logo bytes as the favicon — the same image, one origin. If the
 * logo is cleared or the fetch fails, fall back to the built-in mark.
 */
export async function GET() {
  const site = await getSiteConfig()
  const src = site.logoUrl.trim()
  const fallback = () =>
    NextResponse.redirect(new URL("/favicon.svg", site.siteUrl))

  if (!src) return fallback()

  try {
    // Relative ("/…") and absolute http(s) URLs are the only forms the
    // settings schema accepts — resolve both against the public origin.
    const url = src.startsWith("/") ? new URL(src, site.siteUrl) : new URL(src)
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(`favicon fetch failed: ${res.status}`)
    const bytes = await res.arrayBuffer()
    const contentType =
      res.headers.get("content-type")?.split(";")[0] || "image/png"
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        // Favicons get cached aggressively; an hour is cheap enough while
        // being short enough that removing a logo recovers quickly.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("[icon] failed to proxy site logo:", error)
    return fallback()
  }
}
