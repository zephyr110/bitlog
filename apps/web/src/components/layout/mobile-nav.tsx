"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { GithubIcon } from "@/components/ui/brand-icons"
import { ChevronDown } from "@/components/ui/chevron-down"
import { useT } from "@/components/layout/trans"
import { categoryMeta } from "@/lib/categories"
import { navLinks, type NavCategory } from "@/lib/nav-links"

/**
 * Mobile slide-in menu. The topics row is collapsible — its options slide
 * open under the header (grid-rows 0fr→1fr animates height smoothly),
 * indented left of the header row. The collapse state lives in the header
 * (a prop here) so it survives closing and reopening the menu; the
 * backdrop click and every link call `onClose` to dismiss the whole menu.
 */
export function MobileNav({
  categories,
  topicsOpen,
  onTopicsToggle,
  onClose,
}: {
  categories: NavCategory[]
  topicsOpen: boolean
  onTopicsToggle: () => void
  onClose: () => void
}) {
  const { t } = useT()
  const pathname = usePathname()

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 top-16 z-50 md:hidden border-b bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-1 duration-200 shadow-lg shadow-black/5">
        <nav className="container mx-auto px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
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
              <button
                type="button"
                onClick={onTopicsToggle}
                aria-expanded={topicsOpen}
                className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
              >
                {t("site.topics") as string}
                <ChevronDown
                  className={cn(
                    "transition-transform duration-200",
                    topicsOpen && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  topicsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden transition-opacity duration-300",
                    topicsOpen ? "opacity-100" : "opacity-0"
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
                          onClick={onClose}
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
          <a
            href="https://github.com/zephyr110/zlog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <GithubIcon size={16} />
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
  )
}
