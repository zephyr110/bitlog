"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Rss, UserRoundKey, LayoutDashboard } from "lucide-react"
import { GithubIcon, XIcon } from "@/components/ui/brand-icons"
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
                chip
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
                href="/archive"
                className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("site.archive") as string}
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
                    <GithubIcon size={18} />
                  </TooltipTrigger>
                  <TooltipContent>GitHub</TooltipContent>
                </Tooltip>
                {site.social.twitter ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={site.social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={iconButtonClass}
                          aria-label="Twitter"
                        />
                      }
                    >
                      <XIcon size={18} />
                    </TooltipTrigger>
                    <TooltipContent>Twitter</TooltipContent>
                  </Tooltip>
                ) : null}
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
