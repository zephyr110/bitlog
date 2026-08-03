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
  // Initialise from localStorage immediately so child effects (e.g.
  // DocumentTitle) read the correct locale on first render instead of
  // waiting for this effect's deferred sync. SSR always uses defaultLocale,
  // so a stored locale different from the default may cause a one-off
  // hydration mismatch — the wrapper span has suppressHydrationWarning.
  const [locale, setLocaleState] = useState<Locale>(
    () => getStoredLocale() ?? defaultLocale,
  )

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
