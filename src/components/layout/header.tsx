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
import { Menu, X, Search } from "lucide-react"

const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/about", i18nKey: "site.about" },
]

const categoryLabels: Record<string, string> = {
  frontend: "前端",
  backend: "后端",
  automator: "自动化",
  components: "组件",
  gear: "工具",
  miniprogram: "小程序",
  summary: "总结",
}

export function Header({ categories }: { categories: string[] }) {
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
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  if (pathname?.startsWith("/admin")) return null

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
            : "border-transparent bg-background"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-base tracking-tight hover:opacity-90 transition-opacity shrink-0 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/spooky.svg"
                alt=""
                className="size-8 rounded-lg object-contain dark:invert"
              />
              <span className="hidden sm:inline">{siteConfig.name}</span>
            </Link>
          </div>

          {/* Right: Search · 首页 · 分类 · 时间轴 · 关于 · | · 主题 · 语言 · GitHub */}
          <div className="flex items-center gap-0.5">

            {/* Search */}
            <SearchInput />

            {/* 首页 — text link */}
            <Link
              href="/"
              className={cn(
                "relative hidden md:flex items-center px-2 py-1.5 text-sm font-medium transition-colors duration-200",
                pathname === "/"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("site.home") as string}
              {pathname === "/" && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/80" />
              )}
            </Link>

            {/* 分类 — text button with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative hidden md:flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded cursor-pointer outline-none">
                <span>{t("site.topics") as string}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                {categories.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    {t("site.noTopics") as string}
                  </div>
                ) : (
                  categories.map((cat) => {
                    const label = categoryLabels[cat] || cat
                    return (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => router.push(`/category/${encodeURIComponent(cat)}`)}
                        className="flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          {cat}
                        </span>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 时间轴 — text link */}
            <Link
              href="/timeline"
              className="relative hidden md:flex items-center px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {t("site.timeline") as string}
            </Link>

            {/* 关于 — text link */}
            <Link
              href="/about"
              className={cn(
                "relative hidden md:flex items-center px-2 py-1.5 text-sm font-medium transition-colors duration-200",
                pathname === "/about"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("site.about") as string}
              {pathname === "/about" && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/80" />
              )}
            </Link>

            {/* Separator */}
            <span className="mx-1 h-4 w-px bg-border hidden md:block" aria-hidden="true" />

            <ThemeToggle />
            <LanguageSwitcher />

            {/* GitHub */}
            <a
              href="https://github.com/zephyr110/bitlog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>

            {/* Mobile menu toggle */}
            <button
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors md:hidden"
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
          <div
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
          />
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
              {/* Mobile categories */}
              {categories.length > 0 && (
                <>
                  <div className="my-2 mx-3 border-t" />
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t("site.topics") as string}
                  </div>
                  {categories.map((cat) => {
                    const label = categoryLabels[cat] || cat
                    return (
                      <Link
                        key={cat}
                        href={`/category/${encodeURIComponent(cat)}`}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                          pathname === `/category/${encodeURIComponent(cat)}`
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </>
              )}
              <div className="my-2 mx-3 border-t" />
              <a
                href="https://github.com/zephyr110/bitlog"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {t("admin.theme") as string}
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {t("admin.language") as string}
                </span>
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

function SearchInput() {
  const { t } = useT()
  const router = useRouter()
  const [value, setValue] = useState("")

  // Sync initial value from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setValue(params.get("q") || "")
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = value.trim()
    if (q) {
      router.push(`/?q=${encodeURIComponent(q)}`)
    } else {
      router.push("/")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center"
    >
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("site.searchPosts") as string}
          className="w-32 h-8 pl-8 pr-2 text-sm rounded-lg border border-transparent bg-muted/50 text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 focus:bg-background focus:text-foreground focus:w-48 transition-all duration-200"
        />
      </div>
    </form>
  )
}
