"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site-config"
import { useT } from "@/components/layout/trans"
import { Menu, X, User } from "lucide-react"

const navLinks = [
  { href: "/", i18nKey: "site.home" },
  { href: "/about", i18nKey: "site.about" },
]

export function Header() {
  const { t } = useT()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (pathname?.startsWith("/admin")) return null

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-300",
        scrolled
          ? "shadow-sm border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-background"
      )}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-extrabold shadow-sm shadow-primary/25">
            B
          </span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                  isActive
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {t(link.i18nKey) as string}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-0.5">
          <LanguageSwitcher />
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>

          <Link
            href="/admin/login"
            className="hidden md:inline-flex items-center justify-center size-9 rounded-full hover:bg-muted transition-colors"
            title={t("site.admin") as string}
          >
            <User size={16} className="opacity-60" />
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="container mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t(link.i18nKey) as string}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t("site.admin") as string}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
