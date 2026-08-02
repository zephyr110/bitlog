"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { defaultSiteConfig, type SiteConfig } from "@/lib/site-config"

type SiteConfigContextValue = SiteConfig & {
  setSiteConfig: (next: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => void
  refreshSiteConfig: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  ...defaultSiteConfig,
  setSiteConfig: () => {},
  refreshSiteConfig: async () => {},
})

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig
  children: React.ReactNode
}) {
  const [config, setConfig] = useState(value)

  useEffect(() => {
    setConfig(value) // eslint-disable-line react-hooks/set-state-in-effect -- prop→state sync: server-rendered config may differ after hydration
  }, [value])

  const refreshSiteConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings")
      if (!res.ok) return
      const data = await res.json()
      const s = data.settings
      if (!s) return
      setConfig((prev) => ({
        ...prev,
        name: s.name ?? prev.name,
        title: s.title ?? prev.title,
        description: s.description ?? prev.description,
        author: { ...prev.author, name: s.authorName ?? prev.author.name },
        logoUrl: s.logoUrl ?? prev.logoUrl,
        social: {
          github: s.githubUrl ?? prev.social.github,
          twitter: s.twitterUrl ?? prev.social.twitter,
        },
      }))
    } catch {
      // ignore network errors — keep last known config
    }
  }, [])

  const ctx = useMemo<SiteConfigContextValue>(
    () => ({
      ...config,
      setSiteConfig: setConfig,
      refreshSiteConfig,
    }),
    [config, refreshSiteConfig]
  )

  return (
    <SiteConfigContext.Provider value={ctx}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export function useSiteConfig(): SiteConfigContextValue {
  return useContext(SiteConfigContext)
}
