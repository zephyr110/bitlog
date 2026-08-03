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
  // Always start with defaultLocale to match the server render, then sync
  // from localStorage in an effect. Initialising from localStorage in the
  // useState initializer makes the FIRST client render differ from SSR for
  // every translated text node whenever the stored locale ≠ default —
  // a guaranteed hydration failure (React #418) on every page load.
  // DocumentTitle re-runs on locale change (locale is in its effect deps),
  // so the deferred sync still corrects document.title.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = getStoredLocale()
    if (stored && stored !== defaultLocale) {
      setLocaleState(stored) // eslint-disable-line react-hooks/set-state-in-effect -- one-time sync from localStorage on mount (unavailable during SSR)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
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
