import { MDXRemote } from "next-mdx-remote/rsc"
import { type Post } from "@/types"

interface MDXRendererProps {
  post: Post
}

export function MDXRenderer({ post }: MDXRendererProps) {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <MDXRemote source={post.content} />
    </article>
  )
}
