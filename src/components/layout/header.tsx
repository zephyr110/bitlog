"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { siteConfig } from "@/lib/site-config"
import { useT } from "@/components/layout/trans"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/about", i18nKey: "site.about" },
]

function VerticalRule({ className }: { className?: string }) {
  return (
    <span
      className={cn("mx-3 h-4 w-px bg-border", className)}
      aria-hidden="true"
    />
  )
}

export function Header() {
  const { t } = useT()
  const pathname = usePathname()
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

            <VerticalRule />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-2 py-1.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(link.i18nKey) as string}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/80" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: Utilities */}
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <LanguageSwitcher />

            <a
              href="https://github.com/zephyr110"
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
              <div className="my-2 mx-3 border-t" />
              <a
                href="https://github.com/zephyr110"
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
