"use client"

import { useMemo, useState, useEffect } from "react"
import { useT } from "@/components/layout/trans"
import { useLocale } from "@/components/layout/i18n-provider"
import { cn } from "@/lib/utils"

interface ContributionCalendarProps {
  posts: { date: string }[]
}

const CELL_SIZE = 11
const CELL_GAP = 3
// GitHub-style levels: 0 = none, 4 = heaviest
const LEVEL_CLASSES = [
  "bg-muted/50 dark:bg-muted/20",
  "bg-emerald-200 dark:bg-[#0e4429]",
  "bg-emerald-400 dark:bg-[#006d32]",
  "bg-emerald-600 dark:bg-[#26a641]",
  "bg-emerald-700 dark:bg-[#39d353]",
]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface TooltipState {
  date: string
  count: number
  left: number
  top: number
}

export function ContributionCalendar({ posts }: ContributionCalendarProps) {
  const { t } = useT()
  const { locale } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  // Count published posts per day (YYYY-MM-DD)
  const countsByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const post of posts) {
      const key = post.date.slice(0, 10)
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [posts])

  // Rolling 365-day window aligned to a Sunday start, GitHub-style.
  const weeks = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 364)
    // Align the first column to Sunday
    start.setDate(start.getDate() - start.getDay())

    const cells: { date: Date; key: string; count: number }[][] = []
    let cursor = new Date(start)
    for (let w = 0; w < 53; w++) {
      const column: { date: Date; key: string; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const key = toKey(cursor)
        column.push({ date: new Date(cursor), key, count: countsByDay.get(key) || 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      cells.push(column)
    }
    return cells
  }, [countsByDay])

  // Month labels above the columns (shown at month boundaries)
  const monthLabels = useMemo(() => {
    const labels: { index: number; text: string }[] = []
    const fmt = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
    })
    let lastMonth = -1
    weeks.forEach((column, colIdx) => {
      const first = column[0].date
      if (first.getMonth() !== lastMonth) {
        labels.push({ index: colIdx, text: fmt.format(first) })
        lastMonth = first.getMonth()
      }
    })
    return labels
  }, [weeks, locale])

  const monthLabel = (d: Date) =>
    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d)

  // SSR-safe: skip rendering the calendar until mounted to avoid
  // hydration mismatches from new Date().
  if (!mounted) {
    return <div className="h-[118px]" />
  }

  return (
    <div className="relative inline-block">
      {/* Month labels */}
      <div
        className="flex mb-1.5"
        style={{ gap: CELL_GAP }}
      >
        {Array.from({ length: 53 }).map((_, i) => {
          const label = monthLabels.find((l) => l.index === i)
          return (
            <div
              key={i}
              className="text-[10px] text-muted-foreground/70 leading-none h-3.5"
              style={{ width: CELL_SIZE }}
            >
              {label?.text ?? ""}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex" style={{ gap: CELL_GAP }}>
        {weeks.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-col" style={{ gap: CELL_GAP }}>
            {column.map((cell) => {
              const level = getLevel(cell.count)
              const isFuture = cell.date.getTime() > Date.now()
              return (
                <div
                  key={cell.key}
                  onMouseEnter={(e) => {
                    if (isFuture || cell.count === 0) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const container = e.currentTarget.parentElement?.parentElement
                    const containerRect = container?.getBoundingClientRect()
                    setTooltip({
                      date: cell.key,
                      count: cell.count,
                      left: (containerRect ? rect.left - containerRect.left : rect.left) + CELL_SIZE / 2,
                      top: rect.top - (containerRect ? containerRect.top : 0) - 34,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  title={
                    cell.count > 0 && !isFuture
                      ? `${monthLabel(cell.date)} · ${cell.count}`
                      : monthLabel(cell.date)
                  }
                  className={cn(
                    "rounded-[2.5px] transition-colors",
                    isFuture ? "opacity-30" : "hover:ring-1 hover:ring-primary/40",
                    LEVEL_CLASSES[level]
                  )}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          <p className="font-medium">
            {(t("admin.postsOn") as (date: string, n: number) => string)(
              monthLabel(new Date(`${tooltip.date}T00:00:00`)),
              tooltip.count
            )}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/70">
        <span>{t("admin.contributionLess") as string}</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <span key={i} className={cn("size-2.5 rounded-[2px]", cls)} />
        ))}
        <span>{t("admin.contributionMore") as string}</span>
      </div>
    </div>
  )
}
