import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest } from "next/server"
import { getSiteConfig } from "@/lib/get-site-config"
import { DEFAULT_FAVICON } from "@/lib/site-config"

// No `dynamic` export here on purpose: GET route handlers are already
// dynamic by default (Next ≥ 15), and the static-export deploy
// (scripts/toggle-force-static.mjs) prepends `force-static` for the
// GitHub Pages build — declaring it ourselves would duplicate the export.

const MAX_FAVICON_BYTES = 2 * 1024 * 1024
const FETCH_TIMEOUT_MS = 5_000

/** Built-in mark bytes: build/dev machines have public/ on disk; a
 *  serverless runtime (no public/ in the function FS) fetches it from
 *  its own origin instead. Never redirects — a redirect can't be
 *  represented in the static export build. */
async function defaultFavicon(request: NextRequest): Promise<Response> {
  const svg = "image/svg+xml"
  try {
    const buf = readFileSync(join(process.cwd(), "public", "favicon.svg"))
    return new Response(buf, {
      headers: { "Content-Type": svg, "Cache-Control": "public, max-age=3600" },
    })
  } catch {
    const res = await fetch(
      new URL(DEFAULT_FAVICON, request.nextUrl.origin),
      { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!res.ok) throw new Error(`default favicon fetch failed: ${res.status}`)
    return new Response(await res.arrayBuffer(), {
      headers: { "Content-Type": svg, "Cache-Control": "public, max-age=3600" },
    })
  }
}

/**
 * Absolute logo URLs are fetched server-side on a public route, so keep
 * them https and off private/loopback/link-local hosts. (Relative paths
 * resolve to the request origin itself and never reach here.)
 */
function isUnsafeUrl(url: URL): boolean {
  if (url.protocol !== "https:") return true
  const host = url.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost")) return true
  if (host.includes(":")) return true // IPv6 literal
  const ip = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ip) {
    const [a, b] = ip.slice(1).map(Number)
    if (a === 10 || a === 127 || (a === 169 && b === 254)) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 0 || a >= 224) return true
  }
  return false
}

const EXT_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
}

/**
 * Favicon passthrough. The layout links /icon only while a custom site
 * logo is set (with a ?u= cache-busting query), so this route proxies the
 * uploaded logo bytes as the favicon — the same image, one origin. If the
 * logo is cleared, unreadable, or unsafe, fall back to the built-in mark.
 */
export async function GET(request: NextRequest) {
  const site = await getSiteConfig()
  const src = site.logoUrl.trim()
  if (!src) return defaultFavicon(request)

  try {
    // Relative ("/…") and absolute https URLs only. The settings schema
    // also accepts http and "//host" forms — the server-side fetch must
    // not follow those (SSRF), so reject them here.
    let url: URL
    if (src.startsWith("/")) {
      url = new URL(src, request.nextUrl.origin)
    } else {
      url = new URL(src)
      if (isUnsafeUrl(url)) throw new Error(`unsafe favicon url: ${src}`)
    }
    // A logo pointing at /icon would fetch this route from inside itself.
    if (url.pathname === "/icon") throw new Error("self-referential favicon url")

    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`favicon fetch failed: ${res.status}`)
    // Serve images only — an html/text response (e.g. logoUrl = "/")
    // would be proxied as garbage otherwise. Trust the upstream
    // content-type; fall back to the path extension when it's missing
    // or generic (octet-stream), so SVGs still resolve.
    const declared = res.headers.get("content-type")?.split(";")[0] ?? ""
    const dot = url.pathname.lastIndexOf(".")
    const ext = dot >= 0 ? url.pathname.slice(dot).toLowerCase() : ""
    const type = declared.startsWith("image/") ? declared : (EXT_TYPES[ext] ?? "")
    if (!type) throw new Error("favicon is not an image")
    if (Number(res.headers.get("content-length") ?? 0) > MAX_FAVICON_BYTES) {
      throw new Error("favicon too large")
    }
    const bytes = await res.arrayBuffer()
    if (bytes.byteLength > MAX_FAVICON_BYTES) throw new Error("favicon too large")

    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        // Favicons get cached aggressively; an hour is cheap enough while
        // being short enough that removing a logo recovers quickly.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("[icon] favicon proxy failed — serving built-in mark:", error)
    return defaultFavicon(request)
  }
}
