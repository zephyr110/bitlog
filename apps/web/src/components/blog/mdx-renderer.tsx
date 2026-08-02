import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { type Post } from "@zlog/database"
import { mdxComponents } from "@/components/blog/mdx-components"
import { blogRehypePlugins } from "@/lib/mdx-pipeline"

interface MDXRendererProps {
  post: Post
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
            rehypePlugins: blogRehypePlugins,
          },
        }}
        components={mdxComponents}
      />
    </article>
  )
}
