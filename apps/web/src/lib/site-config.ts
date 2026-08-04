export type SiteConfig = {
  name: string
  title: string
  description: string
  author: {
    name: string
    avatar: string
  }
  /** Canonical public URL — from NEXT_PUBLIC_SITE_URL only (not editable in settings). */
  siteUrl: string
  ogImage: string
  /** Uploaded site logo URL; empty means use the built-in mark. */
  logoUrl: string
  /** Invert logo colors in dark mode (for monochrome marks). */
  logoInvertInDark: boolean
  social: {
    github: string
    twitter: string
  }
}

/** Compile-time / fallback defaults when DB has no row yet. */
export const defaultSiteConfig: SiteConfig = {
  name: "Zlog",
  title: "Zlog",
  description: "A personal blog about technology, programming, and more.",
  author: {
    name: "Admin",
    avatar: "/images/avatar.jpg",
  },
  // Trailing slash stripped so URL concatenation (ogImageUrl, feeds)
  // never produces double slashes regardless of the env value.
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  ),
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || "/images/og-default.jpg",
  logoUrl: "",
  logoInvertInDark: true,
  social: {
    github: "https://github.com/zephyr110/zlog",
    twitter: "https://twitter.com",
  },
}

/** @deprecated Prefer getSiteConfig() / useSiteConfig() — kept for sync env fields. */
export const siteConfig = defaultSiteConfig

export const DEFAULT_SITE_LOGO = "/logo.svg"
/** White-glyph variant of the built-in mark, used in dark mode so the
 *  logo never needs a CSS invert filter (filter forces bitmap
 *  rasterization, which renders jagged on some engines/HiDPI setups). */
export const DEFAULT_SITE_LOGO_DARK = "/logo-dark.svg"
/** Built-in favicon mark — also the fallback the /icon route serves. */
export const DEFAULT_FAVICON = "/favicon.svg"

export function siteLogoSrc(config: Pick<SiteConfig, "logoUrl">): string {
  return config.logoUrl || DEFAULT_SITE_LOGO
}

/** True when src is a known built-in mark (not a custom upload). */
export function isBuiltInLogoSrc(src: string): boolean {
  return src === DEFAULT_SITE_LOGO || src === DEFAULT_SITE_LOGO_DARK ||
    src === "/spooky.svg" || src === DEFAULT_FAVICON ||
    src.endsWith("/logo.svg")
}
