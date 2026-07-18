"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import { type Locale, defaultLocale } from "@/lib/i18n"

const STORAGE_KEY = "blog-locale"

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
})

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "zh" || stored === "en") return stored
  } catch {}
  return defaultLocale
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Lazy init: read from localStorage on first render
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }, [])

  // Sync on mount in case lazy init missed (SSR → client hydration)
  useEffect(() => {
    const stored = getStoredLocale()
    if (stored !== locale) {
      setLocaleState(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useLocale(): I18nContextValue {
  return useContext(I18nContext)
}
