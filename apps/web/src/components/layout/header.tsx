"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { IconButton } from "@/components/ui/icon-button"
import { useSiteConfig } from "@/components/layout/site-config-provider"
import { siteLogoSrc } from "@/lib/site-config"
import { SiteLogo } from "@/components/layout/site-logo"
import { useT } from "@/components/layout/trans"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Menu, X, Search } from "lucide-react"
import { GithubIcon } from "@/components/ui/brand-icons"
import { categoryMeta } from "@/lib/categories"

const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/archive", i18nKey: "site.archive" },
  { href: "/about", i18nKey: "site.about" },
]

type Category = { key: string; count: number }

export function Header({ categories }: { categories: Category[] }) {
  const { t } = useT()
  const site = useSiteConfig()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const logoSrc = siteLogoSrc(site)

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
            <SearchInput t={t} router={router} pathname={pathname} />

            {/* ── Text links with polished active/hover states ── */}

            {/* 首页 */}
            <NavLink href="/" active={atHome}>
              {t("site.home") as string}
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
                <span>{t("site.topics") as string}</span>
                <svg className="size-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={12} className="w-64 p-2">
                {categories.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                    {t("site.noTopics") as string}
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
                              {t(meta.i18nKey as never) as string}
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
              {t("site.archive") as string}
            </NavLink>

            {/* 关于 */}
            <NavLink href="/about" active={atAbout}>
              {t("site.about") as string}
            </NavLink>

            {/* Separator */}
            <span className="mx-2 h-4 w-px bg-border/60 hidden md:block" aria-hidden="true" />

            {/* Icon buttons */}
            <ThemeToggle />
            <LanguageSwitcher />

            {/* GitHub */}
            <a
              href="https://github.com/zephyr110/zlog"
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
        <>
          <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-x-0 top-16 z-50 md:hidden border-b bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-1 duration-200 shadow-lg shadow-black/5">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {t(link.i18nKey) as string}
                </Link>
              ))}
              {categories.length > 0 && (
                <>
                  <div className="my-2 mx-3 border-t" />
                  {/* Collapsible topics — the options slide open under the
                      header (grid-rows 0fr→1fr animates height smoothly),
                      indented left of the header row. */}
                  <button
                    type="button"
                    onClick={() => setMobileTopicsOpen((v) => !v)}
                    aria-expanded={mobileTopicsOpen}
                    className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
                  >
                    {t("site.topics") as string}
                    <svg
                      className={cn(
                        "size-3 opacity-50 transition-transform duration-200",
                        mobileTopicsOpen && "rotate-180"
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      mobileTopicsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div
                      className={cn(
                        "overflow-hidden transition-opacity duration-300",
                        mobileTopicsOpen ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <div className="flex flex-col gap-0.5 pt-1 pb-1 pl-4">
                        {categories.map((cat) => {
                          const meta = categoryMeta[cat.key as keyof typeof categoryMeta]
                          if (!meta) return null
                          return (
                            <Link
                              key={cat.key}
                              href={`/category/${encodeURIComponent(cat.key)}`}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                pathname === `/category/${encodeURIComponent(cat.key)}`
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {t(meta.i18nKey as never) as string}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="my-2 mx-3 border-t" />
              <a href="https://github.com/zephyr110/zlog" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
                <GithubIcon size={16} />
                GitHub
              </a>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">{t("admin.theme") as string}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">{t("admin.language") as string}</span>
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        </>
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

function SearchInput({ t, router, pathname }: { t: ReturnType<typeof useT>["t"]; router: ReturnType<typeof useRouter>; pathname: string }) {
  const [value, setValue] = useState("")

  // Sync the header search box from ?q= on mount and on browser
  // back/forward. Only /archive consumes ?q=, so we don't sync on
  // other routes (an old /?q=... bookmark is harmless to ignore).
  useEffect(() => {
    if (pathname !== "/archive") return
    const sync = () => {
      const params = new URLSearchParams(window.location.search)
      setValue(params.get("q") || "")
    }
    sync()
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [pathname])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = value.trim()
    // Search results live on the archive page — the home feed only shows
    // the latest handful of posts.
    router.push(q ? `/archive?q=${encodeURIComponent(q)}` : "/archive")
  }

  return (
    <form onSubmit={handleSubmit} className="hidden md:flex items-center mr-2">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("site.searchPosts") as string}
          className="w-36 h-8 pl-8 pr-2 text-sm rounded-lg border border-transparent bg-muted/50 text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 focus:bg-background focus:text-foreground focus:w-48 transition-all duration-200"
        />
      </div>
    </form>
  )
}
