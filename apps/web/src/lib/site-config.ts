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

export function siteLogoSrc(config: Pick<SiteConfig, "logoUrl">): string {
  return config.logoUrl || DEFAULT_SITE_LOGO
}

/** True for the built-in mark (empty url or a known builtin SVG path). */
export function isDefaultSiteLogo(config: Pick<SiteConfig, "logoUrl">): boolean {
  const url = config.logoUrl
  if (!url) return true
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0]
    return (
      path === DEFAULT_SITE_LOGO ||
      path === "/spooky.svg" ||
      path === "/favicon.svg" ||
      path.endsWith("/logo.svg")
    )
  } catch {
    return false
  }
}
