import { cache } from "react"
import { unstable_cache } from "next/cache"
import {
  getSiteSettings,
  type SiteSettingsRecord,
} from "@bitlog/database"
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config"

export const SITE_CONFIG_TAG = "site-config"

export type SiteSettingsDto = {
  name: string
  title: string
  description: string
  authorName: string
  logoUrl: string
  githubUrl: string
  twitterUrl: string
}

function envBits() {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || defaultSiteConfig.siteUrl,
    ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || defaultSiteConfig.ogImage,
  }
}

/**
 * Merge a DB row with compile-time defaults.
 * Once a row exists, stored empty strings are intentional (cleared fields)
 * and must not fall back to defaults — only name/title keep a non-empty
 * fallback so metadata never ships blank.
 */
export function siteConfigFromRow(
  row: SiteSettingsRecord | null
): SiteConfig {
  const env = envBits()

  if (!row) {
    return { ...defaultSiteConfig, ...env }
  }

  return {
    name: row.name.trim() ? row.name : defaultSiteConfig.name,
    title: row.title.trim() ? row.title : defaultSiteConfig.title,
    description: row.description,
    author: {
      name: row.authorName,
      avatar: defaultSiteConfig.author.avatar,
    },
    logoUrl: row.logoUrl,
    social: {
      github: row.githubUrl,
      twitter: row.twitterUrl,
    },
    ...env,
  }
}

export function toSettingsDto(config: SiteConfig): SiteSettingsDto {
  return {
    name: config.name,
    title: config.title,
    description: config.description,
    authorName: config.author.name,
    logoUrl: config.logoUrl,
    githubUrl: config.social.github,
    twitterUrl: config.social.twitter,
  }
}

async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const row = await getSiteSettings()
    return siteConfigFromRow(row)
  } catch {
    // DB unavailable (e.g. static export / missing env) — serve defaults.
    return { ...defaultSiteConfig, ...envBits() }
  }
}

const cachedLoad = unstable_cache(loadSiteConfig, [SITE_CONFIG_TAG], {
  tags: [SITE_CONFIG_TAG],
  revalidate: 3600,
})

/** Request-deduped + cross-request cached site config. */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => cachedLoad())
