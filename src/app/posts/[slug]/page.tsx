import { notFound } from "next/navigation"
import { type Metadata } from "next"
import Link from "next/link"
import { getPostBySlug, getPublishedPosts } from "@/lib/content"
import { siteConfig } from "@/lib/site-config"
import { MDXRenderer } from "@/components/blog/mdx-renderer"
import { TagBadge } from "@/components/blog/tag-badge"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { CopyLinkButton } from "@/components/blog/share-buttons"
import { CommentSection } from "@/components/blog/comment-section"
import { Trans } from "@/components/layout/trans"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ogImageUrl = (path: string) =>
  path.startsWith("http") ? path : `${siteConfig.siteUrl}${path}`

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "Not Found" }

  const postImage = post.cover
    ? ogImageUrl(post.cover)
    : `${siteConfig.siteUrl}${siteConfig.ogImage}`

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [postImage],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post || post.draft) notFound()

  const relatedPosts = getPublishedPosts()
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3)

  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      <ReadingProgress />

      <article className="min-h-screen">
        {/* Hero Header */}
        <header className="relative border-b bg-muted/10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />

          <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl relative">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                <Trans k="site.home" />
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-foreground/70 truncate max-w-[200px]">
                {post.title}
              </span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-500">
              {post.title}
            </h1>

            {/* Description */}
            {post.description && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {post.description}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground animate-in fade-in duration-700">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    A
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{siteConfig.author.name}</p>
                  <div className="flex items-center gap-1.5 text-xs">
                    <time dateTime={post.date}>{date}</time>
                    <span className="opacity-40">·</span>
                    <span><Trans k="post.minRead" args={[post.readingTime]} /></span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <>
                  <span className="hidden md:block opacity-20">|</span>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} href={`/tags/${encodeURIComponent(tag.toLowerCase())}`} />
                    ))}
                  </div>
                </>
              )}

              {/* Share */}
              <div className="ml-auto flex items-center gap-1">
                <CopyLinkButton url={`/posts/${post.slug}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-img:rounded-xl prose-pre:border prose-pre:bg-muted/30">
            <MDXRenderer post={post} />
          </div>

          {/* Post Footer */}
          <Separator className="my-12" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} href={`/tags/${encodeURIComponent(tag.toLowerCase())}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton url={`/posts/${post.slug}`} />
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t bg-muted/10">
            <div className="container mx-auto px-4 py-16 max-w-3xl">
              <h2 className="text-2xl font-bold mb-8"><Trans k="post.relatedPosts" /></h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/posts/${rp.slug}`}
                    className="group block p-4 rounded-xl border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {rp.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to top */}
        <div className="text-center py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← <Trans k="site.backToPosts" />
          </Link>
        </div>
      </article>
    </>
  )
}