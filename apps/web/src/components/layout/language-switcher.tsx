"use client"

import { useLocale } from "@/components/layout/i18n-provider"
import { localeLabels, locales } from "@/lib/i18n"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { IconButton } from "@/components/ui/icon-button"

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
        <IconButton
          onClick={toggle}
          aria-label={localeLabels[nextLocale]}
          className="text-xs font-medium"
        >
          {locale === "zh" ? "中文" : "EN"}
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>{localeLabels[nextLocale]}</TooltipContent>
    </Tooltip>
  )
}
