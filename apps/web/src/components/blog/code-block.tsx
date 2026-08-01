"use client"

import { useCallback, useRef, type ComponentProps } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/layout/trans"
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard"

interface CodeBlockProps extends ComponentProps<"pre"> {
  "data-language"?: string
}

export function CodeBlock({
  children,
  className,
  "data-language": dataLanguage,
  ...props
}: CodeBlockProps) {
  const { t } = useT()
  const preRef = useRef<HTMLPreElement>(null)
  const { copied, copy } = useCopyToClipboard()

  const raw = (props as Record<string, unknown>)
  const title = typeof raw["data-title"] === "string" ? raw["data-title"] as string : undefined
  const lang = dataLanguage || undefined

  const handleCopy = useCallback(async () => {
    const code = preRef.current?.querySelector("code")
    if (!code) return
    await copy(code.textContent || "")
  }, [copy])

  return (
    <div className="group/code relative my-8 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          {title ? (
            <span className="text-xs text-zinc-400 font-medium truncate">
              {title}
            </span>
          ) : lang ? (
            <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              {lang}
            </span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "h-7 px-2 rounded-md text-xs gap-1.5 -mr-1 transition-all",
            copied
              ? "text-emerald-400 opacity-100 hover:text-emerald-300 hover:bg-emerald-500/10"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
          )}
        >
          {copied ? (
            <>
              <Check size={13} />
              {t("post.codeCopied") as string}
            </>
          ) : (
            <>
              <Copy size={13} />
              {t("post.copyCode") as string}
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="relative bg-zinc-950 dark:bg-zinc-950">
        <pre
          ref={preRef}
          className={cn(
            "code-block line-numbers overflow-x-auto p-4 text-sm leading-relaxed",
            className
          )}
          {...props}
        >
          {children}
        </pre>
      </div>
    </div>
  )
}
