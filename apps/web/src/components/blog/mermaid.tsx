"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { CodeBlock } from "@/components/blog/code-block"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/components/layout/trans"
import { cn } from "@/lib/utils"

interface RenderResult {
  code: string
  svg: string
  failed: boolean
}

type MermaidColorScheme = "light" | "dark"

/* Cursor-IDE-style flat palettes: neutral gray nodes, hairline borders,
   transparent background, and a single blue accent on arrowheads.
   `theme: "base"` is mermaid's blank slate meant for full overrides. */
const MERMAID_THEME_VARIABLES: Record<
  MermaidColorScheme,
  Record<string, string>
> = {
  light: {
    background: "transparent",
    primaryColor: "#e8e8ea",
    primaryBorderColor: "#cfcfd4",
    primaryTextColor: "#24292f",
    secondaryColor: "#efeff1",
    tertiaryColor: "#f4f4f5",
    lineColor: "#8b8b92",
    textColor: "#24292f",
    clusterBkg: "#f8f8f9",
    clusterBorder: "#d8d8dc",
    titleColor: "#24292f",
    edgeLabelBackground: "#ffffff",
    nodeTextColor: "#24292f",
    // sequence / note basics, kept in the same flat register
    actorBkg: "#e8e8ea",
    actorBorder: "#cfcfd4",
    actorTextColor: "#24292f",
    signalColor: "#8b8b92",
    signalTextColor: "#24292f",
    noteBkg: "#f4f4f5",
    noteBorder: "#d8d8dc",
    noteTextColor: "#24292f",
    labelTextColor: "#24292f",
  },
  dark: {
    background: "transparent",
    primaryColor: "#2f3138",
    primaryBorderColor: "#43464e",
    primaryTextColor: "#d6d8de",
    secondaryColor: "#2a2c32",
    tertiaryColor: "#26282e",
    lineColor: "#6e7178",
    textColor: "#d6d8de",
    clusterBkg: "#25262b",
    clusterBorder: "#3a3c43",
    titleColor: "#c9ccd3",
    edgeLabelBackground: "#1e1e20",
    nodeTextColor: "#d6d8de",
    actorBkg: "#2f3138",
    actorBorder: "#43464e",
    actorTextColor: "#d6d8de",
    signalColor: "#6e7178",
    signalTextColor: "#d6d8de",
    noteBkg: "#26282e",
    noteBorder: "#3a3c43",
    noteTextColor: "#d6d8de",
    labelTextColor: "#d6d8de",
  },
}

// The one accent color in the whole diagram: arrowheads. lineColor stays
// gray, markers get the blue via themeCSS (mermaid has no variable that
// separates marker color from edge color).
const ARROW_ACCENT: Record<MermaidColorScheme, string> = {
  light: "#4a90c4",
  dark: "#5f9fd6",
}

const FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

// mermaid (~2MB) loads lazily. Its config is global, so we track which
// color scheme was last applied and only re-initialize when the theme
// actually flips — not on every render.
let mermaidPromise: Promise<
  Awaited<ReturnType<typeof importMermaid>>
> | null = null
let appliedScheme: MermaidColorScheme | null = null

function importMermaid() {
  return import("mermaid").then(({ default: mermaid }) => mermaid)
}

async function getMermaid(scheme: MermaidColorScheme) {
  if (!mermaidPromise) mermaidPromise = importMermaid()
  const mermaid = await mermaidPromise
  if (appliedScheme !== scheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "strict",
      fontFamily: FONT_FAMILY,
      themeVariables: MERMAID_THEME_VARIABLES[scheme],
      themeCSS: `
        .marker, .marker path, .marker cross, .marker circle {
          fill: ${ARROW_ACCENT[scheme]} !important;
          stroke: ${ARROW_ACCENT[scheme]} !important;
        }
        .edgePath path { stroke-width: 1.25px; }
        .node rect, .node polygon, .node circle { stroke-width: 1px; }
        .cluster rect { stroke-width: 1px; }
      `,
    })
    appliedScheme = scheme
  }
  return mermaid
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
 *  - The diagram re-renders when the site theme flips; the SVG has a
 *    transparent background and sits directly on the page (no card),
 *    so it blends into both light and dark mode. */
export function Mermaid({ code, className }: { code: string; className?: string }) {
  const { t } = useT()
  const { resolvedTheme } = useTheme()
  const scheme: MermaidColorScheme = resolvedTheme === "dark" ? "dark" : "light"
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const runRef = useRef(0)
  const [result, setResult] = useState<RenderResult | null>(null)

  useEffect(() => {
    if (!code.trim()) return

    const timer = setTimeout(() => {
      const run = ++runRef.current
      getMermaid(scheme)
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
  }, [code, baseId, scheme])

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
        "my-8 overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full",
        className
      )}
      // mermaid output is sanitized (securityLevel: "strict") before
      // it reaches this point.
      dangerouslySetInnerHTML={{ __html: visibleSvg }}
    />
  )
}
