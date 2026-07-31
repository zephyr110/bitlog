"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { siteConfig } from "@/lib/site-config"
import { useT } from "@/components/layout/trans"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Menu, X, Search, FileText } from "lucide-react"
import { categoryMeta } from "@/lib/categories"

const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/about", i18nKey: "site.about" },
]

type Category = { key: string; count: number }

export function Header({ categories }: { categories: Category[] }) {
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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
            className="flex items-center gap-2.5 font-semibold text-base tracking-tight hover:opacity-85 transition-opacity shrink-0"
          >
            <img
              src="/spooky.svg"
              alt=""
              className="size-8 rounded-lg object-contain dark:invert"
            />
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </Link>

          {/* Right: Search · 首页 · 分类 · 时间轴 · 关于 · | · 主题 · 语言 · GitHub */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <SearchInput t={t} router={router} />

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
                          "flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                          active && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
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

            {/* 时间轴 */}
            <NavLink href="/timeline" active={pathname === "/timeline"}>
              {t("site.timeline") as string}
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
              href="https://github.com/zephyr110/bitlog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
              title="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>

            {/* Mobile menu toggle */}
            <button
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted/60 transition-colors md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
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
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t("site.topics") as string}
                  </div>
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
                </>
              )}
              <div className="my-2 mx-3 border-t" />
              <a href="https://github.com/zephyr110/bitlog" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
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

function SearchInput({ t, router }: { t: ReturnType<typeof useT>["t"]; router: ReturnType<typeof useRouter> }) {
  const [value, setValue] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setValue(params.get("q") || "")
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/")
  }

  return (
    <form onSubmit={handleSubmit} className="hidden md:flex items-center">
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
