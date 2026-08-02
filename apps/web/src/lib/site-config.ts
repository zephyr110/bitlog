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
  social: {
    github: string
    twitter: string
  }
}

/** Compile-time / fallback defaults when DB has no row yet. */
export const defaultSiteConfig: SiteConfig = {
  name: "BitLog",
  title: "BitLog",
  description: "A personal blog about technology, programming, and more.",
  author: {
    name: "Admin",
    avatar: "/images/avatar.jpg",
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || "/images/og-default.jpg",
  logoUrl: "",
  social: {
    github: "https://github.com/zephyr110/bitlog",
    twitter: "https://twitter.com",
  },
}

/** @deprecated Prefer getSiteConfig() / useSiteConfig() — kept for sync env fields. */
export const siteConfig = defaultSiteConfig

export const DEFAULT_SITE_LOGO = "/spooky.svg"

export function siteLogoSrc(config: Pick<SiteConfig, "logoUrl">): string {
  return config.logoUrl || DEFAULT_SITE_LOGO
}

export function isDefaultSiteLogo(config: Pick<SiteConfig, "logoUrl">): boolean {
  return !config.logoUrl
}
