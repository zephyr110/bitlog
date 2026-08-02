"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Rss, UserRoundKey, LayoutDashboard } from "lucide-react"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { siteLogoSrc } from "@/lib/site-config"
import { SiteLogo } from "@/components/layout/site-logo"
import { useT } from "@/components/layout/trans"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getToken } from "@/lib/api-client"

const iconButtonClass =
  "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"

/**
 * Site footer — brand block + quick nav + icon actions on top, a hairline
 * copyright row below. The admin entry is a quiet icon button (lock when
 * signed out, dashboard when signed in): invisible to readers, always
 * where the admin expects it.
 */
export function Footer() {
  const pathname = usePathname()
  const { t } = useT()
  const site = useSiteConfig()
  const logoSrc = siteLogoSrc(site)
  const [loggedIn, setLoggedIn] = useState(false)

  // The token lives in localStorage, so it can only be read after mount —
  // and re-read on navigation so login/logout elsewhere reflects here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; post-mount read avoids hydration mismatch
    setLoggedIn(!!getToken())
  }, [pathname])

  if (pathname?.startsWith("/admin")) return null

  return (
    <footer className="bg-gradient-to-b from-background via-muted/30 to-muted/50">
      {/* Hairline at 90% viewport width — divides without touching the
          viewport edges, softer than a full-bleed border. */}
      <div className="mx-auto w-[90%]">
        <Separator className="bg-border/60" />
      </div>
      <div className="container mx-auto max-w-5xl px-4 pb-8 pt-12 2xl:max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex max-w-xs flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
            >
              <SiteLogo
                src={logoSrc}
                invertInDark={site.logoInvertInDark ?? true}
                className="size-6"
              />
              <span className="font-heading text-lg font-black tracking-tight">
                {site.name}
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {t("site.heroSubtitle") as string}
            </p>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} {site.name}
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
            {/* Quick nav */}
            <nav className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                {t("site.navigate") as string}
              </p>
              <Link
                href="/"
                className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("site.home") as string}
              </Link>
              <Link
                href="/timeline"
                className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("site.timeline") as string}
              </Link>
              <Link
                href="/about"
                className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("site.about") as string}
              </Link>
            </nav>

            {/* Icon actions */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                {t("site.links") as string}
              </p>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <a
                        href="https://github.com/zephyr110/zlog"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconButtonClass}
                        aria-label="GitHub"
                      />
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </TooltipTrigger>
                  <TooltipContent>GitHub</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <a
                        href="/feed.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={iconButtonClass}
                        aria-label="RSS"
                      />
                    }
                  >
                    <Rss size={18} />
                  </TooltipTrigger>
                  <TooltipContent>RSS</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href={loggedIn ? "/admin/dashboard" : "/admin/login"}
                        className={iconButtonClass}
                        aria-label={
                          loggedIn
                            ? (t("admin.dashboard") as string)
                            : (t("admin.signIn") as string)
                        }
                      />
                    }
                  >
                    {loggedIn ? <LayoutDashboard size={18} /> : <UserRoundKey size={18} />}
                  </TooltipTrigger>
                  <TooltipContent>
                    {loggedIn
                      ? (t("admin.dashboard") as string)
                      : (t("admin.signIn") as string)}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
