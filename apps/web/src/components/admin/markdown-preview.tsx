"use client"

import { useDeferredValue } from "react"
import { MarkdownHooks } from "react-markdown"
import remarkGfm from "remark-gfm"
import { mdxComponents } from "@/components/blog/mdx-components"
import { blogRehypePlugins } from "@/lib/mdx-pipeline"
import { useT } from "@/components/layout/trans"
import { cn } from "@/lib/utils"
import { POST_PROSE_CLASSES } from "@/lib/prose"
import { PreviewErrorBoundary } from "@/components/admin/preview-error-boundary"

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { t } = useT()
  // Deferred so typing stays responsive — the preview re-renders with the
  // stale content while the new text is being processed in the background.
  const deferredContent = useDeferredValue(content)

  // Prose classes mirror the public post page (posts/[slug]/page.tsx), and
  // the component map + rehype pipeline are the same as MDXRenderer, so the
  // preview matches the published typography, colors, and code blocks.
  return (
    <div
      className={cn(
        POST_PROSE_CLASSES,
        "min-h-[400px] lg:min-h-[calc(100vh-24rem)] border rounded-lg p-6 bg-card"
      )}
    >
      {deferredContent.trim() ? (
        <PreviewErrorBoundary
          resetKey={deferredContent}
          fallback={
            <p className="text-muted-foreground italic">
              {t("admin.previewError") as string}
            </p>
          }
        >
          <MarkdownHooks
            remarkPlugins={[remarkGfm]}
            rehypePlugins={blogRehypePlugins}
            components={mdxComponents}
            fallback={
              <p className="text-muted-foreground italic">
                {t("admin.previewRendering") as string}
              </p>
            }
          >
            {deferredContent}
          </MarkdownHooks>
        </PreviewErrorBoundary>
      ) : (
        <p className="text-muted-foreground italic">
          {t("admin.previewEmpty") as string}
        </p>
      )}
    </div>
  )
}
