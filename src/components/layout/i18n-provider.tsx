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

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "zh" || stored === "en") return stored
  } catch {}
  return null
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with the default locale to match the server render. We then sync
  // from localStorage on mount to avoid a hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = getStoredLocale()
    if (stored && stored !== locale) {
      setLocaleState(stored) // eslint-disable-line react-hooks/set-state-in-effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <span suppressHydrationWarning className="contents">
        {children}
      </span>
    </I18nContext.Provider>
  )
}

export function useLocale(): I18nContextValue {
  return useContext(I18nContext)
}
