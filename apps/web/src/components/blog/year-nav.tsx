"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { useT } from "@/components/layout/trans"
import { cn } from "@/lib/utils"

/** Sticky year-jump bar for the home feed — sits under the site header
 *  (h-16) while scrolling, highlights the section currently in view, and
 *  jumps to a year section on click. Rendered only when there are 2+
 *  year groups (a single year needs no navigation). */
export function YearNavBar({
  years,
  activeYear,
  onSelect,
}: {
  years: number[]
  activeYear: number | null
  onSelect: (year: number) => void
}) {
  const { t } = useT()
  if (years.length < 2) return null

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md">
      <nav
        aria-label={t("site.yearNav") as string}
        className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => onSelect(year)}
            aria-pressed={activeYear === year}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm font-medium tabular-nums transition-all duration-200",
              activeYear === year
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {year}
          </button>
        ))}
      </nav>
    </div>
  )
}

/** Floating "back to top" affordance — appears after scrolling past the
 *  first viewport and smooth-scrolls to the top (respecting reduced
 *  motion). */
export function BackToTopButton() {
  const { t } = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label={t("site.backToTop") as string}
      onClick={() => {
        const reduce =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
      }}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-lg shadow-foreground/[0.06] backdrop-blur transition-all duration-300 hover:text-foreground hover:shadow-md",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ArrowUp size={18} />
    </button>
  )
}
