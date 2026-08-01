"use client"

import { useLocale } from "@/components/layout/i18n-provider"
import { localeLabels, locales } from "@/lib/i18n"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  function toggle() {
    const currentIndex = locales.indexOf(locale)
    const next = locales[(currentIndex + 1) % locales.length]
    setLocale(next)
  }

  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length]

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          onClick={toggle}
          aria-label={localeLabels[nextLocale]}
          className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors text-xs font-medium"
        >
          {locale === "zh" ? "中文" : "EN"}
        </button>
      </TooltipTrigger>
      <TooltipContent>{localeLabels[nextLocale]}</TooltipContent>
    </Tooltip>
  )
}
