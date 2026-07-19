"use client"

import { useLocale } from "@/components/layout/i18n-provider"
import { localeLabels, locales } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  function toggle() {
    const currentIndex = locales.indexOf(locale)
    const next = locales[(currentIndex + 1) % locales.length]
    setLocale(next)
  }

  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length]

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center size-9 rounded-lg border border-transparent hover:bg-muted hover:border-border transition-all text-xs font-medium"
      title={localeLabels[nextLocale]}
    >
      {locale === "zh" ? "中文" : "EN"}
    </button>
  )
}
