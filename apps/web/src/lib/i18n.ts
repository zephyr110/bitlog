import { site } from "./i18n/site"
import { post } from "./i18n/post"
import { about } from "./i18n/about"
import { a11y } from "./i18n/a11y"
import { cat } from "./i18n/cat"
import { timeline } from "./i18n/timeline"
import { archive } from "./i18n/archive"
import { category } from "./i18n/category"
import { admin } from "./i18n/admin"

export type Locale = "zh" | "en"

export const locales: Locale[] = ["zh", "en"]

export const defaultLocale: Locale = "zh"

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "English",
}

export const translations = {
  zh: {
    site: site.zh,
    post: post.zh,
    about: about.zh,
    a11y: a11y.zh,
    cat: cat.zh,
    timeline: timeline.zh,
    archive: archive.zh,
    category: category.zh,
    admin: admin.zh,
  },
  en: {
    site: site.en,
    post: post.en,
    about: about.en,
    a11y: a11y.en,
    cat: cat.en,
    timeline: timeline.en,
    archive: archive.en,
    category: category.en,
    admin: admin.en,
  },
} as const

export type TranslationDict = typeof translations.zh

export function t(
  locale: Locale,
  path: string
): string | ((...args: unknown[]) => string) {
  const keys = path.split(".")
  let value: unknown = translations[locale]
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return value as string | ((...args: unknown[]) => string)
}
