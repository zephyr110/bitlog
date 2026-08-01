"use client"

import { useState } from "react"
import { zhCN, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * shadcn-style date picker: a button showing the selected date (or the
 * i18n placeholder) opens a calendar popup. The value is a plain
 * "YYYY-MM-DD" local-date string — same contract as the old native input,
 * so the media page's UTC conversion stays untouched.
 */
export function DatePicker({
  value,
  onChange,
  ariaLabel,
  placeholder,
  locale,
}: {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  /** Shown when no date is selected. */
  placeholder: string
  locale: "zh" | "en"
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(`${value}T00:00:00`) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={ariaLabel}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs transition-colors hover:bg-muted/50"
          >
            <span
              className={cn(
                "truncate",
                value ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {value || placeholder}
            </span>
            <CalendarIcon
              size={12}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        }
      />
      <PopoverContent align="start" sideOffset={4} className="p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? formatDate(date) : "")
            setOpen(false)
          }}
          defaultMonth={selected}
          locale={locale === "zh" ? zhCN : enUS}
        />
      </PopoverContent>
    </Popover>
  )
}
