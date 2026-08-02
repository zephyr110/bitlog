"use client"

import { useLocale } from "@/components/layout/i18n-provider"
import { parseUtcDate } from "@/lib/date"

interface FormattedDateProps {
  date: string
  month?: "long" | "short"
}

const localeMap: Record<string, string> = {
  zh: "zh-CN",
  en: "en-US",
}

export function FormattedDate({ date, month = "long" }: FormattedDateProps) {
  const { locale } = useLocale()
  const lang = localeMap[locale] || "en-US"

  return (
    <time dateTime={date}>
      {parseUtcDate(date).toLocaleDateString(lang, {
        // Dates are UTC calendar dates — formatting in UTC shows the
        // authored date identically in every timezone (a negative-offset
        // viewer must not see yesterday's date), and SSR matches client.
        timeZone: "UTC",
        year: "numeric",
        month,
        day: "numeric",
      })}
    </time>
  )
}
