import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypePrettyCode, { type Options } from "rehype-pretty-code"
import { type Post } from "@/types"
import { CodeBlock } from "@/components/blog/code-block"
import { HeadingLink } from "@/components/blog/heading-link"

interface MDXRendererProps {
  post: Post
}

const rehypePrettyCodeOptions: Options = {
  theme: "github-dark",
  keepBackground: false,
  defaultLang: "plaintext",
  grid: true,
}

const components = {
  // Headings with anchor links
  h1: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <HeadingLink as="h1" id={id} {...props}>
      {children}
    </HeadingLink>
  ),
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <HeadingLink as="h2" id={id} {...props}>
      {children}
    </HeadingLink>
  ),
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <HeadingLink as="h3" id={id} {...props}>
      {children}
    </HeadingLink>
  ),

  // Paragraphs
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-5 leading-7 text-foreground/90" {...props}>
      {children}
    </p>
  ),

  // Links - external opens in new tab
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = href?.startsWith("http") ?? false
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium underline decoration-primary/40 underline-offset-3 hover:decoration-primary hover:text-primary transition-all"
        {...props}
      >
        {children}
      </a>
    )
  },

  // Images - rounded with shadow and caption support
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        className="rounded-xl shadow-lg border border-border/60 w-full"
        loading="lazy"
        {...props}
      />
      {alt && <figcaption className="mt-3 text-center text-xs text-muted-foreground">{alt}</figcaption>}
    </figure>
  ),

  // Blockquotes - styled with accent border and background
  blockquote: ({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="relative my-6 pl-5 pr-4 py-3 border-l-[3px] border-primary/50 bg-muted/30 rounded-r-lg not-italic"
      {...props}
    >
      <span className="absolute left-2 top-2 text-primary/20 text-4xl leading-none font-serif select-none">&ldquo;</span>
      <div className="relative text-muted-foreground leading-7">
        {children}
      </div>
    </blockquote>
  ),

  // Code blocks
  pre: CodeBlock,

  // Inline code
  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => {
    const isInline = !className?.includes("language-") &&
      !(props as Record<string, unknown>)["data-language"]
    if (isInline) {
      return (
        <code
          className="relative rounded-md bg-muted px-[0.35rem] py-[0.15rem] font-mono text-[0.875em] font-medium text-primary/90 dark:text-primary/80"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },

  // Strong and emphasis
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-foreground/90" {...props}>
      {children}
    </em>
  ),

  // Tables - clean, minimal with hover rows
  table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-border/60 shadow-sm">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted/60 border-b" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" {...props}>
      {children}
    </th>
  ),
  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="transition-colors hover:bg-muted/30" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 align-middle" {...props}>
      {children}
    </td>
  ),

  // Keyboard input
  kbd: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <kbd
      className="inline-flex items-center rounded-md border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground shadow-[0_1px_1px_rgb(0,0,0,0.08)]"
      {...props}
    >
      {children}
    </kbd>
  ),

  // Horizontal rule
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-10 border-t border-dashed border-border/80" {...props} />
  ),

  // Unordered list
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-5 space-y-2 list-disc pl-6 marker:text-primary/60" {...props}>
      {children}
    </ul>
  ),

  // Ordered list
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-5 space-y-2 list-decimal pl-6 marker:text-muted-foreground/70" {...props}>
      {children}
    </ol>
  ),

  // List item with better nested spacing
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1 leading-7" {...props}>
      {children}
    </li>
  ),
}

export function MDXRenderer({ post }: MDXRendererProps) {
  return (
    <article className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:no-underline">
      <MDXRemote
        source={post.content}
        options={{
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions] as never],
          },
        }}
        components={components}
      />
    </article>
  )
}
