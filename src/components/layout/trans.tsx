"use client"

import { useLocale } from "@/components/layout/i18n-provider"
import { translations, type Locale, type TranslationDict } from "@/lib/i18n"

type TranslationValue = string | ((...args: unknown[]) => string)

function getTranslation(locale: Locale, path: string): TranslationValue {
  const keys = path.split(".")
  let value: unknown = translations[locale] as TranslationDict
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return value as TranslationValue
}

/**
 * Returns a translation function. Usage: const { t, locale } = useT()
 */
export function useT() {
  const { locale } = useLocale()
  return { locale, t: (path: string): TranslationValue => getTranslation(locale, path) }
}

/**
 * Inline translation component for server components. Usage: <Trans k="site.title" />
 * Each instance is a client component — for repeated use, prefer useT().
 */
export function Trans({
  k,
  args,
  className,
}: {
  k: string
  args?: unknown[]
  className?: string
}) {
  const { locale } = useLocale()
  const value = getTranslation(locale, k)

  if (typeof value === "function") {
    return <span className={className}>{(value as (...a: unknown[]) => string)(...(args || []))}</span>
  }

  return <span className={className}>{value as string}</span>
}
