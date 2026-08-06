"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { IconButton } from "@/components/ui/icon-button"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { siteLogoSrc, defaultSiteConfig } from "@/lib/site-config"
import { SiteLogo } from "@/components/layout/site-logo"
import { useT } from "@/components/layout/trans"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Menu, X, ChevronDown } from "lucide-react"
import { GithubIcon } from "@/components/ui/brand-icons"
import { categoryMeta } from "@/lib/categories"
import { SearchInput } from "@/components/layout/search-input"
import { MobileNav } from "@/components/layout/mobile-nav"
import type { NavCategory } from "@/lib/nav-links"

export function Header({ categories }: { categories: NavCategory[] }) {
  const { t } = useT()
  const site = useSiteConfig()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const logoSrc = siteLogoSrc(site)
  const githubUrl = site.social.github || defaultSiteConfig.social.github

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  if (pathname?.startsWith("/admin")) return null

  const atHome = pathname === "/"
  const atAbout = pathname === "/about"
  const atCategory = pathname?.startsWith("/category/")

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
            : "border-transparent bg-background"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base tracking-tight hover:opacity-85 transition-opacity shrink-0"
          >
            <SiteLogo
              src={logoSrc}
              invertInDark={site.logoInvertInDark ?? true}
              className="size-9"
              chip
            />
            <span className="hidden font-black text-lg sm:inline">{site.name}</span>
          </Link>

          {/* Right: Search · 首页 · 分类 · 归档 · 关于 · | · 主题 · 语言 · GitHub */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <SearchInput />

            {/* ── Text links with polished active/hover states ── */}

            {/* 首页 */}
            <NavLink href="/" active={atHome}>
              {t("site.home")}
            </NavLink>

            {/* 分类 — premium dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "relative hidden md:flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer outline-none",
                  atCategory
                    ? "text-foreground bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <span>{t("site.topics")}</span>
                <ChevronDown aria-hidden className="size-3 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={12} className="w-64 p-2">
                {categories.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                    {t("site.noTopics")}
                  </p>
                ) : (
                  categories.map((cat) => {
                    const meta = categoryMeta[cat.key as keyof typeof categoryMeta]
                    if (!meta) return null
                    const Icon = meta.icon
                    const active = pathname === `/category/${encodeURIComponent(cat.key)}`
                    return (
                      <DropdownMenuItem
                        key={cat.key}
                        onClick={() => router.push(`/category/${encodeURIComponent(cat.key)}`)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                          active && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-sm font-medium",
                              active ? "text-primary" : "text-foreground"
                            )}>
                              {t(meta.i18nKey) as string}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60 tabular-nums font-mono">
                              {cat.count}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 归档 */}
            <NavLink href="/archive" active={pathname === "/archive"}>
              {t("site.archive")}
            </NavLink>

            {/* 关于 */}
            <NavLink href="/about" active={atAbout}>
              {t("site.about")}
            </NavLink>

            {/* Separator */}
            <span className="mx-2 h-4 w-px bg-border/60 hidden md:block" aria-hidden="true" />

            {/* Icon buttons */}
            <ThemeToggle />
            <LanguageSwitcher />

            {/* GitHub */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="GitHub"
            >
              <GithubIcon size={18} />
            </a>

            {/* Mobile menu toggle */}
            <IconButton
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <MobileNav
          categories={categories}
          topicsOpen={mobileTopicsOpen}
          onTopicsToggle={() => setMobileTopicsOpen((v) => !v)}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}

/** Polished nav link with hover background and active dot */
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative hidden md:flex items-center px-2.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
        active
          ? "text-foreground bg-muted/60"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-px left-2 right-2 h-[1.5px] rounded-full bg-primary/70" />
      )}
    </Link>
  )
}
