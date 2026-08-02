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
  logoInvertInDark: boolean
  githubUrl: string
  twitterUrl: string
}

/**
 * Merge a DB row with compile-time defaults.
 * Once a row exists, stored empty strings are intentional (cleared fields)
 * and must not fall back to defaults — except author.name, which the Atom
 * feed spec requires non-empty, so it keeps the default fallback like
 * name/title.
 */
export function siteConfigFromRow(
  row: SiteSettingsRecord | null
): SiteConfig {
  if (!row) {
    return { ...defaultSiteConfig }
  }

  return {
    name: row.name.trim() ? row.name : defaultSiteConfig.name,
    title: row.title.trim() ? row.title : defaultSiteConfig.title,
    description: row.description,
    author: {
      name: row.authorName.trim()
        ? row.authorName
        : defaultSiteConfig.author.name,
      avatar: defaultSiteConfig.author.avatar,
    },
    logoUrl: row.logoUrl,
    logoInvertInDark: row.logoInvertDark ?? true,
    social: {
      github: row.githubUrl,
      twitter: row.twitterUrl,
    },
    siteUrl: defaultSiteConfig.siteUrl,
    ogImage: defaultSiteConfig.ogImage,
  }
}

export function toSettingsDto(config: SiteConfig): SiteSettingsDto {
  return {
    name: config.name,
    title: config.title,
    description: config.description,
    authorName: config.author.name,
    logoUrl: config.logoUrl,
    logoInvertInDark: config.logoInvertInDark,
    githubUrl: config.social.github,
    twitterUrl: config.social.twitter,
  }
}

// DB failure propagates here — the fallback below must NOT be cached, or
// a transient outage at first fetch would freeze the site identity on
// defaults for the whole revalidate window.
async function loadSiteConfig(): Promise<SiteConfig> {
  const row = await getSiteSettings()
  return siteConfigFromRow(row)
}

const cachedLoad = unstable_cache(loadSiteConfig, [SITE_CONFIG_TAG], {
  tags: [SITE_CONFIG_TAG],
  revalidate: 3600,
})

/** Request-deduped + cross-request cached site config. A DB failure falls
 *  back to compile-time defaults without caching them. */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    return await cachedLoad()
  } catch {
    console.warn("[site-config] DB read failed — using compile-time defaults")
    return { ...defaultSiteConfig }
  }
})
