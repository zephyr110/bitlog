"use client"

import { useEffect, useId, useRef, useState } from "react"
import { CodeBlock } from "@/components/blog/code-block"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/components/layout/trans"
import { cn } from "@/lib/utils"

interface RenderResult {
  code: string
  svg: string
  failed: boolean
}

// mermaid (~2MB) loads lazily and is initialized once per page — the
// config merge on every initialize call is pure waste for N diagrams.
let mermaidPromise: ReturnType<typeof importMermaid> | null = null
function importMermaid() {
  return import("mermaid").then(async ({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
    })
    return mermaid
  })
}
function getMermaid() {
  if (!mermaidPromise) mermaidPromise = importMermaid()
  return mermaidPromise
}

/** Renders a ```mermaid code block into an SVG, client-side.
 *
 *  Robustness notes:
 *  - Debounced (350ms) so the editor preview doesn't run a full mermaid
 *    parse + dagre layout on every keystroke.
 *  - Each render gets a fresh id (useId + run counter): mermaid's temp
 *    element for a re-used id would otherwise be removed by the newer
 *    render mid-flight, racing the older one.
 *  - The result is keyed by the source; while a new render is in flight
 *    the previous SVG stays visible (no skeleton flash per keystroke),
 *    and only the newest run may set state.
 *  - The diagram sits on a light card so the "default" theme stays
 *    readable in both light and dark mode. */
export function Mermaid({ code, className }: { code: string; className?: string }) {
  const { t } = useT()
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const runRef = useRef(0)
  const [result, setResult] = useState<RenderResult | null>(null)

  useEffect(() => {
    if (!code.trim()) return

    const timer = setTimeout(() => {
      const run = ++runRef.current
      getMermaid()
        .then(async (mermaid) => {
          const { svg } = await mermaid.render(`${baseId}-${run}`, code)
          if (run === runRef.current) setResult({ code, svg, failed: false })
        })
        .catch((err) => {
          console.error("Mermaid render failed:", err)
          if (run === runRef.current) setResult({ code, svg: "", failed: true })
        })
    }, 350)

    return () => clearTimeout(timer)
  }, [code, baseId])

  if (!code.trim()) {
    // Empty fence while drafting — neutral placeholder, no error UI.
    return (
      <div
        aria-hidden
        className="my-8 h-24 rounded-xl border border-dashed border-border/60"
      />
    )
  }

  const current = result && result.code === code ? result : null
  // While a new render is in flight, keep the previous SVG on screen
  // (flicker-free); only the very first load shows the skeleton.
  const visibleSvg =
    current && !current.failed
      ? current.svg
      : !current && result && !result.failed
        ? result.svg
        : null

  if (current?.failed) {
    return (
      <div className="my-8">
        <p className="mb-2 text-xs text-muted-foreground">
          {t("post.mermaidError") as string}
        </p>
        <CodeBlock data-language="mermaid">
          <code>{code}</code>
        </CodeBlock>
      </div>
    )
  }

  if (!visibleSvg) {
    return <Skeleton aria-hidden className="my-8 h-40 rounded-xl" />
  }

  return (
    <div
      className={cn(
        "my-8 overflow-x-auto rounded-xl border border-border/60 bg-white p-4",
        className
      )}
      // mermaid output is sanitized (securityLevel: "strict") before
      // it reaches this point.
      dangerouslySetInnerHTML={{ __html: visibleSvg }}
    />
  )
}
