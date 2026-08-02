import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypePrettyCode, { type Options } from "rehype-pretty-code"
import { type Post } from "@zlog/database"
import { mdxComponents } from "@/components/blog/mdx-components"

interface MDXRendererProps {
  post: Post
}

const rehypePrettyCodeOptions: Options = {
  theme: "github-dark",
  keepBackground: false,
  defaultLang: "plaintext",
  grid: true,
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
        components={mdxComponents}
      />
    </article>
  )
}
