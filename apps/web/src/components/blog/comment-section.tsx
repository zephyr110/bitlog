"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useT } from "@/components/layout/trans"
import { useLocale } from "@/components/layout/i18n-provider"
import { MessageSquare } from "lucide-react"

const GISCUS_ENV = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "Announcements",
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
}

const hasGiscusConfig =
  !!GISCUS_ENV.repo && !!GISCUS_ENV.repoId && !!GISCUS_ENV.categoryId

export function CommentSection() {
  const { t } = useT()
  const { locale } = useLocale()
  const { resolvedTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(hasGiscusConfig)
  // giscus maps discussions by pathname and logs a "Discussion not found"
  // console warning for every uncommented post — noisy in local dev, so
  // the widget is skipped on localhost entirely (production unaffected).
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
    setIsLocalhost(
      window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    )
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!hasGiscusConfig || isLocalhost) return

    // Themed via self-hosted stylesheets (public/giscus-{light,dark}.css)
    // so the widget matches the site's neutral palette instead of
    // GitHub's blue-on-white default. The URL must be absolute — the
    // giscus iframe fetches it from our origin, which works on both the
    // Vercel and GitHub Pages deployments. ?v= busts the CDN cache when
    // the theme file changes.
    const theme =
      resolvedTheme === "dark"
        ? `${window.location.origin}/giscus-dark.css?v=1`
        : `${window.location.origin}/giscus-light.css?v=1`
    const lang = locale === "zh" ? "zh-CN" : "en"

    // If already initialized, send a message to the iframe to update theme/lang.
    if (initialized.current) {
      const iframe =
        ref.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame")
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme, lang } } },
          "https://giscus.app"
        )
      }
      return
    }

    initialized.current = true

    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.setAttribute("data-repo", GISCUS_ENV.repo!)
    script.setAttribute("data-repo-id", GISCUS_ENV.repoId!)
    script.setAttribute("data-category", GISCUS_ENV.category)
    script.setAttribute("data-category-id", GISCUS_ENV.categoryId!)
    script.setAttribute("data-mapping", "pathname")
    script.setAttribute("data-strict", "0")
    script.setAttribute("data-reactions-enabled", "1")
    script.setAttribute("data-emit-metadata", "0")
    script.setAttribute("data-input-position", "bottom")
    script.setAttribute("data-theme", theme)
    script.setAttribute("data-lang", lang)
    script.setAttribute("crossorigin", "anonymous")
    script.async = true

    const container = ref.current
    if (container) {
      container.innerHTML = ""
      container.appendChild(script)
    }

    // Hide loading skeleton once giscus iframe is created.
    const observer = new MutationObserver(() => {
      const iframe = container?.querySelector("iframe.giscus-frame")
      if (iframe) {
        setLoading(false)
        observer.disconnect()
      }
    })
    if (container) {
      observer.observe(container, { childList: true, subtree: true })
    }

    return () => {
      observer.disconnect()
      if (container) {
        container.innerHTML = ""
      }
      initialized.current = false
    }
  }, [mounted, resolvedTheme, locale, isLocalhost])

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl 2xl:max-w-7xl">
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare size={18} />
          </span>
          <h2 className="text-xl font-bold">{t("post.comments") as string}</h2>
        </div>

        {(!mounted || loading) && hasGiscusConfig && !isLocalhost ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ) : null}

        {mounted && isLocalhost ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("post.commentsDisabledDev") as string}
          </p>
        ) : mounted && !hasGiscusConfig ? (
          <div className="rounded-xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">
              {t("post.commentsNotConfigured") as string}
            </p>
            <p>{t("post.configureGiscus") as string}</p>
            <pre className="mt-4 text-left bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id`}
            </pre>
            <p className="mt-3 text-xs">
              {t("post.getValuesAt") as string}{" "}
              <a
                href="https://giscus.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                giscus.app
              </a>
            </p>
          </div>
        ) : (
          <div ref={ref} className={loading ? "min-h-[200px]" : undefined} />
        )}
      </div>
    </section>
  )
}
