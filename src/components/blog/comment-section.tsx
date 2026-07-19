"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useT } from "@/components/layout/trans"
import { useLocale } from "@/components/layout/i18n-provider"

export function CommentSection() {
  const { t } = useT()
  const { locale } = useLocale()
  const { resolvedTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Only render in production (when hostname is not localhost)
    if (window.location.hostname === "localhost") return

    const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || ""
    const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ""
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "Announcements"
    const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ""

    if (!repo || !repoId || !categoryId) return

    const theme = resolvedTheme === "dark" ? "dark" : "light"
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
    script.setAttribute("data-repo", repo)
    script.setAttribute("data-repo-id", repoId)
    script.setAttribute("data-category", category)
    script.setAttribute("data-category-id", categoryId)
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
      container.appendChild(script)
    }

    return () => {
      if (container && script.parentNode) {
        container.removeChild(script)
      }
      initialized.current = false
    }
  }, [mounted, resolvedTheme, locale])

  // Server-side and before mount: render nothing (same as client initial render)
  if (!mounted) {
    return (
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="border-t pt-12" />
      </section>
    )
  }

  const isDev = window.location.hostname === "localhost"
  const hasGiscus = !!process.env.NEXT_PUBLIC_GISCUS_REPO

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="border-t pt-12">
        <h2 className="text-xl font-bold mb-6">{t("post.comments") as string}</h2>

        {isDev || !hasGiscus ? (
          <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-2">
              {isDev
                ? "Comments are disabled in development"
                : "Comments are not configured"}
            </p>
            <p>
              To enable Giscus comments, configure the following environment
              variables:
            </p>
            <pre className="mt-3 text-left bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {`NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id`}
            </pre>
            <p className="mt-3 text-xs">
              Get these values at{" "}
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
          <div ref={ref} />
        )}
      </div>
    </section>
  )
}
