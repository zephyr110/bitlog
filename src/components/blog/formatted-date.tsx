"use client"

import { useLocale } from "@/components/layout/i18n-provider"

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
      {new Date(date).toLocaleDateString(lang, {
        year: "numeric",
        month,
        day: "numeric",
      })}
    </time>
  )
}
