"use client"

import { useMemo, useState, useEffect } from "react"
import { useT } from "@/components/layout/trans"
import { useLocale } from "@/components/layout/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatLocalDate } from "@/lib/date"

interface ContributionCalendarProps {
  posts: { date: string }[]
}

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

interface TooltipState {
  date: string
  count: number
  left: number
  top: number
}

/** Calendar window: either the rolling past year or a specific year. */
function buildWeeks(
  countsByDay: Map<string, number>,
  selectedYear: number | null
): { date: Date; key: string; count: number }[][] {
  let start: Date
  if (selectedYear) {
    // Calendar year: Jan 1 … Dec 31
    start = new Date(selectedYear, 0, 1)
    start.setDate(start.getDate() - start.getDay()) // align to Sunday
    const end = new Date(selectedYear, 11, 31)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
    const weeks: { date: Date; key: string; count: number }[][] = []
    const cursor = new Date(start)
    for (let w = 0; w < Math.ceil(totalDays / 7); w++) {
      const column: { date: Date; key: string; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const key = formatLocalDate(cursor)
        column.push({ date: new Date(cursor), key, count: countsByDay.get(key) || 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(column)
    }
    return weeks
  }

  // Rolling 365-day window aligned to a Sunday start, GitHub-style.
  const end = new Date()
  start = new Date(end)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())

  const weeks: { date: Date; key: string; count: number }[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < 53; w++) {
    const column: { date: Date; key: string; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const key = formatLocalDate(cursor)
      column.push({ date: new Date(cursor), key, count: countsByDay.get(key) || 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(column)
  }
  return weeks
}

export function ContributionCalendar({ posts }: ContributionCalendarProps) {
  const { t } = useT()
  const { locale } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null) // null = past year

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

  // Years available in the data, newest first
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    for (const post of posts) {
      const y = Number(post.date.slice(0, 4))
      if (Number.isFinite(y)) years.add(y)
    }
    return [...years].sort((a, b) => b - a)
  }, [posts])

  const weeks = useMemo(
    () => buildWeeks(countsByDay, selectedYear),
    [countsByDay, selectedYear]
  )

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
      }),
    [locale]
  )
  const monthFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [locale]
  )

  // Month labels above the columns (shown at month boundaries)
  const monthLabels = useMemo(() => {
    const labels: { index: number; text: string }[] = []
    let lastMonth = -1
    weeks.forEach((column, colIdx) => {
      const first = column[0].date
      if (first.getMonth() !== lastMonth) {
        labels.push({ index: colIdx, text: fmt.format(first) })
        lastMonth = first.getMonth()
      }
    })
    return labels
  }, [weeks, fmt])

  // SSR-safe: skip rendering the calendar until mounted to avoid
  // hydration mismatches from new Date().
  if (!mounted) {
    return (
      <div className="flex h-[118px] items-center justify-between gap-4">
        <div className="flex-1" />
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <div>
      {/* Year filter */}
      <div className="mb-3 flex justify-end">
        <Select
          value={selectedYear ? String(selectedYear) : "recent"}
          onValueChange={(v) =>
            setSelectedYear(v === "recent" ? null : Number(v))
          }
        >
          <SelectTrigger size="sm" className="w-36">
            {/* Explicit children: Base UI's SelectValue only renders the
                matched item label when items/itemToStringLabel are given —
                otherwise it falls back to the raw value string ("recent"
                instead of the "Past year"/"最近一年" translation). */}
            <SelectValue>
              {selectedYear
                ? String(selectedYear)
                : (t("admin.calendarRecent") as string)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              {t("admin.calendarRecent") as string}
            </SelectItem>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        {/* Month labels */}
        <div className="mb-1.5 flex" style={{ gap: CELL_GAP }}>
          {weeks.map((_, i) => {
            const label = monthLabels.find((l) => l.index === i)
            return (
              <div
                key={i}
                className="flex-1 text-[11px] font-medium leading-none text-muted-foreground"
              >
                {label ? (
                  <span className="inline-block h-3.5">{label.text}</span>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Grid — columns stretch to fill the full card width */}
        <div className="flex" style={{ gap: CELL_GAP }}>
          {weeks.map((column, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-1 flex-col"
              style={{ gap: CELL_GAP }}
            >
              {column.map((cell) => {
                const level = getLevel(cell.count)
                const isFuture = cell.date.getTime() > Date.now()
                return (
                  <div
                    key={cell.key}
                    onMouseEnter={(e) => {
                      if (isFuture || cell.count === 0) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const container =
                        e.currentTarget.parentElement?.parentElement
                      const containerRect = container?.getBoundingClientRect()
                      setTooltip({
                        date: cell.key,
                        count: cell.count,
                        left:
                          (containerRect
                            ? rect.left - containerRect.left
                            : rect.left) +
                          rect.width / 2,
                        top:
                          rect.top -
                          (containerRect ? containerRect.top : 0) -
                          34,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "aspect-square w-full rounded-[3px] transition-all",
                      isFuture
                        ? "opacity-30"
                        : "hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-card",
                      LEVEL_CLASSES[level]
                    )}
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
                monthFmt.format(new Date(`${tooltip.date}T00:00:00`)),
                tooltip.count
              )}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/70">
        <span>{t("admin.contributionLess") as string}</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <span key={i} className={cn("size-2.5 rounded-[3px]", cls)} />
        ))}
        <span>{t("admin.contributionMore") as string}</span>
      </div>
    </div>
  )
}
