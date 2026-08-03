/* Shared rehype pipeline for article content — the ONE place that
   encodes plugin order. Consumed by the public post page (MDXRenderer,
   server-side via next-mdx-remote) and the admin editor preview
   (react-markdown MarkdownHooks, client-side), so both surfaces render
   identically.

   Order matters: rehypeMermaidBlock must run BEFORE rehype-pretty-code
   (it empties mermaid pres, which pretty-code would otherwise treat as
   block code and highlight as plaintext). */

import rehypePrettyCode, { type Options } from "rehype-pretty-code"
import { rehypeMermaidBlock } from "@/lib/rehype-mermaid-block"

const rehypePrettyCodeOptions: Options = {
  // Dual themes: every token span gets `--shiki-light`/`--shiki-dark` CSS
  // variables; globals.css picks one based on `html.dark`.
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  defaultLang: "plaintext",
  grid: true,
}

export const blogRehypePlugins = [
  rehypeMermaidBlock,
  [rehypePrettyCode, rehypePrettyCodeOptions] as never,
] as never[]
